import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { FeedbackType, FeedbackStatus, SupportPriority } from '@prisma/client';

import { SupportGateway } from '../support/support.gateway';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private supportGateway: SupportGateway,
  ) {}

  // =========================================================================
  // USER OPERATIONS
  // =========================================================================

  async createFeedback(
    userId: string,
    dto: {
      type: FeedbackType;
      title: string;
      description: string;
      priority?: SupportPriority;
    },
  ) {
    const feedback = await this.prisma.feedback.create({
      data: {
        userId,
        type: dto.type || FeedbackType.GENERAL,
        title: dto.title,
        description: dto.description,
        priority: dto.priority || SupportPriority.NORMAL,
        status: FeedbackStatus.NEW,
      },
      include: {
        user: { select: { id: true, displayName: true, email: true } },
      },
    });

    // Operational Admin Alert via Realtime Gateway
    const isBug = dto.type === FeedbackType.BUG_REPORT;
    const isFeature = dto.type === FeedbackType.FEATURE_REQUEST;
    const alertType = isBug ? 'NEW_BUG_REPORT' : isFeature ? 'NEW_FEATURE_REQUEST' : 'NEW_FEEDBACK';
    const alertPriority = isBug ? 'HIGH' : 'MEDIUM';
    const alertTitle = isBug ? 'Báo cáo sự cố mới' : isFeature ? 'Đề xuất tính năng mới' : 'Ý kiến đóng góp mới';

    this.supportGateway.broadcastAdminEvent({
      type: alertType,
      priority: alertPriority as any,
      title: alertTitle,
      message: `${feedback.user?.displayName || feedback.user?.email || 'Học viên'}: "${dto.title.slice(0, 60)}"`,
      targetType: 'FEEDBACK',
      targetId: feedback.id,
    });

    return feedback;
  }

  async getMyFeedback(userId: string) {
    return this.prisma.feedback.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { votes: true } },
      },
    });
  }

  async getPublicRoadmap() {
    return this.prisma.feedback.findMany({
      where: {
        status: {
          in: [
            FeedbackStatus.UNDER_REVIEW,
            FeedbackStatus.PLANNED,
            FeedbackStatus.IN_PROGRESS,
            FeedbackStatus.RESOLVED,
          ],
        },
      },
      orderBy: [{ votesCount: 'desc' }, { createdAt: 'desc' }],
      take: 50,
      include: {
        user: { select: { displayName: true } },
        _count: { select: { votes: true } },
      },
    });
  }

  async toggleVote(userId: string, feedbackId: string) {
    const existing = await this.prisma.feedbackVote.findUnique({
      where: {
        feedbackId_userId: { feedbackId, userId },
      },
    });

    if (existing) {
      await this.prisma.feedbackVote.delete({
        where: { id: existing.id },
      });
      const updated = await this.prisma.feedback.update({
        where: { id: feedbackId },
        data: { votesCount: { decrement: 1 } },
      });
      return { voted: false, votesCount: updated.votesCount };
    } else {
      await this.prisma.feedbackVote.create({
        data: { feedbackId, userId },
      });
      const updated = await this.prisma.feedback.update({
        where: { id: feedbackId },
        data: { votesCount: { increment: 1 } },
      });
      return { voted: true, votesCount: updated.votesCount };
    }
  }

  // =========================================================================
  // ADMIN OPERATIONS
  // =========================================================================

  async getAdminFeedback(options: {
    status?: FeedbackStatus;
    type?: FeedbackType;
    priority?: SupportPriority;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, options.limit || 25);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (options.status) where.status = options.status;
    if (options.type) where.type = options.type;
    if (options.priority) where.priority = options.priority;

    if (options.search) {
      where.OR = [
        { title: { contains: options.search, mode: 'insensitive' } },
        { description: { contains: options.search, mode: 'insensitive' } },
        { user: { email: { contains: options.search, mode: 'insensitive' } } },
        { user: { displayName: { contains: options.search, mode: 'insensitive' } } },
      ];
    }

    const [items, total, newCount, underReviewCount, plannedCount, inProgressCount, resolvedCount] =
      await Promise.all([
        this.prisma.feedback.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            user: {
              select: { id: true, displayName: true, email: true, role: true },
            },
            _count: { select: { votes: true } },
          },
        }),
        this.prisma.feedback.count({ where }),
        this.prisma.feedback.count({ where: { status: FeedbackStatus.NEW } }),
        this.prisma.feedback.count({ where: { status: FeedbackStatus.UNDER_REVIEW } }),
        this.prisma.feedback.count({ where: { status: FeedbackStatus.PLANNED } }),
        this.prisma.feedback.count({ where: { status: FeedbackStatus.IN_PROGRESS } }),
        this.prisma.feedback.count({ where: { status: FeedbackStatus.RESOLVED } }),
      ]);

    return {
      items,
      total,
      counts: {
        new: newCount,
        underReview: underReviewCount,
        planned: plannedCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
      },
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateFeedbackStatus(
    adminId: string,
    feedbackId: string,
    status: FeedbackStatus,
    adminNotes?: string,
  ) {
    const fb = await this.prisma.feedback.findUnique({
      where: { id: feedbackId },
    });
    if (!fb) throw new NotFoundException('Feedback not found');

    const updated = await this.prisma.feedback.update({
      where: { id: feedbackId },
      data: {
        status,
        ...(adminNotes !== undefined ? { adminNotes } : {}),
      },
    });

    // Notify user of status progression
    const statusLabels: Record<string, string> = {
      UNDER_REVIEW: 'Đang được đội ngũ chuyên môn xem xét',
      PLANNED: 'Đã được đưa vào lộ trình phát triển (Roadmap)',
      IN_PROGRESS: 'Đang được triển khai',
      RESOLVED: 'Đã hoàn thành và triển khai thành công',
      DECLINED: 'Tạm thời chưa thể áp dụng',
    };

    if (statusLabels[status]) {
      await this.notificationsService.createNotification(
        fb.userId,
        'FEEDBACK_STATUS',
        `Cập nhật tiến độ góp ý: "${fb.title.slice(0, 40)}"`,
        `Góp ý của bạn hiện có trạng thái: ${statusLabels[status]}. Cảm ơn bạn đã đồng hành đóng góp xây dựng VocabFlow!`,
        { feedbackId, route: '/feedback' },
      );
    }

    return updated;
  }

  async adminReply(adminId: string, feedbackId: string, adminReply: string) {
    const fb = await this.prisma.feedback.findUnique({
      where: { id: feedbackId },
    });
    if (!fb) throw new NotFoundException('Feedback not found');

    const updated = await this.prisma.feedback.update({
      where: { id: feedbackId },
      data: {
        adminReply,
        status: fb.status === FeedbackStatus.NEW ? FeedbackStatus.ACKNOWLEDGED : fb.status,
      },
    });

    // Send notification to feedback author
    await this.notificationsService.createNotification(
      fb.userId,
      'FEEDBACK_REPLY',
      `Phản hồi về ý kiến của bạn: "${fb.title.slice(0, 40)}"`,
      `Ban quản trị VocabFlow vừa phản hồi góp ý của bạn: "${adminReply.slice(0, 90)}${adminReply.length > 90 ? '...' : ''}"`,
      { feedbackId, route: '/feedback' },
    );

    return updated;
  }
}
