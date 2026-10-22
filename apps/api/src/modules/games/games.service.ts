import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GameModeType, CefrLevel } from '@prisma/client';
import { GameRoomManager, GameRoom, RoomPlayer } from './game-room.manager';
import { GameQuestionPayload } from './game-mode.interface';
import { RabbitMQService, QUEUES } from '../../common/rabbitmq/rabbitmq.service';

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

@Injectable()
export class GamesService implements OnModuleInit {
  private readonly logger = new Logger(GamesService.name);
  readonly roomManager = new GameRoomManager();

  // Test mode allows running and playing games outside 20:00-22:00 for QA & Admin testing
  private testModeEnabled: boolean = true;

  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitMQ: RabbitMQService,
  ) {}

  async onModuleInit() {
    // 1. Consumer Worker: Arena Game Settlement Queue
    await this.rabbitMQ.consume(QUEUES.ARENA_GAME_RESULTS, async (data: any, ack) => {
      try {
        this.logger.log(`[RabbitMQ Worker] Settling match #${data.roomCode} (${data.gameMode}) for ${data.topPlayers?.length || 0} players...`);
        await this.processGameResultsJob(data);
        ack();
      } catch (err: any) {
        this.logger.error(`Error processing arena game results queue: ${err.message}`);
        ack();
      }
    });

    // 2. Consumer Worker: Arena Matchmaking Queue
    await this.rabbitMQ.consume(QUEUES.ARENA_MATCHMAKING, async (data: any, ack) => {
      try {
        this.logger.log(`[RabbitMQ Worker] Matchmaking queued for ${data.displayName} (Mode: ${data.gameMode})`);
        ack();
      } catch (err: any) {
        this.logger.error(`Error in arena matchmaking worker: ${err.message}`);
        ack();
      }
    });
  }

  /**
   * Check whether daily game hours are open (20:00 to 22:00 VN time)
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
      hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
    const second = parseInt(parts.find((p) => p.type === 'second')?.value || '0', 10);

    const currentSeconds = hour * 3600 + minute * 60 + second;
    const openSeconds = 20 * 3600; // 20:00:00
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
      nextGameTime: '20:00',
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
      scheduleTime: c.scheduleTime,
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
  ): Promise<{ room: GameRoom; player: RoomPlayer }> {
    // Find active open waiting room with space
    let room = this.roomManager
      .getActiveRooms()
      .find((r) => r.gameMode === gameMode && (r.status === 'WAITING' || r.status === 'STARTING') && r.players.size < 100);

    if (!room) {
      // Query questions from Question Bank
      const questionsRaw = await this.prisma.gameQuestion.findMany({
        where: { gameMode, status: 'PUBLISHED' },
        take: 25,
      });

      // Fallback if question pool is small
      const questions: GameQuestionPayload[] = questionsRaw.length > 0
        ? questionsRaw.map((q) => ({
            id: q.id,
            prompt: q.prompt,
            direction: q.direction,
            correctAnswer: q.correctAnswer,
            acceptedAnswers: q.acceptedAnswers,
            explanation: q.explanation || undefined,
            difficulty: q.difficulty,
            category: q.category,
            audioUrl: q.audioUrl || undefined,
          }))
        : [
            {
              id: 'q1',
              prompt: 'meet the deadline',
              direction: 'EN_VI',
              correctAnswer: 'hoàn thành đúng hạn',
              acceptedAnswers: ['kịp hạn', 'đúng hạn', 'kịp thời hạn'],
              explanation: 'Thành ngữ TOEIC chỉ hoàn thành trước kỳ hạn.',
              difficulty: 3.0,
              category: 'Business',
            },
            {
              id: 'q2',
              prompt: 'triển khai',
              direction: 'VI_EN',
              correctAnswer: 'implement',
              acceptedAnswers: ['deploy', 'execute', 'conduct'],
              explanation: 'Từ vựng hành động.',
              difficulty: 3.0,
              category: 'General',
            },
          ];

      // Shuffle questions
      const shuffled = questions.sort(() => Math.random() - 0.5).slice(0, 15);
      const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();

      const config = await this.prisma.gameConfig.findUnique({ where: { gameMode } });
      const title = config?.title || `${gameMode.replace('_', ' ')}`;

      room = this.roomManager.createRoom(
        roomCode,
        gameMode,
        title,
        shuffled,
        config?.durationMinutes ? Math.round((config.durationMinutes * 60) / shuffled.length) : 15,
      );
    }

    const player = this.roomManager.addPlayer(room.roomCode, userId, displayName, avatar, socketId);
    if (!player) {
      throw new Error('Failed to join game room');
    }

    return { room, player };
  }

  /**
   * Enqueue match results to RabbitMQ for asynchronous settlement and DB write
   */
  async queueGameResults(roomCode: string): Promise<boolean> {
    const room = this.roomManager.getRoom(roomCode);
    if (!room || room.players.size === 0) return false;

    const ranking = this.roomManager.getLeaderboard(roomCode);
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

    for (const player of data.topPlayers) {
      try {
        await this.prisma.gameResult.create({
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

        // Credit earned XP to player's UserXP
        if (player.score > 0) {
          await this.prisma.userXP.upsert({
            where: { userId: player.userId },
            update: { totalXP: { increment: player.score } },
            create: { userId: player.userId, totalXP: player.score, currentLevel: 1 },
          });
        }
      } catch (err: any) {
        this.logger.error(`Failed to persist game result for user ${player.userId}: ${err?.message}`);
      }
    }
    this.logger.log(`[RabbitMQ Worker] Successfully finalized match #${data.roomCode} settlements.`);
  }

  /**
   * Push player to RabbitMQ Arena Matchmaking Queue
   */
  async enqueueMatchmaking(
    gameMode: GameModeType,
    player: { userId: string; displayName: string; avatar: string; socketId: string },
  ): Promise<boolean> {
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
}
