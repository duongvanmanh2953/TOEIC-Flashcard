import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Centralized Domain Event Notification Dispatcher
   */
  async createNotification(
    userId: string,
    type: string,
    title: string,
    body: string,
    data?: any,
    expiresAt?: Date,
  ) {
    try {
      return await this.prisma.notification.create({
        data: {
          userId,
          type,
          title,
          body,
          data: data || undefined,
          expiresAt: expiresAt || undefined,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to create notification for ${userId}: ${err.message}`);
      return null;
    }
  }

  /**
   * Get user notifications with tab filtering & pagination
   */
  async getUserNotifications(
    userId: string,
    options: {
      type?: string;
      unreadOnly?: boolean;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, options.limit || 20);
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (options.unreadOnly) {
      where.readAt = null;
    }

    if (options.type && options.type !== 'ALL') {
      if (options.type === 'SUPPORT') {
        where.type = { in: ['SUPPORT_REPLY', 'SUPPORT_TICKET_UPDATE'] };
      } else if (options.type === 'LEARNING') {
        where.type = { in: ['LEARNING_REMINDER', 'REVIEW_READY', 'ACHIEVEMENT', 'WEEKLY_REPORT'] };
      } else if (options.type === 'BILLING') {
        where.type = { in: ['BILLING', 'SUBSCRIPTION_CHANGED', 'PAYMENT_SUCCESS'] };
      } else if (options.type === 'SYSTEM') {
        where.type = { in: ['SYSTEM', 'ANNOUNCEMENT', 'FEEDBACK_REPLY', 'FEEDBACK_STATUS'] };
      } else {
        where.type = options.type;
      }
    }

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

    return {
      items,
      total,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUnreadCount(userId: string) {
    const unreadCount = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });
    return { unreadCount };
  }

  async markAsRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async deleteNotification(userId: string, notificationId: string) {
    return this.prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
  }

  async clearAll(userId: string) {
    return this.prisma.notification.deleteMany({
      where: { userId },
    });
  }

  /**
   * Admin: Broadcast Announcement to target audience
   */
  async broadcastAnnouncement(
    title: string,
    content: string,
    audience: 'ALL' | 'FREE' | 'PREMIUM' | 'INACTIVE_7D',
    adminId?: string,
  ) {
    // 1. Determine target users
    const now = new Date();
    let userFilter: any = {};

    if (audience === 'FREE') {
      userFilter = { role: 'USER' };
    } else if (audience === 'PREMIUM') {
      userFilter = { role: { in: ['PREMIUM_USER', 'SUPER_ADMIN'] } };
    } else if (audience === 'INACTIVE_7D') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      userFilter = { lastActiveAt: { lte: sevenDaysAgo } };
    }

    const targetUsers = await this.prisma.user.findMany({
      where: userFilter,
      select: { id: true },
    });

    // 2. Create Announcement Record
    const announcement = await this.prisma.adminAnnouncement.create({
      data: {
        title,
        content,
        audience,
        status: 'SENT',
        targetCount: targetUsers.length,
        sentAt: new Date(),
      },
    });

    // 3. Batch create notifications
    if (targetUsers.length > 0) {
      await this.prisma.notification.createMany({
        data: targetUsers.map((u) => ({
          userId: u.id,
          type: 'ANNOUNCEMENT',
          title,
          body: content,
          data: { announcementId: announcement.id, route: '/notifications' },
        })),
      });
    }

    if (adminId) {
      await this.prisma.auditLog.create({
        data: {
          actorId: adminId,
          action: 'BROADCAST_ANNOUNCEMENT',
          targetType: 'ANNOUNCEMENT',
          targetId: announcement.id,
          metadata: { title, audience, targetCount: targetUsers.length },
        },
      });
    }

    return {
      success: true,
      announcement,
      targetCount: targetUsers.length,
    };
  }

  async getAnnouncements() {
    return this.prisma.adminAnnouncement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async getAdminAllNotifications(page = 1, limit = 30) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.notification.count(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async adminClearAllNotifications(adminId?: string) {
    const deleted = await this.prisma.notification.deleteMany({});
    if (adminId) {
      await this.prisma.auditLog.create({
        data: {
          actorId: adminId,
          action: 'CLEAR_ALL_NOTIFICATIONS',
          targetType: 'NOTIFICATION',
          targetId: 'ALL',
          metadata: { count: deleted.count },
        },
      });
    }
    return { success: true, count: deleted.count };
  }
}
