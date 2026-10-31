import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';

export interface BillingStatus {
  allowed: boolean;
  isPremium: boolean;
  availableCredits: number;
  costPerSession: number;
  maxSessionMinutes: number;
  remainingMinutesToday: number;
}

@Injectable()
export class InterviewBillingService {
  private readonly logger = new Logger(InterviewBillingService.name);

  // Configuration standards
  private readonly DEFAULT_SESSION_CREDIT_COST = 10;
  private readonly MAX_SESSION_DURATION_MINUTES = 30;
  private readonly MAX_TURNS_PER_SESSION = 15;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if candidate is entitled to access AI Interview Studio (Phần 10.1 & 10.2)
   * FAIL-CLOSED: AI Interview Studio is strictly reserved for Pro / Premium users.
   */
  async checkEntitlement(userId: string): Promise<BillingStatus> {
    if (!userId) {
      return {
        allowed: false,
        isPremium: false,
        availableCredits: 0,
        costPerSession: this.DEFAULT_SESSION_CREDIT_COST,
        maxSessionMinutes: 0,
        remainingMinutesToday: 0,
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isPremium =
      user?.role === Role.PREMIUM_USER ||
      user?.role === Role.ADMIN ||
      user?.role === Role.SUPER_ADMIN;

    return {
      allowed: Boolean(isPremium),
      isPremium: Boolean(isPremium),
      availableCredits: isPremium ? 999 : 0,
      costPerSession: this.DEFAULT_SESSION_CREDIT_COST,
      maxSessionMinutes: isPremium ? this.MAX_SESSION_DURATION_MINUTES : 0,
      remainingMinutesToday: isPremium ? 120 : 0,
    };
  }

  /**
   * Strictly enforces Pro entitlement across all endpoints (Fail-Closed)
   */
  async ensureProEntitlement(userId: string): Promise<void> {
    const entitlement = await this.checkEntitlement(userId);
    if (!entitlement.allowed) {
      throw new ForbiddenException(
        'AI Interview Studio là đặc quyền dành riêng cho học viên gói Pro / Premium. Vui lòng nâng cấp tài khoản để bắt đầu phòng phỏng vấn 1:1 với AI.'
      );
    }
  }

  /**
   * Reserve credits with idempotency key before starting session (Phần 10.3)
   */
  async reserveSessionCredits(userId: string, sessionId?: string | null, idempotencyKey?: string) {
    await this.ensureProEntitlement(userId);

    const key = idempotencyKey || `session_res_${userId}_${sessionId || Date.now()}`;
    const existing = await this.prisma.interviewCreditTransaction.findUnique({
      where: { idempotencyKey: key },
    });
    if (existing) {
      return existing;
    }

    const validSessionId = sessionId && sessionId !== 'temp' ? sessionId : undefined;

    return this.prisma.interviewCreditTransaction.create({
      data: {
        userId,
        sessionId: validSessionId,
        amount: this.DEFAULT_SESSION_CREDIT_COST,
        type: 'RESERVE',
        idempotencyKey: key,
        reason: 'Khóa giữ tạm thời chi phí phiên phỏng vấn AI Studio',
      },
    });
  }

  /**
   * Settle credits based on actual session usage (Phần 10.3)
   */
  async settleSessionCredits(userId: string, sessionId: string, actualDurationSec: number, turnsCount: number) {
    const idempotencyKey = `settle_${sessionId}_${Date.now()}`;
    const today = new Date().toISOString().slice(0, 10);

    // Track usage record
    await this.prisma.entitlementUsage.upsert({
      where: { userId_date: { userId, date: today } },
      create: {
        userId,
        date: today,
        aiUsageCount: 1,
      },
      update: {
        aiUsageCount: { increment: 1 },
      },
    });

    return this.prisma.interviewCreditTransaction.create({
      data: {
        userId,
        sessionId,
        amount: this.DEFAULT_SESSION_CREDIT_COST,
        type: 'SETTLE',
        idempotencyKey,
        reason: `Quyết toán phiên phỏng vấn: ${Math.round(actualDurationSec / 60)} phút, ${turnsCount} lượt hỏi đáp.`,
      },
    });
  }

  /**
   * Refund or release reserved credits on system failure or cancellation (Phần 10.3)
   */
  async refundSessionCredits(userId: string, sessionId: string, reason: string) {
    const idempotencyKey = `refund_${sessionId}_${Date.now()}`;
    return this.prisma.interviewCreditTransaction.create({
      data: {
        userId,
        sessionId,
        amount: this.DEFAULT_SESSION_CREDIT_COST,
        type: 'REFUND',
        idempotencyKey,
        reason: `Hoàn trả credit: ${reason}`,
      },
    });
  }

  getMaxTurnsLimit(): number {
    return this.MAX_TURNS_PER_SESSION;
  }
}
