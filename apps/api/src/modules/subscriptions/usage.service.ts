import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionTier } from '@prisma/client';

export type FeatureKey =
  | 'AI_TUTOR'
  | 'SMART_REVIEW'
  | 'CUSTOM_QUIZ'
  | 'AI_STORY'
  | 'MEMORY_RESCUE'
  | 'DEEP_ANALYTICS'
  | 'TEXT_TO_VOCAB'
  | 'PRONUNCIATION';

export interface QuotaStatus {
  feature: FeatureKey;
  allowed: boolean;
  limit: number; // -1 for unlimited
  used: number;
  remaining: number;
  warningLevel: 'NORMAL' | 'APPROACHING_70' | 'CRITICAL_90' | 'DEPLETED_100';
}

@Injectable()
export class UsageService {
  private readonly logger = new Logger(UsageService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Lấy cấu hình hệ thống động từ Database (hoặc giá trị mặc định)
   */
  async getSystemConfigNumber(key: string, defaultValue: number): Promise<number> {
    try {
      const config = await this.prisma.systemConfig.findUnique({ where: { key } });
      if (config && !isNaN(Number(config.value))) {
        return Number(config.value);
      }
    } catch {
      // Bỏ qua lỗi truy vấn nếu bảng đang khởi tạo
    }
    return defaultValue;
  }

  /**
   * Kiểm tra người dùng có quyền và còn quota sử dụng tính năng hay không
   */
  async canUse(userId: string | null, feature: FeatureKey): Promise<boolean> {
    const status = await this.getFeatureStatus(userId, feature);
    return status.allowed;
  }

  /**
   * Tiêu thụ 1 lượt sử dụng tính năng (Server-side authoritative)
   */
  async consume(userId: string | null, feature: FeatureKey, count = 1): Promise<void> {
    if (!userId) {
      // Guest: Được xử lý qua session/rate-limit
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const updateData: any = {};

    switch (feature) {
      case 'AI_TUTOR':
        updateData.aiUsageCount = { increment: count };
        break;
      case 'CUSTOM_QUIZ':
        updateData.quizGenCount = { increment: count };
        break;
      case 'SMART_REVIEW':
        updateData.reviewCount = { increment: count };
        break;
      case 'AI_STORY':
        updateData.storyGenCount = { increment: count };
        break;
      default:
        break;
    }

    if (Object.keys(updateData).length > 0) {
      await this.prisma.entitlementUsage.upsert({
        where: { userId_date: { userId, date: today } },
        create: {
          userId,
          date: today,
          aiUsageCount: feature === 'AI_TUTOR' ? count : 0,
          quizGenCount: feature === 'CUSTOM_QUIZ' ? count : 0,
          reviewCount: feature === 'SMART_REVIEW' ? count : 0,
          storyGenCount: feature === 'AI_STORY' ? count : 0,
        },
        update: updateData,
      });
    }
  }

  /**
   * Tra cứu chi tiết trạng thái Quota của 1 tính năng
   */
  async getFeatureStatus(userId: string | null, feature: FeatureKey): Promise<QuotaStatus> {
    // 1. Trường hợp Guest (chưa đăng nhập)
    if (!userId) {
      const guestLimits: Record<FeatureKey, number> = {
        AI_TUTOR: 3,
        SMART_REVIEW: 10,
        CUSTOM_QUIZ: 2,
        AI_STORY: 0,
        MEMORY_RESCUE: 0,
        DEEP_ANALYTICS: 0,
        TEXT_TO_VOCAB: 0,
        PRONUNCIATION: 5,
      };
      const limit = guestLimits[feature] || 0;
      return {
        feature,
        allowed: limit > 0,
        limit,
        used: 0,
        remaining: limit,
        warningLevel: 'NORMAL',
      };
    }

    // 2. Tra cứu gói cước người dùng
    const [sub, usageRecord] = await Promise.all([
      this.prisma.subscription.findFirst({
        where: { userId, status: 'ACTIVE' },
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.entitlementUsage.findUnique({
        where: { userId_date: { userId, date: new Date().toISOString().slice(0, 10) } },
      }),
    ]);

    const isPro = sub?.plan.tier === SubscriptionTier.PRO;
    const isPlus = sub?.plan.tier === SubscriptionTier.PLUS;
    const isPremium = isPro || isPlus;

    // Premium Tiers có quyền truy cập không giới hạn cho hầu hết tính năng
    if (isPro) {
      return {
        feature,
        allowed: true,
        limit: -1,
        used: 0,
        remaining: 9999,
        warningLevel: 'NORMAL',
      };
    }

    // Xác định giới hạn cấu hình
    let limit = 0;
    let used = 0;

    switch (feature) {
      case 'AI_TUTOR':
        limit = isPlus ? 100 : await this.getSystemConfigNumber('FREE_AI_DAILY_LIMIT', 10);
        used = usageRecord?.aiUsageCount || 0;
        break;

      case 'SMART_REVIEW':
        limit = isPremium ? -1 : await this.getSystemConfigNumber('FREE_REVIEW_DAILY_LIMIT', 20);
        used = usageRecord?.reviewCount || 0;
        break;

      case 'CUSTOM_QUIZ':
        limit = isPremium ? -1 : await this.getSystemConfigNumber('FREE_QUIZ_DAILY_LIMIT', 3);
        used = usageRecord?.quizGenCount || 0;
        break;

      case 'AI_STORY':
        limit = isPremium ? -1 : await this.getSystemConfigNumber('FREE_STORY_DAILY_LIMIT', 1);
        used = usageRecord?.storyGenCount || 0;
        break;

      case 'MEMORY_RESCUE':
      case 'DEEP_ANALYTICS':
      case 'TEXT_TO_VOCAB':
        // Các tính năng chuyên biệt chỉ dành cho Plus / Pro
        return {
          feature,
          allowed: isPremium,
          limit: isPremium ? -1 : 0,
          used: 0,
          remaining: isPremium ? 9999 : 0,
          warningLevel: isPremium ? 'NORMAL' : 'DEPLETED_100',
        };

      default:
        limit = 10;
        break;
    }

    if (limit === -1) {
      return {
        feature,
        allowed: true,
        limit: -1,
        used,
        remaining: 9999,
        warningLevel: 'NORMAL',
      };
    }

    const remaining = Math.max(0, limit - used);
    const usageRatio = limit > 0 ? used / limit : 1;

    let warningLevel: QuotaStatus['warningLevel'] = 'NORMAL';
    if (remaining === 0) {
      warningLevel = 'DEPLETED_100';
    } else if (usageRatio >= 0.9 || remaining === 1) {
      warningLevel = 'CRITICAL_90';
    } else if (usageRatio >= 0.7) {
      warningLevel = 'APPROACHING_70';
    }

    return {
      feature,
      allowed: remaining > 0,
      limit,
      used,
      remaining,
      warningLevel,
    };
  }

  /**
   * Bảng tổng hợp hạn ngạch toàn bộ tính năng hôm nay cho người dùng
   */
  async getAllQuotas(userId: string | null) {
    const features: FeatureKey[] = [
      'AI_TUTOR',
      'SMART_REVIEW',
      'CUSTOM_QUIZ',
      'AI_STORY',
      'MEMORY_RESCUE',
      'DEEP_ANALYTICS',
    ];

    const results = await Promise.all(
      features.map((feat) => this.getFeatureStatus(userId, feat)),
    );

    const quotaMap: Record<string, QuotaStatus> = {};
    results.forEach((q) => {
      quotaMap[q.feature] = q;
    });

    return quotaMap;
  }
}
