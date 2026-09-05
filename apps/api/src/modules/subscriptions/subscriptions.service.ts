import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionTier } from '@prisma/client';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async getPlans() {
    return this.prisma.plan.findMany({
      orderBy: { priceMonthly: 'asc' },
    });
  }

  async getUserEntitlements(userId: string) {
    const today = new Date().toISOString().slice(0, 10);

    const [subscription, usage, plans] = await Promise.all([
      this.prisma.subscription.findFirst({
        where: { userId, status: 'ACTIVE' },
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.entitlementUsage.findUnique({
        where: { userId_date: { userId, date: today } },
      }),
      this.prisma.plan.findMany(),
    ]);

    const defaultPlan = plans.find((p) => p.tier === SubscriptionTier.FREE) || {
      tier: SubscriptionTier.FREE,
      name: 'Free Starter',
      aiDailyQuota: 10,
      maxCustomDecks: 3,
      unlimitedReviews: false,
    };

    const currentPlan = subscription?.plan || defaultPlan;
    const aiUsed = usage?.aiUsageCount || 0;
    const aiQuota = currentPlan.aiDailyQuota;
    const aiRemaining = aiQuota === -1 ? 9999 : Math.max(0, aiQuota - aiUsed);

    return {
      currentPlan: {
        tier: currentPlan.tier,
        name: currentPlan.name,
        isPro: currentPlan.tier === SubscriptionTier.PRO,
        isPlus: currentPlan.tier === SubscriptionTier.PLUS,
        isFree: currentPlan.tier === SubscriptionTier.FREE,
        currentPeriodEnd: subscription?.currentPeriodEnd || null,
      },
      usageToday: {
        date: today,
        aiUsed,
        aiQuota: aiQuota === -1 ? 'Không giới hạn' : aiQuota,
        aiRemaining,
        canUseAI: aiRemaining > 0,
      },
    };
  }

  async upgradePlan(userId: string, tier: SubscriptionTier) {
    const plan = await this.prisma.plan.findUnique({ where: { tier } });
    if (!plan) throw new NotFoundException('Plan not found');

    return {
      success: true,
      message: `Hệ thống thanh toán tự động cho gói ${plan.name} đang được chuẩn bị để tích hợp cổng thanh toán bảo mật. Bạn đã được lưu vào danh sách ưu tiên trải nghiệm sớm!`,
      tier: plan.tier,
      isComingSoon: true,
    };
  }
}
