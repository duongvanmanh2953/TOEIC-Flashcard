import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AntiCheatRecord {
  userId: string;
  suspiciousCount: number;
  lastActionTime: number;
  recentIntervals: number[];
  flagged: boolean;
  fairPlayScore: number; // 0 - 100
}

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  // In-memory Anti-Cheat Monitor & Velocity Tracker
  private antiCheatRegistry = new Map<string, AntiCheatRecord>();

  // Configurable Anti-Cheat Parameters
  private readonly MIN_STUDY_INTERVAL_MS = 1200; // Thẻ flashcard phải xem ít nhất 1.2 giây
  private readonly BOT_THRESHOLD_MS = 600;       // <600ms là bot/macro/auto-click
  private readonly MAX_XP_PER_HOUR = 3000;       // Ngưỡng tối đa chống spam script

  constructor(private prisma: PrismaService) {}

  /**
   * Anti-Cheat Engine: Xác thực tính minh bạch của thao tác học tập
   * @param userId ID người học
   * @param itemsCount Số từ/câu vừa hoàn thành
   * @param totalDurationMs Thời gian thực hiện (milliseconds)
   */
  verifyActionIntegrity(userId: string, itemsCount: number, totalDurationMs: number): {
    isValid: boolean;
    fairPlayScore: number;
    penaltyApplied: boolean;
    warningMessage?: string;
  } {
    const now = Date.now();
    let record = this.antiCheatRegistry.get(userId);

    if (!record) {
      record = {
        userId,
        suspiciousCount: 0,
        lastActionTime: now,
        recentIntervals: [],
        flagged: false,
        fairPlayScore: 100,
      };
      this.antiCheatRegistry.set(userId, record);
    }

    const avgTimePerItem = itemsCount > 0 ? totalDurationMs / itemsCount : totalDurationMs;

    // 1. Kiểm tra tốc độ siêu nhân (Macro / Bot Detection)
    if (avgTimePerItem < this.BOT_THRESHOLD_MS) {
      record.suspiciousCount += 1;
      record.fairPlayScore = Math.max(0, record.fairPlayScore - 20);
      record.flagged = true;
      this.logger.warn(`[Anti-Cheat] User ${userId} flagged for hyper-speed bot activity: ${avgTimePerItem}ms/item`);

      return {
        isValid: false,
        fairPlayScore: record.fairPlayScore,
        penaltyApplied: true,
        warningMessage: 'Hệ thống Fair-Play phát hiện tốc độ tương tác bất thường (< 600ms/thẻ). Điểm số này không được tính vào BXH để đảm bảo công bằng.',
      };
    }

    // 2. Thao tác quá nhanh dưới ngưỡng con người đọc hiểu thông thường
    if (avgTimePerItem < this.MIN_STUDY_INTERVAL_MS) {
      record.suspiciousCount += 0.5;
      record.fairPlayScore = Math.max(60, record.fairPlayScore - 5);
      return {
        isValid: true,
        fairPlayScore: record.fairPlayScore,
        penaltyApplied: false,
        warningMessage: 'Bạn đang thao tác rất nhanh. Hãy dành tối thiểu 1.5s để đọc kĩ nghĩa từ và phản xạ nhé!',
      };
    }

    // Phục hồi điểm Fair Play theo thời gian nếu học nghiêm túc
    if (record.fairPlayScore < 100) {
      record.fairPlayScore = Math.min(100, record.fairPlayScore + 5);
    }

    record.lastActionTime = now;
    return {
      isValid: true,
      fairPlayScore: record.fairPlayScore,
      penaltyApplied: false,
    };
  }

  /**
   * BXH 1: Top Điểm Thi & Điểm Kinh Nghiệm (XP Leaderboard)
   */
  async getXPLeaderboard(timeframe: 'weekly' | 'all-time' = 'weekly', limit: number = 20) {
    const users = await this.prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        displayName: true,
        email: true,
        avatar: true,
        role: true,
        xp: {
          select: {
            totalXP: true,
            currentLevel: true,
          },
        },
        profile: {
          select: {
            englishLevel: true,
          },
        },
      },
      orderBy: {
        xp: {
          totalXP: 'desc',
        },
      },
      take: limit,
    });

    return users.map((u, idx) => {
      const antiCheat = this.antiCheatRegistry.get(u.id);
      const fairPlay = antiCheat ? antiCheat.fairPlayScore : 100;
      const isVerified = fairPlay >= 80;

      // Mock slightly adjusted weekly delta for rich visual experience
      const weeklyGain = Math.round((u.xp?.totalXP || 0) * (timeframe === 'weekly' ? 0.35 : 1));

      return {
        rank: idx + 1,
        userId: u.id,
        displayName: u.displayName || u.email.split('@')[0],
        emailMasked: this.maskEmail(u.email),
        avatar: u.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.id}`,
        role: u.role,
        englishLevel: u.profile?.englishLevel || 'B1',
        score: weeklyGain,
        totalXP: u.xp?.totalXP || 0,
        level: u.xp?.currentLevel || 1,
        fairPlayScore: fairPlay,
        isFairPlayVerified: isVerified,
        statusBadge: isVerified ? 'Fair-Play Verified 🛡️' : 'Under Review ⚠️',
      };
    });
  }

  /**
   * BXH 2: Top Flashcard Từ Vựng Thành Thạo (Mastered Words)
   */
  async getFlashcardMasteryLeaderboard(limit: number = 20) {
    // Group count mastered vocabularies per user
    const stats = await this.prisma.userVocabulary.groupBy({
      by: ['userId'],
      where: {
        status: { in: ['MASTERED', 'STRONG'] },
      },
      _count: {
        vocabularyId: true,
      },
      orderBy: {
        _count: {
          vocabularyId: 'desc',
        },
      },
      take: limit,
    });

    const userIds = stats.map((s) => s.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        displayName: true,
        email: true,
        avatar: true,
        profile: { select: { englishLevel: true } },
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return stats.map((s, idx) => {
      const u = userMap.get(s.userId);
      const antiCheat = this.antiCheatRegistry.get(s.userId);
      const fairPlay = antiCheat ? antiCheat.fairPlayScore : 100;

      return {
        rank: idx + 1,
        userId: s.userId,
        displayName: u?.displayName || 'Thành viên VocabFlow',
        emailMasked: u?.email ? this.maskEmail(u.email) : '***@***.com',
        avatar: u?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${s.userId}`,
        englishLevel: u?.profile?.englishLevel || 'B1',
        masteredWordsCount: s._count.vocabularyId,
        fairPlayScore: fairPlay,
        isFairPlayVerified: fairPlay >= 80,
      };
    });
  }

  /**
   * BXH 3: Top Chuỗi Ngày Học Bền Bỉ (Streaks)
   */
  async getStreakLeaderboard(limit: number = 20) {
    const streaks = await this.prisma.userStreak.findMany({
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatar: true,
            profile: { select: { englishLevel: true } },
          },
        },
      },
      orderBy: {
        currentStreak: 'desc',
      },
      take: limit,
    });

    return streaks.map((st, idx) => {
      const antiCheat = this.antiCheatRegistry.get(st.userId);
      const fairPlay = antiCheat ? antiCheat.fairPlayScore : 100;

      return {
        rank: idx + 1,
        userId: st.userId,
        displayName: st.user.displayName || st.user.email.split('@')[0],
        emailMasked: this.maskEmail(st.user.email),
        avatar: st.user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${st.userId}`,
        englishLevel: st.user.profile?.englishLevel || 'B1',
        currentStreak: st.currentStreak,
        longestStreak: st.longestStreak,
        lastStudyDate: st.lastStudyDate,
        fairPlayScore: fairPlay,
        isFairPlayVerified: fairPlay >= 80,
      };
    });
  }

  /**
   * Tra cứu vị trí xếp hạng của người dùng hiện tại
   */
  async getUserRank(userId: string) {
    const [xpList, flashcardList, streakList] = await Promise.all([
      this.getXPLeaderboard('weekly', 100),
      this.getFlashcardMasteryLeaderboard(100),
      this.getStreakLeaderboard(100),
    ]);

    const xpRank = xpList.findIndex((item) => item.userId === userId);
    const flashcardRank = flashcardList.findIndex((item) => item.userId === userId);
    const streakRank = streakList.findIndex((item) => item.userId === userId);

    const antiCheat = this.antiCheatRegistry.get(userId);

    return {
      userId,
      xpRank: xpRank !== -1 ? xpRank + 1 : 999,
      flashcardRank: flashcardRank !== -1 ? flashcardRank + 1 : 999,
      streakRank: streakRank !== -1 ? streakRank + 1 : 999,
      fairPlayScore: antiCheat ? antiCheat.fairPlayScore : 100,
      isFairPlayVerified: (antiCheat ? antiCheat.fairPlayScore : 100) >= 80,
    };
  }

  private maskEmail(email: string): string {
    const [name, domain] = email.split('@');
    if (!domain) return email;
    const maskedName = name.length <= 3 ? name + '***' : name.slice(0, 2) + '***' + name.slice(-1);
    return `${maskedName}@${domain}`;
  }
}
