import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BankType, GrantStatus } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

import { UsageService } from '../subscriptions/usage.service';

export interface CreateAccessKeyDto {
  bankType: 'VOCABULARY' | 'EXAM';
  bankId: string;
  targetUserId: string;
  forceRegenerate?: boolean;
}

export interface VerifyAccessKeyDto {
  bankType: 'VOCABULARY' | 'EXAM';
  bankId: string;
  accessKey: string;
}

@Injectable()
export class AccessKeyService {
  private readonly logger = new Logger(AccessKeyService.name);

  constructor(
    private prisma: PrismaService,
    private usageService: UsageService,
  ) {}

  /**
   * Hash secret access key for secure database storage
   */
  private hashKey(secret: string): string {
    return crypto.createHash('sha256').update(secret.trim()).digest('hex');
  }

  /**
   * Verify whether the current user is the owner of the specified bank
   */
  async verifyBankOwnership(
    userId: string,
    bankType: 'VOCABULARY' | 'EXAM',
    bankId: string,
    userRole?: string,
  ): Promise<{ bankTitle: string; isProtected: boolean; passwordHash: string | null; cleanBankId: string }> {
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    const cleanBankId = String(bankId).replace(/^cloned_/, '');

    if (bankType === 'VOCABULARY') {
      const deck = await this.prisma.communityDeck.findUnique({
        where: { id: cleanBankId },
        select: { id: true, userId: true, title: true, isProtected: true, passwordHash: true },
      });
      if (!deck) throw new NotFoundException('Kho từ vựng không tồn tại');
      if (deck.userId !== userId && !isAdmin) {
        throw new ForbiddenException('Bạn không phải là chủ sở hữu của kho từ vựng này');
      }
      return { bankTitle: deck.title, isProtected: deck.isProtected, passwordHash: deck.passwordHash, cleanBankId };
    } else {
      const exam = await this.prisma.exam.findUnique({
        where: { id: cleanBankId },
        select: { id: true, authorId: true, title: true, isProtected: true, passwordHash: true },
      });
      if (!exam) throw new NotFoundException('Bộ đề thi không tồn tại');
      if (exam.authorId !== userId && !isAdmin) {
        throw new ForbiddenException('Bạn không phải là chủ sở hữu của bộ đề thi này');
      }
      return { bankTitle: exam.title, isProtected: exam.isProtected, passwordHash: exam.passwordHash, cleanBankId };
    }
  }

  /**
   * Search users for access granting
   */
  async searchUsers(query: string, currentUserId: string) {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    return this.prisma.user.findMany({
      where: {
        AND: [
          { id: { not: currentUserId } },
          { status: 'ACTIVE' },
          {
            OR: [
              { email: { contains: q, mode: 'insensitive' } },
              { displayName: { contains: q, mode: 'insensitive' } },
              { username: { contains: q, mode: 'insensitive' } },
              { id: q },
            ],
          },
        ],
      },
      select: {
        id: true,
        displayName: true,
        email: true,
        avatar: true,
      },
      take: 10,
    });
  }

