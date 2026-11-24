import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type HallOfFameReward } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const PAGE_SIZE = 10;
type StandingsQuery = { page?: string; period?: string };
type Standing = {
  rank: number;
  userId: string;
  displayName: string;
  avatar: string | null;
  score: number;
  matches: number;
  accuracy?: number;
  wins?: number;
  correctCount?: number;
  speedPlacements?: number;
  total: number;
};

function rewardView({ userId, awardKey, ...reward }: HallOfFameReward, now = new Date()) {
  const status = reward.claimedAt ? 'CLAIMED'
    : reward.expiresAt && reward.expiresAt <= now ? 'EXPIRED'
    : !reward.availableAt || reward.availableAt > now ? 'LOCKED' : 'AVAILABLE';
  return { ...reward, status };
}

@Injectable()
export class HallOfFameService {
  constructor(private readonly prisma: PrismaService) {}

  async getStandings(category: 'live' | 'battle', query: StandingsQuery) {
    const requested = Number(query.page);
    const page = Number.isSafeInteger(requested) && requested > 0 ? Math.min(requested, 1000000) : 1;
    const offset = (page - 1) * PAGE_SIZE;
    const days = query.period === 'weekly' ? 7 : query.period === 'monthly' ? 30 : undefined;
    const since = days === undefined ? undefined : new Date(Date.now() - days * 86400000);

    const battle = Prisma.sql`
      SELECT "userId", SUM(score)::float8 AS score, COUNT(*)::int AS matches,
        COUNT(*) FILTER (WHERE rank = 1)::int AS wins,
        ROUND(100.0 * SUM("correctCount") / NULLIF(SUM("totalRounds"), 0))::int AS accuracy
      FROM "GameResult"
      WHERE ("isBattle" = TRUE OR ("isBattle" IS NULL AND score > 0))
        ${since ? Prisma.sql`AND "createdAt" >= ${since}` : Prisma.empty}
      GROUP BY "userId"`;
    const live = Prisma.sql`
      SELECT username AS "userId", SUM(score)::float8 AS score, COUNT(*)::int AS matches,
        SUM("correctCount")::int AS "correctCount", SUM("speedPlacements")::int AS "speedPlacements"
      FROM "TikTokMatchResult"
      ${since ? Prisma.sql`WHERE "finishedAt" >= ${since}` : Prisma.empty}
      GROUP BY username`;
    const rows = await this.prisma.$queryRaw<Standing[]>`
      WITH totals AS (${category === 'live' ? live : battle}), ranked AS (
        SELECT *, (ROW_NUMBER() OVER (ORDER BY score DESC,
          ${category === 'live' ? Prisma.sql`"speedPlacements" DESC, "correctCount" DESC`
            : Prisma.sql`accuracy DESC NULLS LAST, wins DESC`},
          "userId" ASC))::int AS rank, COUNT(*) OVER ()::int AS total
        FROM totals
      ), visible AS (
        SELECT * FROM ranked WHERE rank <= 3 OR (rank > ${offset} AND rank <= ${offset + PAGE_SIZE})
      )
      SELECT visible.*, profile."displayName", profile.avatar
      FROM visible
      ${category === 'live' ? Prisma.sql`
        JOIN LATERAL (
          SELECT "displayName", avatar FROM "TikTokMatchResult"
          WHERE username = visible."userId"
          ORDER BY "finishedAt" DESC, "roomCode" ASC LIMIT 1
        ) profile ON TRUE` : Prisma.sql`JOIN "User" profile ON profile.id = visible."userId"`}
      ORDER BY rank
    `;
    const total = rows[0]?.total ?? 0;
    const standings = rows.map(({ total: _total, ...row }) => row);
    return {
      page,
      pageSize: PAGE_SIZE,
      total,
      podium: standings.filter(({ rank }) => rank <= 3),
      items: standings.filter(({ rank }) => rank > offset),
    };
  }

  async getAwards(userId: string) {
    const [rewards, catalog] = await Promise.all([
      this.prisma.hallOfFameReward.findMany({
        where: { userId },
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      }),
      this.prisma.achievement.findMany({
        orderBy: { code: 'asc' },
        include: { userAchievements: { where: { userId }, select: { unlockedAt: true } } },
      }),
    ]);

    const now = new Date();
    return {
      rewards: rewards.map((reward) => rewardView(reward, now)),
      achievements: catalog.map(({ id, code, name, description, icon, condition, userAchievements }) => ({
        id, code, name, description, icon, condition,
        unlockedAt: userAchievements[0]?.unlockedAt ?? null,
      })),
    };
  }

  async claimReward(userId: string, id: string) {
    // A single conditional write checks ownership, availability, deadline and replay under row locking.
    const [updated] = await this.prisma.$queryRaw<HallOfFameReward[]>`
      UPDATE "HallOfFameReward" SET "claimedAt" = clock_timestamp() AT TIME ZONE 'UTC'
      WHERE id = ${id} AND "userId" = ${userId} AND "claimedAt" IS NULL
        AND "availableAt" <= clock_timestamp() AT TIME ZONE 'UTC'
        AND ("expiresAt" IS NULL OR "expiresAt" > clock_timestamp() AT TIME ZONE 'UTC')
      RETURNING *
    `;
    if (updated) return rewardView(updated);

    const existing = await this.prisma.hallOfFameReward.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Không tìm thấy phần thưởng.');
    const reward = rewardView(existing);
    if (reward.status === 'CLAIMED') return reward;
    throw new ConflictException(reward.status === 'EXPIRED'
      ? 'Phần thưởng đã hết hạn nhận.' : 'Phần thưởng chưa mở để nhận.');
  }
}
