import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UsageService } from '../subscriptions/usage.service';
import { ChatMessageType, ChatMessageStatus, MessageContextType, BankType } from '@prisma/client';

export interface SendMessageDto {
  conversationId: string;
  messageType?: ChatMessageType;
  ciphertext: string;
  encryptedKeys?: Record<string, string>; // { [userId]: encryptedKeyBase64 }
  iv?: string;
  metadata?: any;
}

export interface CreateConversationDto {
  targetUserId: string;
  contextType?: 'GENERAL' | 'BANK';
  bankType?: 'VOCABULARY' | 'EXAM';
  bankId?: string;
  bankTitle?: string;
  bankOwnerId?: string;
  languageSpaceId?: string;
}

export interface RegisterEncryptionKeyDto {
  publicKey: string;
  encryptedPrivateKey?: string;
  keyDerivationSalt?: string;
  keyAlgorithm?: string;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private usageService: UsageService,
  ) {}

  /**
   * Get or initiate a conversation between two students (optionally contextualized by a Bank)
   */
  async getOrCreateConversation(currentUserId: string, dto: CreateConversationDto) {
    const { targetUserId, contextType = 'GENERAL', bankType, bankId, bankTitle, bankOwnerId, languageSpaceId } = dto;

    if (currentUserId === targetUserId) {
      throw new BadRequestException('Không thể tạo cuộc trò chuyện với chính mình');
    }

    // Verify target user exists
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, displayName: true, email: true, avatar: true },
    });
    if (!targetUser) throw new NotFoundException('Người dùng không tồn tại');

    // Look for an existing conversation
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: currentUserId } } },
          { participants: { some: { userId: targetUserId } } },
          ...(bankId ? [{ bankId }] : []),
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, displayName: true, avatar: true, email: true },
            },
          },
        },
      },
    });

    if (!conversation) {
      // Create new conversation
      conversation = await this.prisma.conversation.create({
        data: {
          contextType: bankId ? MessageContextType.BANK : MessageContextType.GENERAL,
          bankType: bankType as BankType,
          bankId,
          bankTitle,
          bankOwnerId,
          languageSpaceId,
          participants: {
            create: [
              { userId: currentUserId },
              { userId: targetUserId },
            ],
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: { id: true, displayName: true, avatar: true, email: true },
              },
            },
          },
        },
      });
    }

    return this.formatConversationForUser(conversation, currentUserId);
  }

  /**
   * List all conversations for the current student user with pagination
   */
  async getUserConversations(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where: {
          participants: {
            some: { userId },
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: { id: true, displayName: true, avatar: true, email: true },
              },
            },
          },
        },
        orderBy: { lastMessageAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.conversation.count({
        where: {
          participants: { some: { userId } },
        },
      }),
    ]);

    return {
      items: conversations.map((c) => this.formatConversationForUser(c, userId)),
      total,
      page,
      limit,
    };
  }

  /**
   * Format conversation helper to include target user & unread counts
   */
  private formatConversationForUser(conv: any, currentUserId: string) {
    const currentParticipant = conv.participants.find((p: any) => p.userId === currentUserId);
    const otherParticipant = conv.participants.find((p: any) => p.userId !== currentUserId);

    return {
      id: conv.id,
      contextType: conv.contextType,
      bankType: conv.bankType,
      bankId: conv.bankId,
      bankTitle: conv.bankTitle,
      bankOwnerId: conv.bankOwnerId,
      languageSpaceId: conv.languageSpaceId,
      lastMessageText: conv.lastMessageText,
      lastMessageType: conv.lastMessageType,
      lastMessageAt: conv.lastMessageAt,
      createdAt: conv.createdAt,
      unreadCount: currentParticipant?.unreadCount || 0,
      targetUser: otherParticipant?.user || {
        id: 'unknown',
        displayName: 'Người dùng',
        avatar: null,
      },
    };
  }

  /**
   * Cursor-based pagination for messages in a conversation
   */
  async getConversationMessages(
    userId: string,
    conversationId: string,
    cursor?: string,
    limit = 30,
  ) {
    // Verify user is in conversation
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });
    if (!participant) {
      throw new ForbiddenException('Bạn không thuộc cuộc trò chuyện này');
    }

    const now = new Date();

    const messages = await this.prisma.chatMessage.findMany({
      where: {
        conversationId,
        NOT: {
          deletedFor: { has: userId },
        },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
    });

    const hasNextPage = messages.length > limit;
    const items = hasNextPage ? messages.slice(0, limit) : messages;
    const nextCursor = hasNextPage ? items[items.length - 1].id : null;

    // Mask deleted messages
    const formatted = items.map((m) => {
      if (m.isDeleted) {
        return {
          ...m,
          ciphertext: '',
          isDeleted: true,
          metadata: { note: 'Tin nhắn đã được xóa' },
        };
      }
      return m;
    });

    // Mark unread as 0 for this participant in background
    if (participant.unreadCount > 0) {
      await this.prisma.conversationParticipant.update({
        where: { id: participant.id },
        data: {
          unreadCount: 0,
          lastReadAt: now,
          ...(items.length > 0 ? { lastReadMessageId: items[0].id } : {}),
        },
      });
    }

    return {
      items: formatted.reverse(), // chronologically ascending for chat feed
      nextCursor,
      hasNextPage,
    };
  }

  /**
   * Send a new message (E2EE payload or Access Key)
   */
  async sendMessage(userId: string, dto: SendMessageDto) {
    const { conversationId, messageType = ChatMessageType.TEXT, ciphertext, encryptedKeys, iv, metadata } = dto;

    // Check conversation participation
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: { select: { id: true, displayName: true, avatar: true } },
          },
        },
      },
    });
    if (!conversation) throw new NotFoundException('Cuộc trò chuyện không tồn tại');

    const senderParticipant = conversation.participants.find((p) => p.userId === userId);
    if (!senderParticipant) throw new ForbiddenException('Bạn không thuộc cuộc trò chuyện này');

    // Subscription & rate check
    const quota = await this.usageService.getFeatureStatus(userId, 'MESSAGES');
    if (!quota.allowed) {
      throw new ForbiddenException(`Bạn đã đạt giới hạn gửi ${quota.limit} tin nhắn/ngày của gói hiện tại. Vui lòng nâng cấp gói để tiếp tục.`);
    }

    // Dynamic TTL expiration from Admin config (default 10 days)
    const ttlDays = await this.getChatTtlDays();
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    // Create message record
    const message = await this.prisma.chatMessage.create({
      data: {
        conversationId,
        senderId: userId,
        messageType,
        ciphertext,
        encryptedKeys: encryptedKeys || {},
        iv,
        metadata: metadata || {},
        status: ChatMessageStatus.SENT,
        expiresAt,
      },
      include: {
        sender: {
          select: { id: true, displayName: true, avatar: true },
        },
      },
    });

    // Preview snippet for conversation preview
    let previewSnippet = '[Tin nhắn mã hóa E2EE]';
    if (messageType === ChatMessageType.ACCESS_KEY) {
      previewSnippet = '🔐 Đã gửi mã Access Key';
    } else if (messageType === ChatMessageType.BANK_CONTEXT) {
      previewSnippet = '📚 Đã gửi thông tin kho học';
    }

    // Update conversation last message timestamp & snippet
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageText: previewSnippet,
        lastMessageType: messageType,
        lastMessageAt: message.createdAt,
      },
    });

    // Increment unread count for other participants
    const otherParticipants = conversation.participants.filter((p) => p.userId !== userId);
    for (const p of otherParticipants) {
      await this.prisma.conversationParticipant.update({
        where: { id: p.id },
        data: { unreadCount: { increment: 1 } },
      });

      // Send in-app notification if message is access key or bank inquiry
      try {
        const senderName = senderParticipant.user.displayName || 'Người dùng';
        let notifTitle = `Tin nhắn mới từ ${senderName}`;
        let notifMessage = previewSnippet;

        if (messageType === ChatMessageType.ACCESS_KEY) {
          notifTitle = `🔑 Bạn nhận được Access Key từ ${senderName}`;
          notifMessage = `Chủ kho ${senderName} đã cấp cho bạn quyền truy cập kho học. Nhấn để xem.`;
        }

        await this.notificationsService.createNotification(
          p.userId,
          'SYSTEM',
          notifTitle,
          notifMessage,
          {
            conversationId,
            messageId: message.id,
            senderId: userId,
            bankId: conversation.bankId,
          },
        );
      } catch (err) {
        this.logger.warn(`Failed to dispatch notification for chat message: ${err}`);
      }
    }

    return message;
  }

  /**
   * Mark all unread messages as READ
   */
  async markAsRead(userId: string, conversationId: string, messageId?: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });

    if (!participant) return { success: false };

    const now = new Date();
    await this.prisma.conversationParticipant.update({
      where: { id: participant.id },
      data: {
        unreadCount: 0,
        lastReadAt: now,
        ...(messageId ? { lastReadMessageId: messageId } : {}),
      },
    });

    // Update message status in conversation
    await this.prisma.chatMessage.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        status: { in: [ChatMessageStatus.SENT, ChatMessageStatus.DELIVERED] },
      },
      data: { status: ChatMessageStatus.READ },
    });

    return { success: true, readAt: now };
  }

  /**
   * Delete message: 'FOR_ME' (hides from current user) or 'FOR_EVERYONE' (masked for all)
   */
  async deleteMessage(userId: string, messageId: string, mode: 'FOR_ME' | 'FOR_EVERYONE') {
    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
    });
    if (!message) throw new NotFoundException('Tin nhắn không tồn tại');

    if (mode === 'FOR_ME') {
      if (!message.deletedFor.includes(userId)) {
        await this.prisma.chatMessage.update({
          where: { id: messageId },
          data: { deletedFor: { push: userId } },
        });
      }
      return { success: true, mode: 'FOR_ME' };
    }

    // FOR_EVERYONE requires sender authorization
    if (message.senderId !== userId) {
      throw new ForbiddenException('Chỉ người gửi mới có thể thu hồi tin nhắn cho mọi người');
    }

    // 24 hour deletion window check
    const diffHours = (Date.now() - new Date(message.createdAt).getTime()) / (1000 * 60 * 60);
    if (diffHours > 24) {
      throw new BadRequestException('Chỉ có thể thu hồi tin nhắn trong vòng 24 giờ kể từ khi gửi');
    }

    const updated = await this.prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
        ciphertext: '',
        metadata: { note: 'Tin nhắn đã được xóa' },
      },
    });

    return { success: true, mode: 'FOR_EVERYONE', message: updated };
  }

  /**
   * Register or update E2EE keys
   */
  async registerEncryptionKey(userId: string, dto: RegisterEncryptionKeyDto) {
    const { publicKey, encryptedPrivateKey, keyDerivationSalt, keyAlgorithm = 'ECDH-P256-AES-GCM' } = dto;

    return this.prisma.userEncryptionKey.upsert({
      where: { userId },
      create: {
        userId,
        publicKey,
        encryptedPrivateKey,
        keyDerivationSalt,
        keyAlgorithm,
      },
      update: {
        publicKey,
        ...(encryptedPrivateKey ? { encryptedPrivateKey } : {}),
        ...(keyDerivationSalt ? { keyDerivationSalt } : {}),
        keyAlgorithm,
      },
    });
  }

  /**
   * Get public key of a user (to encrypt session AES key for them)
   */
  async getUserPublicKey(userId: string) {
    const key = await this.prisma.userEncryptionKey.findUnique({
      where: { userId },
      select: { userId: true, publicKey: true, keyAlgorithm: true },
    });
    if (!key) {
      return null;
    }
    return key;
  }

  /**
   * Get user's own encrypted private key blob to decrypt client-side with PIN
   */
  async getMyEncryptedKey(userId: string) {
    const key = await this.prisma.userEncryptionKey.findUnique({
      where: { userId },
      select: {
        userId: true,
        publicKey: true,
        encryptedPrivateKey: true,
        keyDerivationSalt: true,
        keyAlgorithm: true,
      },
    });
    return key;
  }

  /**
   * Reset user's E2EE keys and wipe old messages after 5 failed PIN attempts
   */
  async resetUserE2EE(userId: string) {
    // 1. Delete user's encryption keys
    await this.prisma.userEncryptionKey.deleteMany({
      where: { userId },
    });

    // 2. Wipe messages sent by user or in user's direct conversations
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
      },
      select: { id: true },
    });

    const conversationIds = conversations.map((c) => c.id);
    if (conversationIds.length > 0) {
      await this.prisma.chatMessage.deleteMany({
        where: {
          conversationId: { in: conversationIds },
        },
      });
    }

    // 3. Reset participants unread and last read state
    await this.prisma.conversationParticipant.updateMany({
      where: { userId },
      data: {
        unreadCount: 0,
        lastReadMessageId: null,
      },
    });

    this.logger.log(`Wiped old E2EE messages and reset keys for user ${userId} due to PIN failure.`);
    return { success: true, message: 'Đã xóa toàn bộ lịch sử tin nhắn mã hóa cũ và làm mới khóa E2EE.' };
  }

  /**
   * Get dynamic Chat TTL configuration (default 10 days)
   */
  async getChatTtlDays(): Promise<number> {
    try {
      const config = await this.prisma.systemConfig.findUnique({
        where: { key: 'CHAT_TTL_DAYS' },
      });
      if (config && !isNaN(Number(config.value))) {
        return Math.max(1, Number(config.value));
      }
    } catch {
      // Fallback
    }
    return 10;
  }

  /**
   * Scheduled or on-demand cleanup of expired messages (10-day TTL)
   */
  async cleanupExpiredMessages() {
    const now = new Date();
    const result = await this.prisma.chatMessage.deleteMany({
      where: {
        expiresAt: {
          lte: now,
        },
      },
    });
    this.logger.log(`Cleaned up ${result.count} expired chat messages.`);
    return result;
  }
}
