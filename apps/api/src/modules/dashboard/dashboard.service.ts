import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(userId: string) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. Fetch User and Profile
    const [user, profile, streak, xp] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, displayName: true, email: true, avatar: true },
      }),
      this.prisma.userProfile.findUnique({ where: { userId } }),
      this.prisma.userStreak.findUnique({ where: { userId } }),
      this.prisma.userXP.findUnique({ where: { userId } }),
    ]);

    // 2. Count Words Reviewed / Learned Today
    const todayEvents = await this.prisma.reviewEvent.findMany({
      where: {
        userId,
        reviewedAt: { gte: startOfToday },
      },
      select: { correct: true, vocabularyId: true },
    });

    const uniqueWordsToday = new Set(todayEvents.map((e) => e.vocabularyId)).size;
    const correctToday = todayEvents.filter((e) => e.correct).length;
    const accuracyToday = todayEvents.length > 0 ? Math.round((correctToday / todayEvents.length) * 100) : 100;

    // 3. Count Review Due Words
    const reviewDueCount = await this.prisma.userVocabulary.count({
      where: {
        userId,
        nextReviewAt: { lte: now },
      },
    });

    // 4. Calculate Total Words Tracked and Average Mastery
    const userVocabs = await this.prisma.userVocabulary.findMany({
      where: { userId },
      select: {
        masteryScore: true,
        status: true,
        vocabulary: { select: { id: true, word: true, shortDefinition: true, partOfSpeech: true } },
      },
    });

    const totalWordsTracked = userVocabs.length;
    const avgMastery =
      totalWordsTracked > 0
        ? Math.round(userVocabs.reduce((acc, v) => acc + v.masteryScore, 0) / totalWordsTracked)
        : 0;

    // 5. Weak Words (< 50% mastery) & Strong Words (>= 80% mastery)
    const weakWords = userVocabs
      .filter((v) => v.masteryScore < 50)
      .slice(0, 5)
      .map((v) => ({
        id: v.vocabulary.id,
        word: v.vocabulary.word,
        meaning: v.vocabulary.shortDefinition,
        masteryScore: v.masteryScore,
      }));

    const strongWords = userVocabs
      .filter((v) => v.masteryScore >= 80)
      .slice(0, 5)
      .map((v) => ({
        id: v.vocabulary.id,
        word: v.vocabulary.word,
        meaning: v.vocabulary.shortDefinition,
        masteryScore: v.masteryScore,
      }));

    const masteredCount = userVocabs.filter((v) => v.status === 'MASTERED').length;
    const learningCount = userVocabs.filter((v) => v.status === 'LEARNING' || v.status === 'REVIEW').length;

    return {
      user: {
        id: user?.id,
        displayName: user?.displayName,
        email: user?.email,
        avatar: user?.avatar,
      },
      dailyGoal: profile?.dailyGoal || 20,
      completedToday: uniqueWordsToday,
      reviewDue: reviewDueCount,
      streak: streak?.currentStreak || 0,
      longestStreak: streak?.longestStreak || 0,
      xp: xp?.totalXP || 0,
      level: xp?.currentLevel || 1,
      accuracy: accuracyToday,
      mastery: avgMastery,
      stats: {
        totalTracked: totalWordsTracked,
        mastered: masteredCount,
        learning: learningCount,
      },
      weakWords,
      strongWords,
    };
  }

  async getHeatmap(userId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const events = await this.prisma.reviewEvent.findMany({
      where: {
        userId,
        reviewedAt: { gte: thirtyDaysAgo },
      },
      select: { reviewedAt: true },
    });

    const dayMap = new Map<string, number>();
    for (const e of events) {
      const dateKey = e.reviewedAt.toISOString().slice(0, 10);
      dayMap.set(dateKey, (dayMap.get(dateKey) || 0) + 1);
    }

    const result: Array<{ date: string; count: number; level: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const count = dayMap.get(key) || 0;
      const level = count === 0 ? 0 : count < 5 ? 1 : count < 15 ? 2 : count < 30 ? 3 : 4;
      result.push({ date: key, count, level });
    }

    return result;
  }
}
