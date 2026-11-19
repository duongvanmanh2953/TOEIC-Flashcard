import { Logger } from '@nestjs/common';
import { GameModeType } from '@prisma/client';
import { GameQuestionPayload, AnswerEvaluation } from './game-mode.interface';
import { GAME_MODE_REGISTRY } from './game-modes';
import { LiveCommentEvent } from './live-integration/live-adapter.interface';

export interface RoomPlayer {
  userId: string;
  displayName: string;
  avatar: string;
  socketId: string;
  score: number;
  roundScore?: number; // score gained in current round
  streak: number;
  bestStreak: number;
  correctCount: number;
  lastAnsweredRound: number;
  lastResponseTimeMs: number;
  lastAnswerEvaluation?: AnswerEvaluation;
  latencyMs: number;
  isConnected: boolean;
  fairPlayScore: number;
  rank: number;
  isHost?: boolean;
  lives?: number;
  isEliminated?: boolean;
  team?: 'RED' | 'BLUE';
}

export type RoomStatus =
  | 'WAITING'
  | 'STARTING'
  | 'IN_ROUND'
  | 'PAUSED'
  | 'ROUND_SUMMARY'
  | 'FINISHED';

export interface GameRoom {
  roomCode: string;
  gameMode: GameModeType;
  title: string;
  languageId: string;
  isLiveMode: boolean;
  liveProvider?: 'MOCK' | 'TIKTOK_LIVE';
  allowLateJoin: boolean;
  status: RoomStatus;
  currentRound: number;
  totalRounds: number;
  questions: GameQuestionPayload[];
  currentQuestion?: GameQuestionPayload;
  players: Map<string, RoomPlayer>;
  roundDurationSec: number;
  roundStartedAt: number;
  createdAt: number;
  finishedAt?: number;
  roundAnswerCount: number;
  remainingOnPause?: number;
}

export class GameRoomManager {
  private readonly logger = new Logger(GameRoomManager.name);
  private rooms = new Map<string, GameRoom>();

  constructor() {
    // Periodic TTL cleanup of stale/finished rooms older than 30 minutes
    setInterval(() => this.cleanupStaleRooms(), 60000);
  }

  getRoom(roomCode: string): GameRoom | undefined {
    return this.rooms.get(roomCode.toUpperCase());
  }

  getAllRooms(): GameRoom[] {
    return Array.from(this.rooms.values());
  }

  getActiveRooms(): GameRoom[] {
    return this.getAllRooms().filter((r) => r.status !== 'FINISHED');
  }

  createRoom(
    roomCode: string,
    gameMode: GameModeType,
    title: string,
    questions: GameQuestionPayload[],
    roundDurationSec: number = 15,
    languageId: string = 'en',
    isLiveMode: boolean = false,
    allowLateJoin: boolean = true,
  ): GameRoom {
    const code = roomCode.toUpperCase();
    const room: GameRoom = {
      roomCode: code,
      gameMode,
      title,
      languageId: (languageId || 'en').toLowerCase().trim(),
      isLiveMode,
      allowLateJoin,
      status: 'WAITING',
      currentRound: 0,
      totalRounds: questions.length,
      questions,
      players: new Map(),
      roundDurationSec,
      roundStartedAt: 0,
      createdAt: Date.now(),
      roundAnswerCount: 0,
    };

    this.rooms.set(code, room);
    this.logger.log(
      `Room #${code} created (${title}, lang: [${room.languageId}], ${questions.length} questions, live: ${isLiveMode})`,
    );
    return room;
  }