  /**
   * Owner creates or regenerates an access key for a specific student user
   */
  async createAccessKey(ownerId: string, userRole: string, dto: CreateAccessKeyDto) {
    const { bankType, targetUserId, forceRegenerate } = dto;
    const cleanBankId = String(dto.bankId).replace(/^cloned_/, '');

    if (ownerId === targetUserId) {
      throw new BadRequestException('Bạn là chủ sở hữu kho, không cần tự tạo access key cho chính mình');
    }

    // 1. Verify owner & bank existence from real DB records (Never asking for owner's bank password)
    const bank = await this.verifyBankOwnership(ownerId, bankType, cleanBankId, userRole);

    // 2. Verify target user exists
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, displayName: true, email: true },
    });
    if (!targetUser) throw new NotFoundException('Người dùng mục tiêu không tồn tại');

    // 3. Check existing grant (Single active key per user per bank rule)
    const existingGrant = await this.prisma.bankAccessGrant.findUnique({
      where: {
        bankId_userId: {
          bankId: cleanBankId,
          userId: targetUserId,
        },
      },
    });

    if (existingGrant && !forceRegenerate) {
      return {
        alreadyHasKey: true,
        existingGrant: {
          id: existingGrant.id,
          status: existingGrant.status,
          createdAt: existingGrant.createdAt,
          lastUsedAt: existingGrant.lastUsedAt,
        },
        message: 'Người dùng này đã từng được cấp Access Key. Tạo key mới sẽ vô hiệu hóa key cũ.',
      };
    }

    if (!existingGrant) {
      const quota = await this.usageService.getFeatureStatus(ownerId, 'ACCESS_KEYS');
      if (!quota.allowed) {
        throw new ForbiddenException(`Bạn đã đạt giới hạn tối đa ${quota.limit} access keys của gói hiện tại. Vui lòng nâng cấp gói để tạo thêm.`);
      }
    }

    // 4. Generate cryptographically secure random key
    const shortBankId = cleanBankId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
    const entropyHex = crypto.randomBytes(16).toString('hex').toUpperCase(); // High entropy
    const prefix = bankType === 'EXAM' ? 'EXM' : 'VCB';
    const plainAccessKey = `VF-${prefix}-${shortBankId}-${entropyHex.substring(0, 16)}`;
    const tokenHash = this.hashKey(plainAccessKey);

    // 5. Save or update record with tokenHash (NEVER store plain secret in DB)
    const grant = await this.prisma.bankAccessGrant.upsert({
      where: {
        bankId_userId: {
          bankId: cleanBankId,
          userId: targetUserId,
        },
      },
      create: {
        bankType,
        bankId: cleanBankId,
        userId: targetUserId,
        createdBy: ownerId,
        tokenHash,
        status: GrantStatus.ACTIVE,
        createdAt: new Date(),
        revokedAt: null,
      },
      update: {
        tokenHash,
        status: GrantStatus.ACTIVE,
        createdAt: new Date(),
        revokedAt: null,
        lastUsedAt: null,
      },
      include: {
        user: {
          select: { id: true, displayName: true, email: true, avatar: true },
        },
      },
    });

    // 6. Create notification for target user
    try {
      await this.prisma.notification.create({
        data: {
          userId: targetUserId,
          type: 'ACCESS_GRANTED',
          title: `Đã được cấp quyền truy cập: ${bank.bankTitle}`,
          body: `Chủ kho đã tạo Access Key riêng cho bạn để truy cập kho ${bankType === 'EXAM' ? 'bộ đề' : 'từ vựng'}.`,
          data: {
            bankId: cleanBankId,
            bankType,
            bankTitle: bank.bankTitle,
            ownerId,
          },
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to dispatch notification for access key: ${err.message}`);
    }

    return {
      success: true,
      accessKey: plainAccessKey, // Returned ONCE to client for owner to copy/send
      grantId: grant.id,
      bankId: cleanBankId,
      bankType,
      bankTitle: bank.bankTitle,
      user: grant.user,
      createdAt: grant.createdAt,
      message: 'Access Key đã được tạo thành công!',
    };
  }

  /**
   * User verifies and unlocks a protected bank using their personal access key
   */
  async verifyAndUnlockWithKey(userId: string, dto: VerifyAccessKeyDto) {
    const { bankType, accessKey } = dto;
    const cleanBankId = String(dto.bankId).replace(/^cloned_/, '');
    if (!accessKey?.trim()) throw new BadRequestException('Vui lòng nhập Access Key');

    const tokenHash = this.hashKey(accessKey);

    // Strict validation: key must match bankId AND be assigned to current user
    const grant = await this.prisma.bankAccessGrant.findFirst({
      where: {
        tokenHash,
        bankId: cleanBankId,
        status: GrantStatus.ACTIVE,
        revokedAt: null,
      },
      include: {
        creator: { select: { id: true, displayName: true } },
      },
    });

    if (!grant) {
      throw new ForbiddenException(
        'Access Key không hợp lệ, không tồn tại hoặc đã bị thu hồi',
      );
    }

    if (grant.userId !== userId) {
      throw new ForbiddenException(
        'ACCESS_KEY_NOT_ASSIGNED_TO_USER: Access Key này được cấp riêng cho người dùng khác, bạn không có quyền sử dụng mã này',
      );
    }

    if (grant.expiresAt && grant.expiresAt < new Date()) {
      throw new ForbiddenException('Access Key này đã hết hạn sử dụng');
    }

    // Update lastUsedAt
    await this.prisma.bankAccessGrant.update({
      where: { id: grant.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      success: true,
      unlocked: true,
      bankId: cleanBankId,
      bankType,
      grantId: grant.id,
      grantedBy: grant.creator?.displayName || 'Chủ kho',
      message: 'Xác thực Access Key thành công! Quyền truy cập kho đã được kích hoạt.',
    };
  }

  /**
   * Check whether a user has active access (either owner, admin, or has active grant)
   */
  async checkUserAccess(userId: string, bankType: 'VOCABULARY' | 'EXAM', bankId: string): Promise<boolean> {
    const cleanBankId = String(bankId).replace(/^cloned_/, '');
    if (bankType === 'VOCABULARY') {
      const deck = await this.prisma.communityDeck.findUnique({
        where: { id: cleanBankId },
        select: { userId: true, isProtected: true },
      });
      if (!deck) return false;
      if (!deck.isProtected || deck.userId === userId) return true;
    } else {
      const exam = await this.prisma.exam.findUnique({
        where: { id: cleanBankId },
        select: { authorId: true, isProtected: true },
      });
      if (!exam) return false;
      if (!exam.isProtected || exam.authorId === userId) return true;
    }

    const grant = await this.prisma.bankAccessGrant.findUnique({
      where: {
        bankId_userId: {
          bankId: cleanBankId,
          userId,
        },
      },
      select: { status: true, revokedAt: true, expiresAt: true },
    });

    if (!grant || grant.status !== GrantStatus.ACTIVE || grant.revokedAt) return false;
    if (grant.expiresAt && grant.expiresAt < new Date()) return false;
    return true;
  }

  /**
   * Get all access grants for a bank (Owner view)
   */
  async getBankAccessGrants(ownerId: string, userRole: string, bankType: 'VOCABULARY' | 'EXAM', bankId: string) {
    const cleanBankId = String(bankId).replace(/^cloned_/, '');
    await this.verifyBankOwnership(ownerId, bankType, cleanBankId, userRole);

    const grants = await this.prisma.bankAccessGrant.findMany({
      where: { bankId: cleanBankId },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return grants.map((g) => ({
      id: g.id,
      userId: g.userId,
      user: g.user,
      status: g.status,
      createdAt: g.createdAt,
      lastUsedAt: g.lastUsedAt,
      revokedAt: g.revokedAt,
      expiresAt: g.expiresAt,
    }));
  }

  /**
   * Revoke an active access grant immediately (Owner action)
   */
  async revokeAccessGrant(ownerId: string, userRole: string, grantId: string) {
    const grant = await this.prisma.bankAccessGrant.findUnique({
      where: { id: grantId },
    });
    if (!grant) throw new NotFoundException('Không tìm thấy thông tin cấp quyền');

    await this.verifyBankOwnership(ownerId, grant.bankType, grant.bankId, userRole);

    const updated = await this.prisma.bankAccessGrant.update({
      where: { id: grantId },
      data: {
        status: GrantStatus.REVOKED,
        revokedAt: new Date(),
      },
    });

    // Notify user of revocation
    try {
      await this.prisma.notification.create({
        data: {
          userId: grant.userId,
          type: 'ACCESS_REVOKED',
          title: 'Quyền truy cập đã bị thu hồi',
          body: `Chủ kho đã thu hồi Access Key truy cập của bạn cho kho này.`,
          data: {
            bankId: grant.bankId,
            bankType: grant.bankType,
          },
        },
      });
    } catch {}

    return {
      success: true,
      grantId: updated.id,
      status: updated.status,
      message: 'Đã thu hồi quyền truy cập thành công!',
    };
  }
}
