import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SupportStatus, SupportPriority } from '@prisma/client';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Helper: Generate unique Ticket ID (e.g. SUP-20260906-74912)
   */
  private generateTicketId(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(10000 + Math.random() * 90000);
    return `SUP-${dateStr}-${rand}`;
  }

  // =========================================================================
  // USER OPERATIONS
  // =========================================================================

  /**
   * User creates a support ticket / conversation
   */
  async createTicket(
    userId: string,
    dto: {
      subject: string;
      message: string;
      priority?: SupportPriority;
      tags?: string[];
    },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { displayName: true, email: true, role: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const ticketId = this.generateTicketId();

    const conversation = await this.prisma.supportConversation.create({
      data: {
        ticketId,
        userId,
        subject: dto.subject,
        priority: dto.priority || SupportPriority.NORMAL,
        tags: dto.tags && dto.tags.length > 0 ? dto.tags : ['GENERAL'],
        status: SupportStatus.OPEN,
        lastMessageAt: new Date(),
        messages: {
          create: {
            senderId: userId,
            senderRole: user.role,
            senderName: user.displayName || user.email || 'Học viên',
            content: dto.message,
            isInternalNote: false,
          },
        },
      },
      include: {
        messages: true,
      },
    });

    return conversation;
  }

  /**
   * User lists their tickets
   */
  async getUserTickets(userId: string) {
    return this.prisma.supportConversation.findMany({
      where: { userId },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        messages: {
          where: { isInternalNote: false },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  /**
   * User gets single ticket with messages (excluding internal notes)
   */
  async getUserTicketDetail(userId: string, conversationId: string) {
    const conv = await this.prisma.supportConversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          where: { isInternalNote: false },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conv) throw new NotFoundException('Ticket not found');
    if (conv.userId !== userId) throw new ForbiddenException('Access denied to this ticket');

    return conv;
  }

  /**
   * User sends a reply message
   */
  async userSendMessage(userId: string, conversationId: string, content: string) {
    const conv = await this.prisma.supportConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conv) throw new NotFoundException('Ticket not found');
    if (conv.userId !== userId) throw new ForbiddenException('Access denied');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { displayName: true, email: true, role: true },
    });

    const msg = await this.prisma.supportMessage.create({
      data: {
        conversationId,
        senderId: userId,
        senderRole: user?.role || 'USER',
        senderName: user?.displayName || user?.email || 'Học viên',
        content,
        isInternalNote: false,
      },
    });

    await this.prisma.supportConversation.update({
      where: { id: conversationId },
      data: {
        status: conv.status === SupportStatus.RESOLVED ? SupportStatus.OPEN : conv.status,
        lastMessageAt: new Date(),
      },
    });

    return msg;
  }

  /**
   * User closes / resolves their ticket
   */
  async userResolveTicket(userId: string, conversationId: string) {
    const conv = await this.prisma.supportConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conv) throw new NotFoundException('Ticket not found');
    if (conv.userId !== userId) throw new ForbiddenException('Access denied');

    return this.prisma.supportConversation.update({
      where: { id: conversationId },
      data: { status: SupportStatus.RESOLVED },
    });
  }

  // =========================================================================
  // ADMIN OPERATIONS
  // =========================================================================

  /**
   * Admin lists all tickets with filtering, search, and pagination
   */
  async getAdminConversations(options: {
    status?: SupportStatus;
    priority?: SupportPriority;
    assignedAdminId?: string;
    unassignedOnly?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, options.limit || 25);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (options.status) {
      where.status = options.status;
    }
    if (options.priority) {
      where.priority = options.priority;
    }
    if (options.unassignedOnly) {
      where.assignedAdminId = null;
    } else if (options.assignedAdminId) {
      where.assignedAdminId = options.assignedAdminId;
    }

    if (options.search) {
      const s = options.search;
      where.OR = [
        { ticketId: { contains: s, mode: 'insensitive' } },
        { subject: { contains: s, mode: 'insensitive' } },
        { user: { email: { contains: s, mode: 'insensitive' } } },
        { user: { displayName: { contains: s, mode: 'insensitive' } } },
      ];
    }

    const [items, total, openCount, waitingCount, resolvedCount] = await Promise.all([
      this.prisma.supportConversation.findMany({
        where,
        orderBy: { lastMessageAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
              avatar: true,
              role: true,
            },
          },
          assignedAdmin: {
            select: { id: true, displayName: true, email: true },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.supportConversation.count({ where }),
      this.prisma.supportConversation.count({ where: { status: SupportStatus.OPEN } }),
      this.prisma.supportConversation.count({ where: { status: SupportStatus.WAITING } }),
      this.prisma.supportConversation.count({ where: { status: SupportStatus.RESOLVED } }),
    ]);

    return {
      items,
      total,
      stats: {
        open: openCount,
        waiting: waitingCount,
        resolved: resolvedCount,
      },
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Admin gets full conversation detail including customer context & internal notes
   */
  async getAdminConversationDetail(conversationId: string) {
    const conv = await this.prisma.supportConversation.findUnique({
      where: { id: conversationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatar: true,
            role: true,
            createdAt: true,
            lastActiveAt: true,
            profile: true,
            streak: true,
            xp: true,
            subscriptions: {
              where: { status: 'ACTIVE' },
              include: { plan: true },
              take: 1,
            },
          },
        },
        assignedAdmin: {
          select: { id: true, displayName: true, email: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conv) throw new NotFoundException('Conversation not found');
    return conv;
  }

  /**
   * Admin posts a message or internal note
   */
  async adminSendMessage(
    adminId: string,
    conversationId: string,
    content: string,
    isInternalNote = false,
  ) {
    const conv = await this.prisma.supportConversation.findUnique({
      where: { id: conversationId },
      include: { user: true },
    });
    if (!conv) throw new NotFoundException('Conversation not found');

    const admin = await this.prisma.user.findUnique({
      where: { id: adminId },
      select: { displayName: true, email: true, role: true },
    });

    const msg = await this.prisma.supportMessage.create({
      data: {
        conversationId,
        senderId: adminId,
        senderRole: admin?.role || 'ADMIN',
        senderName: admin?.displayName || admin?.email || 'Hỗ trợ VocabFlow',
        content,
        isInternalNote,
      },
    });

    // If public reply, update conversation status to WAITING and send user notification
    if (!isInternalNote) {
      await this.prisma.supportConversation.update({
        where: { id: conversationId },
        data: {
          status: SupportStatus.WAITING,
          lastMessageAt: new Date(),
        },
      });

      // Send User Notification
      await this.notificationsService.createNotification(
        conv.userId,
        'SUPPORT_REPLY',
        `Phản hồi mới cho yêu cầu #${conv.ticketId}`,
        `Chuyên viên hỗ trợ vừa phản hồi: "${content.slice(0, 80)}${content.length > 80 ? '...' : ''}"`,
        { conversationId, ticketId: conv.ticketId, route: `/support?id=${conversationId}` },
      );
    }

    return msg;
  }

  /**
   * Admin updates conversation status
   */
  async updateStatus(adminId: string, conversationId: string, status: SupportStatus) {
    const updated = await this.prisma.supportConversation.update({
      where: { id: conversationId },
      data: { status },
    });

    // Notify user if resolved
    if (status === SupportStatus.RESOLVED) {
      await this.notificationsService.createNotification(
        updated.userId,
        'SUPPORT_REPLY',
        `Yêu cầu hỗ trợ #${updated.ticketId} đã hoàn tất`,
        `Yêu cầu hỗ trợ của bạn đã được đánh dấu là đã giải quyết. Cảm ơn bạn đã đồng hành cùng VocabFlow!`,
        { conversationId, ticketId: updated.ticketId, route: `/support?id=${conversationId}` },
      );
    }

    return updated;
  }

  /**
   * Admin updates conversation priority
   */
  async updatePriority(conversationId: string, priority: SupportPriority) {
    return this.prisma.supportConversation.update({
      where: { id: conversationId },
      data: { priority },
    });
  }

  /**
   * Admin assigns ticket to admin
   */
  async assignAdmin(conversationId: string, assignedAdminId: string | null) {
    return this.prisma.supportConversation.update({
      where: { id: conversationId },
      data: { assignedAdminId },
      include: {
        assignedAdmin: { select: { id: true, displayName: true, email: true } },
      },
    });
  }
}