  /**
   * Add or reconnect a player (No hardcoded player cap)
   */
  addPlayer(
    roomCode: string,
    userId: string,
    displayName: string,
    avatar: string,
    socketId: string,
    isHost: boolean = false,
  ): RoomPlayer | null {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return null;

    // Check if player already exists -> Reconnect & preserve state
    let player = room.players.get(userId);
    if (player) {
      player.socketId = socketId;
      player.isConnected = true;
      if (isHost) player.isHost = true;
      this.logger.log(`Player ${displayName} (${userId}) reconnected to Room #${roomCode}`);
    } else {
      player = {
        userId,
        displayName: displayName || `User_${userId.slice(0, 4)}`,
        avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`,
        socketId,
        score: 0,
        roundScore: 0,
        streak: 0,
        bestStreak: 0,
        correctCount: 0,
        lastAnsweredRound: -1,
        lastResponseTimeMs: 0,
        latencyMs: 35,
        isConnected: true,
        fairPlayScore: 100,
        rank: room.players.size + 1,
        isHost,
      };
      room.players.set(userId, player);
      this.logger.log(`Player ${displayName} joined Room #${roomCode}. Total: ${room.players.size}`);
    }

    this.updateRankings(room);
    return player;
  }

  removePlayer(roomCode: string, userId: string): void {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return;

    const player = room.players.get(userId);
    if (player) {
      player.isConnected = false;
      // In WAITING phase remove; in active game preserve score for reconnect
      if (room.status === 'WAITING' && !player.isHost) {
        room.players.delete(userId);
      }
    }
    this.updateRankings(room);
  }

  updateLatency(roomCode: string, userId: string, latencyMs: number): void {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return;
    const player = room.players.get(userId);
    if (player) {
      player.latencyMs = Math.round(latencyMs);
    }
  }

  startRound(roomCode: string): { question: GameQuestionPayload; round: number } | null {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return null;

    room.currentRound += 1;
    if (room.currentRound > room.totalRounds) {
      room.status = 'FINISHED';
      room.finishedAt = Date.now();
      return null;
    }

    room.status = 'IN_ROUND';
    room.currentQuestion = room.questions[room.currentRound - 1];
    room.roundStartedAt = Date.now();
    room.roundAnswerCount = 0;

    // Reset last round evaluations & round-specific scores
    for (const player of room.players.values()) {
      player.lastAnswerEvaluation = undefined;
      player.roundScore = 0;
    }

    return { question: room.currentQuestion, round: room.currentRound };
  }

  /**
   * Pause or resume game round
   */
  pauseRound(roomCode: string): { remainingSec: number } | null {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room || room.status !== 'IN_ROUND') return null;

    const elapsedMs = Date.now() - room.roundStartedAt;
    const remainingMs = Math.max(0, room.roundDurationSec * 1000 - elapsedMs);
    room.remainingOnPause = Math.round(remainingMs / 1000);
    room.status = 'PAUSED';
    return { remainingSec: room.remainingOnPause };
  }

  resumeRound(roomCode: string): { remainingSec: number } | null {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room || room.status !== 'PAUSED') return null;

