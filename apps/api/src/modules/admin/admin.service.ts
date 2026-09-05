import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ModerationStatus, UserStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalUsers,
      activeToday,
      totalVocab,
      totalReviews,
      totalSessions,
      correctReviews,
      pendingDecksCount,
      approvedDecksCount,
      aiInteractions,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { lastActiveAt: { gte: startOfToday } } }),
      this.prisma.vocabulary.count(),
      this.prisma.reviewEvent.count(),
      this.prisma.studySession.count(),
      this.prisma.reviewEvent.count({ where: { correct: true } }),
      this.prisma.communityDeck.count({ where: { status: ModerationStatus.PENDING } }),
      this.prisma.communityDeck.count({ where: { status: ModerationStatus.APPROVED } }),
      this.prisma.aIInteraction.count(),
    ]);

    const accuracyRate = totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : 0;

    return {
      metrics: {
        totalUsers,
        activeToday,
        totalVocab,
        totalReviews,
        totalSessions,
        accuracyRate,
        pendingDecksCount,
        approvedDecksCount,
        aiInteractions,
      },
    };
  }

  async getPendingDecks() {
    return this.prisma.communityDeck.findMany({
      where: { status: ModerationStatus.PENDING },
      include: {
        author: { select: { id: true, displayName: true, email: true } },
        words: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async moderateDeck(deckId: string, action: 'APPROVE' | 'REJECT', actorId?: string) {
    const deck = await this.prisma.communityDeck.findUnique({ where: { id: deckId } });
    if (!deck) throw new NotFoundException('Deck not found');

    const status = action === 'APPROVE' ? ModerationStatus.APPROVED : ModerationStatus.REJECTED;
    const updated = await this.prisma.communityDeck.update({
      where: { id: deckId },
      data: { status },
    });

    if (actorId) {
      await this.prisma.auditLog.create({
        data: {
          actorId,
          action: `MODERATE_DECK_${action}`,
          targetType: 'COMMUNITY_DECK',
          targetId: deckId,
          metadata: { deckTitle: deck.title, newStatus: status },
        },
      });
    }

    return updated;
  }

  async getUsers(search?: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
          status: true,
          createdAt: true,
          lastActiveAt: true,
          xp: { select: { totalXP: true, currentLevel: true } },
          streak: { select: { currentStreak: true } },
          _count: { select: { userVocabularies: true, communityDecks: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async toggleUserStatus(userId: string, actorId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const nextStatus = user.status === UserStatus.ACTIVE ? UserStatus.SUSPENDED : UserStatus.ACTIVE;
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: nextStatus },
      select: { id: true, email: true, status: true },
    });

    if (actorId) {
      await this.prisma.auditLog.create({
        data: {
          actorId,
          action: nextStatus === UserStatus.SUSPENDED ? 'USER_SUSPEND' : 'USER_ACTIVATE',
          targetType: 'USER',
          targetId: userId,
          metadata: { targetEmail: user.email, previousStatus: user.status },
        },
      });
    }

    return updated;
  }

  async getAuditLogs(limit: number = 20) {
    return this.prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { id: true, email: true, displayName: true } },
      },
    });
  }
}
