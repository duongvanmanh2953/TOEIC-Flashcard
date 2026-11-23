import { randomUUID } from 'crypto';
import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GameModeType, CefrLevel } from '@prisma/client';
import { GameRoomManager, GameRoom, RoomPlayer } from './game-room.manager';
import { GameQuestionPayload } from './game-mode.interface';
import { RabbitMQService, QUEUES } from '../../common/rabbitmq/rabbitmq.service';
import { RedisCacheService } from '../../common/cache/redis-cache.service';

export interface GameScheduleItem {
  gameMode: GameModeType;
  title: string;
  scheduleTime: string;
  durationMinutes: number;
  questionCount: number;
  difficulty: string;
  scoreMultiplier: number;
  status: 'OPEN' | 'UPCOMING' | 'CLOSED';
}

import { QuestionProviderService } from './question-provider.service';
import { QuestionSourceType } from '@prisma/client';
import { getSystemPresetRooms } from './custom-rooms.service';

@Injectable()
export class GamesService implements OnModuleInit {
  private readonly logger = new Logger(GamesService.name);
  readonly roomManager = new GameRoomManager();

  // Test mode allows running and playing games outside 19:00-22:00 for QA & Admin testing
  private testModeEnabled = false;

  constructor(
    public readonly prisma: PrismaService,
    private readonly rabbitMQ: RabbitMQService,
    private readonly redisCache: RedisCacheService,
    private readonly questionProvider: QuestionProviderService,
  ) {}

  async onModuleInit() {
    // 1. Consumer Worker: Arena Game Settlement Queue
    await this.rabbitMQ.consume(
      QUEUES.ARENA_GAME_RESULTS,
      async (data: any, ack, nack) => {
        try {
          this.logger.log(
            `[RabbitMQ Worker] Settling match #${data.roomCode} (${data.gameMode}) for ${data.topPlayers?.length || 0} players...`,
          );
          await this.processGameResultsJob(data);
          ack();
        } catch (err: any) {
          this.logger.error(`Error processing arena game results queue: ${err.message}`);
          nack(false); // Reject to Dead Letter Queue for inspection and retry
        }
      },
      { prefetch: 5, maxRetries: 3 },
    );

    // 2. Consumer Worker: Arena Matchmaking Queue
    await this.rabbitMQ.consume(
      QUEUES.ARENA_MATCHMAKING,
      async (data: any, ack, nack) => {
        try {
          this.logger.log(`[RabbitMQ Worker] Matchmaking queued for ${data.displayName} (Mode: ${data.gameMode})`);
          ack();
        } catch (err: any) {
          this.logger.error(`Error in arena matchmaking worker: ${err.message}`);
          nack(false);
        }
      },
      { prefetch: 20 },
    );
  }