    const remainingSec = room.remainingOnPause || 5;
    room.roundStartedAt = Date.now() - (room.roundDurationSec - remainingSec) * 1000;
    room.status = 'IN_ROUND';
    room.remainingOnPause = undefined;
    return { remainingSec };
  }

  /**
   * Extend current round thinking time dynamically
   */
  extendRoundTime(roomCode: string, extraSec: number = 5): { newRemainingSec: number } | null {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room || (room.status !== 'IN_ROUND' && room.status !== 'PAUSED')) return null;

    if (room.status === 'PAUSED' && typeof room.remainingOnPause === 'number') {
      room.remainingOnPause += extraSec;
      room.roundDurationSec += extraSec;
      return { newRemainingSec: room.remainingOnPause };
    }

    const elapsedMs = Date.now() - room.roundStartedAt;
    const currentRemainingSec = Math.max(0, Math.round((room.roundDurationSec * 1000 - elapsedMs) / 1000));
    const newRemainingSec = currentRemainingSec + extraSec;
    room.roundDurationSec += extraSec;
    return { newRemainingSec };
  }

  /**
   * Authoritative answer evaluation with anti-duplicate & anti-cheat
   */
  async submitAnswer(
    roomCode: string,
    userId: string,
    answer: string,
  ): Promise<{ evaluation: AnswerEvaluation; player: RoomPlayer; ranking: RoomPlayer[] } | null> {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room || room.status !== 'IN_ROUND' || !room.currentQuestion) return null;

    const player = room.players.get(userId);
    if (!player) return null;

    // Survival Mode Check: eliminated players cannot submit answers
    if (player.isEliminated) {
      return null;
    }

    // Strict Anti-Duplicate: only 1 answer allowed per round per participant
    if (player.lastAnsweredRound === room.currentRound) {
      return null;
    }

    const serverReceivedAt = Date.now();
    const responseTimeMs = Math.max(50, serverReceivedAt - room.roundStartedAt);

    // Anti-Cheat: Flag suspicious macro submission (< 200ms)
    if (responseTimeMs < 200 && !userId.startsWith('tt_')) {
      player.fairPlayScore = Math.max(0, player.fairPlayScore - 25);
      this.logger.warn(`[Anti-Cheat] Player ${player.displayName} submitted suspiciously fast: ${responseTimeMs}ms`);
    }

    // Evaluate using Game Mode Engine
    const engine =
      GAME_MODE_REGISTRY[room.gameMode] || GAME_MODE_REGISTRY[GameModeType.TRANSLATION_RUSH];
    const evaluation = await engine.evaluate(
      room.currentQuestion,
      answer,
      responseTimeMs,
      player.streak,
    );

    // Update player stats
    player.lastAnsweredRound = room.currentRound;
    player.lastResponseTimeMs = responseTimeMs;
    player.lastAnswerEvaluation = evaluation;
    player.roundScore = evaluation.score;

    if (evaluation.isCorrect) {
      player.score += evaluation.score;
      player.correctCount += 1;
      player.streak += 1;
      player.bestStreak = Math.max(player.bestStreak, player.streak);
    } else {
      player.streak = 0;
      player.score += evaluation.score; // partial credit
      if (room.gameMode === GameModeType.SURVIVAL) {
        if (typeof player.lives !== 'number') player.lives = 3;
        player.lives = Math.max(0, player.lives - 1);
        if (player.lives === 0) {
          player.isEliminated = true;
          this.logger.log(`[Survival] Player ${player.displayName} eliminated in room ${roomCode}`);
        }
      }
    }

    room.roundAnswerCount += 1;
    this.updateRankings(room);
    const ranking = this.getLeaderboard(roomCode);

    return { evaluation, player, ranking };
  }

  /**
   * Live Comment integration ingestor: binds TikTok viewer to room & evaluates answer
   */
  async submitLiveComment(
    roomCode: string,
    event: LiveCommentEvent,
  ): Promise<{
    evaluation?: AnswerEvaluation;
    player: RoomPlayer;
    ranking: RoomPlayer[];
    isNewAnswer: boolean;
  } | null> {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return null;

    const commenterId = `tt_${event.username}`;
    let player = room.players.get(commenterId);

    if (!player) {
      player = {
        userId: commenterId,
        displayName: event.displayName || `@${event.username}`,
        avatar:
          event.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${event.username}`,
        socketId: '',
        score: 0,
        roundScore: 0,
        streak: 0,
        bestStreak: 0,
        correctCount: 0,
        lastAnsweredRound: -1,
        lastResponseTimeMs: 0,
        latencyMs: 35,
        isConnected: true,
        fairPlayScore: 100,
        rank: room.players.size + 1,
      };
      room.players.set(commenterId, player);
    }

    // If room is not actively in round, return registered player without evaluation
    if (room.status !== 'IN_ROUND' || !room.currentQuestion) {
      return { player, ranking: this.getLeaderboard(roomCode), isNewAnswer: false };
    }

    // Ignore if already submitted for this round
    if (player.lastAnsweredRound === room.currentRound) {
      return { player, ranking: this.getLeaderboard(roomCode), isNewAnswer: false };
    }

    // Evaluate parsed option ('A'/'B'/'C'/'D') or raw comment
    const answerToEval = event.parsedOption || event.commentText;
    const res = await this.submitAnswer(roomCode, commenterId, answerToEval);
    if (!res) {
      return { player, ranking: this.getLeaderboard(roomCode), isNewAnswer: false };
    }

    return {
      evaluation: res.evaluation,
      player: res.player,
      ranking: res.ranking,
      isNewAnswer: true,
    };
  }

  updateRankings(room: GameRoom): void {
    const sorted = Array.from(room.players.values()).sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.lastResponseTimeMs - b.lastResponseTimeMs;
    });

    sorted.forEach((p, idx) => {
      p.rank = idx + 1;
    });
  }

  getLeaderboard(roomCode: string): RoomPlayer[] {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return [];
    return Array.from(room.players.values()).sort((a, b) => a.rank - b.rank);
  }

  private cleanupStaleRooms(): void {
    const now = Date.now();
    const halfHour = 30 * 60 * 1000;

    for (const [code, room] of this.rooms.entries()) {
      const isOld = now - room.createdAt > halfHour;
      const isFinishedOld =
        room.status === 'FINISHED' && room.finishedAt && now - room.finishedAt > 10 * 60 * 1000;
      if (isFinishedOld || (isOld && room.players.size === 0)) {
        this.rooms.delete(code);
        this.logger.log(`Room #${code} cleaned up.`);
      }
    }
  }
}