  /**
   * Check whether daily game hours are open (19:00 to 22:00 VN time)
   */
  getOperatingHoursStatus(): {
    isOpen: boolean;
    serverTime: string;
    nextGameTime: string;
    countdownSeconds: number;
    testMode: boolean;
    timezone: string;
  } {
    const tz = 'Asia/Ho_Chi_Minh';
    const now = new Date();

    // Format current hour & minute in Vietnam timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hourCycle: 'h23',
    });

    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
    const second = parseInt(parts.find((p) => p.type === 'second')?.value || '0', 10);

    const currentSeconds = hour * 3600 + minute * 60 + second;
    const openSeconds = 19 * 3600; // 19:00:00
    const closeSeconds = 22 * 3600; // 22:00:00

    let isOpen = currentSeconds >= openSeconds && currentSeconds < closeSeconds;
    let countdownSeconds = 0;

    if (currentSeconds < openSeconds) {
      countdownSeconds = openSeconds - currentSeconds;
    } else if (currentSeconds >= closeSeconds) {
      countdownSeconds = 24 * 3600 - currentSeconds + openSeconds;
    } else {
      // Game is currently LIVE
      countdownSeconds = closeSeconds - currentSeconds;
    }

    if (this.testModeEnabled) {
      isOpen = true; // In test mode, games are always accessible
    }

    return {
      isOpen,
      serverTime: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`,
      nextGameTime: '19:00',
      countdownSeconds,
      testMode: this.testModeEnabled,
      timezone: tz,
    };
  }

  setTestMode(enabled: boolean): boolean {
    this.testModeEnabled = enabled;
    this.logger.log(`Games Test Mode set to: ${enabled}`);
    return this.testModeEnabled;
  }

  /**
   * Get tonights game schedule list
   */
  async getGameSchedule(): Promise<GameScheduleItem[]> {
    const configs = await this.prisma.gameConfig.findMany({
      where: { isActive: true },
      orderBy: { scheduleTime: 'asc' },
    });

    const opStatus = this.getOperatingHoursStatus();

    return configs.map((c) => ({
      gameMode: c.gameMode,
      title: c.title,
      scheduleTime: opStatus.nextGameTime,
      durationMinutes: c.durationMinutes,
      questionCount: c.questionCount,
      difficulty: c.difficulty,
      scoreMultiplier: c.scoreMultiplier,
      status: opStatus.isOpen ? 'OPEN' : 'UPCOMING',
    }));
  }

  /**
   * Create or join an active room for a specific game mode
   */
  async joinOrCreateRoom(
    gameMode: GameModeType,
    userId: string,
    displayName: string,
    avatar: string,
    socketId: string,
    languageId: string = 'en',
  ): Promise<{ room: GameRoom; player: RoomPlayer }> {
    if (!this.getOperatingHoursStatus().isOpen) throw new Error('Sự kiện mở lúc 19:00 (GMT+7).');
    const targetLang = (languageId || 'en').toLowerCase().trim();
    const room = this.roomManager.getAllRooms().filter((candidate) =>
      candidate.scheduled && candidate.gameMode === gameMode && candidate.languageId === targetLang &&
      Date.now() - candidate.createdAt < 3 * 60 * 60 * 1000
    ).sort((a, b) => b.createdAt - a.createdAt)[0] ||
      (this.testModeEnabled ? await this.createScheduledRoom(gameMode, targetLang) : undefined);

    if (!room) throw new Error('Trận định kỳ chưa sẵn sàng hoặc đã kết thúc.');
    if (room.status === 'FINISHED' && !room.players.has(userId)) throw new Error('Trận định kỳ đã kết thúc.');
    const player = this.roomManager.addPlayer(room.roomCode, userId, displayName, avatar, socketId);
    if (!player) throw new Error('Không thể vào phòng.');
    return { room, player };
  }

  async createScheduledRoom(gameMode: GameModeType, targetLang: string): Promise<GameRoom> {
    const config = await this.prisma.gameConfig.findUnique({ where: { gameMode } });
    // Fetch authentic questions directly from QuestionProviderService matching the chosen language
    const questions = await this.questionProvider.getQuestionsForRoom(
      QuestionSourceType.SYSTEM_PRESET,
      undefined,
      config?.questionCount || 15,
      gameMode,
      targetLang,
    );

    if (!questions.length) throw new Error('Không có câu hỏi cho trận định kỳ.');
    let roomCode: string;
    do {
      roomCode = `A-${randomUUID().slice(0, 8).toUpperCase()}`;
    } while (this.roomManager.getRoom(roomCode));

    const friendlyTitles: Record<string, string> = {
      TRANSLATION_RUSH: 'Đấu Trường Dịch Nhanh',
      WORD_BLITZ: 'Đấu Trường Phản Xạ Từ Vựng',
      SENTENCE_SPRINT: 'Đấu Trường Tốc Độ Đặt Câu',
      MISSING_WORD: 'Đấu Trường Điền Từ Khuyết',
      LISTENING_RUSH: 'Đấu Trường Nghe Hiểu Cấp Tốc',
      SYNONYM_BATTLE: 'Đấu Trí Từ Đồng Nghĩa',
      FIX_SENTENCE: 'Đấu Trường Sửa Lỗi Câu',
      GUESS_WORD: 'Đấu Trường Đoán Từ Bí Ẩn',
      FOUR_SKILLS_ARENA: 'Đại Chiến 4 Kỹ Năng',
    };
    const title = config?.title || friendlyTitles[gameMode] || `${gameMode.replace(/_/g, ' ')}`;

    // Enforce <= 15s for choice / quiz games as requested by user
    const rawDuration = config?.durationMinutes
      ? Math.round((config.durationMinutes * 60) / questions.length)
      : 12;
    const roundDurationSec = Math.min(15, Math.max(5, rawDuration));

    const room = this.roomManager.createRoom(
      roomCode,
      gameMode,
      title,
      questions,
      roundDurationSec,
      targetLang,
      false,
      true,
    );
    room.scheduled = true;
    return room;
  }

  /**
   * Enqueue match results to RabbitMQ for asynchronous settlement and DB write
   */
  async queueGameResults(roomCode: string): Promise<boolean> {
    const room = this.roomManager.getRoom(roomCode);
    if (!room || room.players.size === 0) return false;

    // Chống dispatch trùng lặp cho cùng một phòng
    if ((room as any).isResultsQueued) {
      this.logger.warn(`Match #${roomCode} results have already been queued. Skipping duplicate dispatch.`);
      return true;
    }
    (room as any).isResultsQueued = true;

    // Audience identities are scoped to Live and have no User foreign key.
    const ranking = this.roomManager.getLeaderboard(roomCode)
      .filter((player) => !player.isCommenter)
      .map((player, index) => ({ ...player, rank: index + 1 }));
    const today = new Date().toISOString().slice(0, 10);
    const topPlayers = ranking.slice(0, 20); // Top 20 players

    const payload = {
      roomCode,
      gameMode: room.gameMode,
      totalRounds: room.totalRounds,
      createdAt: room.createdAt,
      date: today,
      durationSec: Math.round((Date.now() - room.createdAt) / 1000),
      topPlayers: topPlayers.map((player) => ({
        userId: player.userId,
        rank: player.rank,
        score: player.score,
        correctCount: player.correctCount,
        bestStreak: player.bestStreak,
        accuracy: room.totalRounds > 0 ? Math.round((player.correctCount / room.totalRounds) * 100) : 0,
      })),
    };

    this.logger.log(`[RabbitMQ Enqueue] Dispatching match #${roomCode} to ARENA_GAME_RESULTS queue...`);
    return this.rabbitMQ.publish(QUEUES.ARENA_GAME_RESULTS, payload);
  }

  /**
   * Backwards-compatible wrapper calling queueGameResults
   */
  async persistGameResults(roomCode: string): Promise<void> {
    await this.queueGameResults(roomCode);
  }

  /**
   * Worker job: Asynchronously batch write game results and credit XP
   * Protected with room-level distributed lock, DB idempotency and atomic transactions
   */
  async processGameResultsJob(data: {
    roomCode: string;
    gameMode: GameModeType;
    totalRounds: number;
    date: string;
    durationSec: number;
    topPlayers: Array<{
      userId: string;
      rank: number;
      score: number;
      correctCount: number;
      bestStreak: number;
      accuracy: number;
    }>;
  }): Promise<void> {
    if (!data.topPlayers || data.topPlayers.length === 0) return;

    // 1. Distributed lock per room to prevent concurrent worker settlements
    const lockKey = `lock:settle:room:${data.roomCode}`;
    const lockToken = await this.redisCache.acquireLock(lockKey, 30);
    if (!lockToken) {
      this.logger.warn(
        `[Anti-Double-Settlement] Room #${data.roomCode} settlement is currently in progress by another worker. Skipping concurrent job.`,
      );
      return;
    }

    try {
      // 2. Room-level idempotency check: If match already recorded, skip
      const existingRoom = await this.prisma.gameResult.findFirst({
        where: { roomCode: data.roomCode },
      });
      if (existingRoom) {
        this.logger.warn(`[Anti-Double-Settlement] Room #${data.roomCode} already has recorded settlements in DB. Skipping.`);
        return;
      }

      // 3. Transactional Batch Settlement:
      await this.prisma.$transaction(async (tx) => {
        for (const player of data.topPlayers) {
          // Player-level uniqueness check inside transaction
          const existingPlayer = await tx.gameResult.findFirst({
            where: { roomCode: data.roomCode, userId: player.userId },
          });
          if (existingPlayer) {
            continue;
          }

          // Insert game result record
          await tx.gameResult.create({
            data: {
              gameId: data.roomCode,
              gameMode: data.gameMode,
              roomCode: data.roomCode,
              date: data.date,
              userId: player.userId,
              rank: player.rank,
              score: player.score,
              correctCount: player.correctCount,
              totalRounds: data.totalRounds,
              accuracy: player.accuracy,
              bestStreak: player.bestStreak,
              durationSec: data.durationSec,
            },
          });

          // Atomically credit earned XP to player's UserXP in the same transaction
          if (player.score > 0) {
            await tx.userXP.upsert({
              where: { userId: player.userId },
              update: { totalXP: { increment: player.score } },
              create: { userId: player.userId, totalXP: player.score, currentLevel: 1 },
            });
          }

          // Atomically update participation streak (calendar-day based, at most 1 increment per day)
          if (player.score > 0 || player.correctCount > 0) {
            const now = new Date();
            const todayDateStr = now.toISOString().slice(0, 10);

            const userStreak = await tx.userStreak.findUnique({
              where: { userId: player.userId },
            });

            if (!userStreak) {
              await tx.userStreak.create({
                data: {
                  userId: player.userId,
                  currentStreak: 1,
                  longestStreak: 1,
                  lastStudyDate: now,
                },
              });
            } else {
              const lastDateStr = userStreak.lastStudyDate
                ? new Date(userStreak.lastStudyDate).toISOString().slice(0, 10)
                : null;

              if (lastDateStr !== todayDateStr) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().slice(0, 10);

                let nextCurrent = 1;
                if (lastDateStr === yesterdayStr) {
                  nextCurrent = (userStreak.currentStreak || 0) + 1;
                }
                const nextLongest = Math.max(userStreak.longestStreak || 0, nextCurrent);

                await tx.userStreak.update({
                  where: { userId: player.userId },
                  data: {
                    currentStreak: nextCurrent,
                    longestStreak: nextLongest,
                    lastStudyDate: now,
                  },
                });
              }
            }
          }
        }
      });

      this.logger.log(`[RabbitMQ Worker] Successfully finalized match #${data.roomCode} settlements.`);
    } finally {
      await this.redisCache.releaseLock(lockKey, lockToken);
    }
  }

  /**
   * Push player to RabbitMQ Arena Matchmaking Queue with deduplication lock
   */
  async enqueueMatchmaking(
    gameMode: GameModeType,
    player: { userId: string; displayName: string; avatar: string; socketId: string },
  ): Promise<boolean> {
    // Prevent same user from enqueuing multiple concurrent matchmaking tickets
    const mmLockKey = `lock:matchmaking:${player.userId}`;
    const token = await this.redisCache.acquireLock(mmLockKey, 30);
    if (!token) {
      this.logger.warn(`Player ${player.userId} already has an active matchmaking ticket. Ignoring duplicate queue request.`);
      return false;
    }

    return this.rabbitMQ.publish(QUEUES.ARENA_MATCHMAKING, {
      gameMode,
      ...player,
      queuedAt: Date.now(),
    });
  }

  /**
   * Redesigned Multi-level Competitive Leaderboard
   */
  async getCompetitiveLeaderboard(params: {
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'all-time';
    gameMode?: GameModeType;
    date?: string;
    currentUserId?: string;
  }) {
    const timeframe = params.timeframe || 'daily';
    const today = params.date || new Date().toISOString().slice(0, 10);

    const where: any = {};
    if (params.gameMode) {
      where.gameMode = params.gameMode;
    }

    if (timeframe === 'daily') {
      where.date = today;
    } else if (timeframe === 'weekly') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      where.createdAt = { gte: sevenDaysAgo };
    } else if (timeframe === 'monthly') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      where.createdAt = { gte: thirtyDaysAgo };
    }

    const results = await this.prisma.gameResult.findMany({
      where,
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
      orderBy: [{ score: 'desc' }, { accuracy: 'desc' }],
      take: 100,
    });

    const items = results.map((r, idx) => ({
      rank: idx + 1,
      userId: r.userId,
      displayName: r.user.displayName || r.user.email.split('@')[0],
      avatar: r.user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${r.userId}`,
      englishLevel: r.user.profile?.englishLevel || 'B1',
      score: r.score,
      accuracy: r.accuracy,
      correctCount: r.correctCount,
      bestStreak: r.bestStreak,
      gameMode: r.gameMode,
      date: r.date,
    }));

    // Top 3 Podium
    const top3 = {
      first: items[0] || null,
      second: items[1] || null,
      third: items[2] || null,
    };

    // Daily Champion
    const dailyChampion = items[0] || null;

    // Current User Position
    let currentUserRank: any = null;
    if (params.currentUserId) {
      const foundIdx = items.findIndex((i) => i.userId === params.currentUserId);
      if (foundIdx !== -1) {
        currentUserRank = items[foundIdx];
      }
    }

    return {
      timeframe,
      date: today,
      gameMode: params.gameMode || 'ALL',
      dailyChampion,
      top3,
      items,
      currentUserRank,
    };
  }

  // =========================================================================
  // ADMIN QUESTION BANK CRUD
  // =========================================================================

  async getAdminQuestions(query: { gameMode?: GameModeType; cefrLevel?: CefrLevel; search?: string }) {
    const where: any = {};
    if (query.gameMode) where.gameMode = query.gameMode;
    if (query.cefrLevel) where.cefrLevel = query.cefrLevel;
    if (query.search) {
      where.OR = [
        { prompt: { contains: query.search, mode: 'insensitive' } },
        { correctAnswer: { contains: query.search, mode: 'insensitive' } },
        { category: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.gameQuestion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async createQuestion(data: any) {
    return this.prisma.gameQuestion.create({
      data: {
        gameMode: data.gameMode || GameModeType.TRANSLATION_RUSH,
        prompt: data.prompt,
        direction: data.direction || 'EN_VI',
        correctAnswer: data.correctAnswer,
        acceptedAnswers: data.acceptedAnswers || [],
        explanation: data.explanation || null,
        difficulty: parseFloat(data.difficulty) || 3.0,
        cefrLevel: data.cefrLevel || CefrLevel.B1,
        category: data.category || 'General',
        audioUrl: data.audioUrl || null,
        status: data.status || 'PUBLISHED',
      },
    });
  }

  async updateQuestion(id: string, data: any) {
    return this.prisma.gameQuestion.update({
      where: { id },
      data,
    });
  }

  async deleteQuestion(id: string) {
    return this.prisma.gameQuestion.delete({ where: { id } });
  }

  async getGameConfigs() {
    return this.prisma.gameConfig.findMany({ orderBy: { scheduleTime: 'asc' } });
  }

  async updateGameConfig(id: string, data: any) {
    return this.prisma.gameConfig.update({
      where: { id },
      data,
    });
  }

  /**
   * Find next eligible public room for auto-continuous livestream rotation.
   * Excludes currentRoomCode, prioritizing other public rooms or cyclic system presets.
   */
  async findNextPublicGame(
    currentRoomCode: string,
    languageId: string = 'en',
  ): Promise<{ roomCode: string; title: string; gameMode: GameModeType; languageId: string } | null> {
    const curCode = currentRoomCode.toUpperCase();
    const effectiveLang = (languageId || 'en').toLowerCase().trim();

    // 1. Check database for other public rooms in WAITING status
    try {
      const dbRooms = await this.prisma.customGameRoom.findMany({
        where: {
          visibility: 'PUBLIC',
          status: 'WAITING',
          roomCode: { not: curCode },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      if (dbRooms.length > 0) {
        const nextDbRoom = dbRooms[0];
        return {
          roomCode: nextDbRoom.roomCode,
          title: nextDbRoom.title,
          gameMode: nextDbRoom.gameMode,
          languageId: nextDbRoom.languageId,
        };
      }
    } catch (err: any) {
      this.logger.warn(`Could not query custom public rooms for rotation: ${err?.message}`);
    }

    // 2. Fallback to System Preset Rooms rotation for continuous live
    try {
      const presets = getSystemPresetRooms(effectiveLang);
      if (presets && presets.length > 0) {
        const otherPresets = presets.filter((p) => p.roomCode.toUpperCase() !== curCode);
        const chosen = otherPresets.length > 0 ? otherPresets[0] : presets[0];

        return {
          roomCode: chosen.roomCode,
          title: chosen.title,
          gameMode: chosen.gameMode,
          languageId: chosen.languageId,
        };
      }
    } catch (err: any) {
      this.logger.warn(`Could not load preset rooms for rotation: ${err?.message}`);
    }

    return null;
  }

  /**
   * Comprehensive User Overview: Rank, Lifetime Arena Points, Streak, Matches, Badges, History
   */
  async getUserArenaOverview(userId: string) {
    const [user, userStreak, userXP, gameResults] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: { select: { englishLevel: true, targetLevel: true, primaryGoal: true } },
        },
      }),
      this.prisma.userStreak.findUnique({ where: { userId } }),
      this.prisma.userXP.findUnique({ where: { userId } }),
      this.prisma.gameResult.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const matchesPlayed = gameResults.length;
    const lifetimePoints = gameResults.reduce((acc, r) => acc + (r.score || 0), 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weeklyPoints = gameResults
      .filter((r) => new Date(r.createdAt) >= sevenDaysAgo)
      .reduce((acc, r) => acc + (r.score || 0), 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const seasonPoints = gameResults
      .filter((r) => new Date(r.createdAt) >= thirtyDaysAgo)
      .reduce((acc, r) => acc + (r.score || 0), 0);

    const bestScore = gameResults.reduce((max, r) => Math.max(max, r.score || 0), 0);
    const bestRank = gameResults.reduce((best, r) => Math.min(best, r.rank || 999), matchesPlayed > 0 ? 999 : 0);

    // Compute rank amongst all players by lifetime points
    const higherCount = await this.prisma.gameResult.groupBy({
      by: ['userId'],
      _sum: { score: true },
      having: {
        score: {
          _sum: {
            gt: lifetimePoints,
          },
        },
      },
    });
    const arenaRank = higherCount.length + 1;

    // Badges computation
    const badges: Array<{ id: string; name: string; description: string; icon: string; unlocked: boolean }> = [
      {
        id: 'CHAMPION_TOP_1',
        name: 'Vô Địch Đấu Trường',
        description: 'Đạt Top #1 trong ít nhất một trận đấu live',
        icon: 'Crown',
        unlocked: bestRank === 1,
      },
      {
        id: 'STREAK_WARRIOR_3',
        name: 'Chiến Binh Bền Bỉ',
        description: 'Duy trì chuỗi tham gia 3 ngày liên tiếp',
        icon: 'Flame',
        unlocked: (userStreak?.currentStreak || 0) >= 3 || (userStreak?.longestStreak || 0) >= 3,
      },
      {
        id: 'STREAK_MASTER_7',
        name: 'Bậc Thầy Kỷ Luật',
        description: 'Duy trì chuỗi tham gia 7 ngày liên tiếp',
        icon: 'Award',
        unlocked: (userStreak?.currentStreak || 0) >= 7 || (userStreak?.longestStreak || 0) >= 7,
      },
      {
        id: 'VETERAN_10_MATCHES',
        name: 'Đấu Sĩ Kỳ Cựu',
        description: 'Tham gia thi đấu 10 trận đấu trường trở lên',
        icon: 'ShieldCheck',
        unlocked: matchesPlayed >= 10,
      },
      {
        id: 'ACCURACY_SNIPER',
        name: 'Xạ Thủ Phản Xạ',
        description: 'Đạt độ chính xác 100% trong một trận đấu hoàn chỉnh',
        icon: 'Zap',
        unlocked: gameResults.some((r) => r.accuracy >= 100 && r.totalRounds >= 5),
      },
    ];

    return {
      userId: user.id,
      displayName: user.displayName || user.email.split('@')[0],
      avatar: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`,
      englishLevel: user.profile?.englishLevel || 'B1',
      arenaRank,
      lifetimePoints,
      weeklyPoints,
      seasonPoints,
      currentStreak: userStreak?.currentStreak || 0,
      bestStreak: userStreak?.longestStreak || 0,
      matchesPlayed,
      bestRank: bestRank === 999 ? 0 : bestRank,
      bestScore,
      totalXP: userXP?.totalXP || 0,
      badges,
      recentMatches: gameResults.slice(0, 10).map((r) => ({
        id: r.id,
        roomCode: r.roomCode,
        gameMode: r.gameMode,
        rank: r.rank,
        score: r.score,
        correctCount: r.correctCount,
        totalRounds: r.totalRounds,
        accuracy: r.accuracy,
        durationSec: r.durationSec,
        date: r.date,
        createdAt: r.createdAt,
      })),
    };
  }
}
