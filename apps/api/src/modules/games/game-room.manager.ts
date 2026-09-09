import { Logger } from '@nestjs/common';
import { GameModeType } from '@prisma/client';
import { GameQuestionPayload, AnswerEvaluation } from './game-mode.interface';
import { GAME_MODE_REGISTRY } from './game-modes';

export interface RoomPlayer {
  userId: string;
  displayName: string;
  avatar: string;
  socketId: string;
  score: number;
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
}

export type RoomStatus = 'WAITING' | 'STARTING' | 'IN_ROUND' | 'ROUND_SUMMARY' | 'FINISHED';

export interface GameRoom {
  roomCode: string;
  gameMode: GameModeType;
  title: string;
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
}

export class GameRoomManager {
  private readonly logger = new Logger(GameRoomManager.name);
  private rooms = new Map<string, GameRoom>();

  constructor() {
    // Periodic TTL cleanup of stale/finished rooms older than 15 minutes
    setInterval(() => this.cleanupStaleRooms(), 60000);
  }

  getRoom(roomCode: string): GameRoom | undefined {
    return this.rooms.get(roomCode);
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
  ): GameRoom {
    const room: GameRoom = {
      roomCode,
      gameMode,
      title,
      status: 'WAITING',
      currentRound: 0,
      totalRounds: questions.length,
      questions,
      players: new Map(),
      roundDurationSec,
      roundStartedAt: 0,
      createdAt: Date.now(),
    };

    this.rooms.set(roomCode, room);
    this.logger.log(`Room #${roomCode} created (${title}, ${questions.length} questions, mode: ${gameMode})`);
    return room;
  }

  addPlayer(
    roomCode: string,
    userId: string,
    displayName: string,
    avatar: string,
    socketId: string,
  ): RoomPlayer | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    // Support reconnecting user with preserved score & streak
    let player = room.players.get(userId);
    if (player) {
      player.socketId = socketId;
      player.isConnected = true;
      this.logger.log(`Player ${displayName} (${userId}) reconnected to Room #${roomCode}`);
    } else {
      player = {
        userId,
        displayName: displayName || `Player_${userId.slice(0, 4)}`,
        avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`,
        socketId,
        score: 0,
        streak: 0,
        bestStreak: 0,
        correctCount: 0,
        lastAnsweredRound: -1,
        lastResponseTimeMs: 0,
        latencyMs: 38,
        isConnected: true,
        fairPlayScore: 100,
        rank: room.players.size + 1,
      };
      room.players.set(userId, player);
      this.logger.log(`Player ${displayName} (${userId}) joined Room #${roomCode}. Total: ${room.players.size}`);
    }

    this.updateRankings(room);
    return player;
  }

  removePlayer(roomCode: string, userId: string): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    const player = room.players.get(userId);
    if (player) {
      player.isConnected = false;
      // In WAITING phase, remove completely. In game, preserve score in case of reconnect.
      if (room.status === 'WAITING') {
        room.players.delete(userId);
      }
    }
    this.updateRankings(room);
  }

  updateLatency(roomCode: string, userId: string, latencyMs: number): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;
    const player = room.players.get(userId);
    if (player) {
      player.latencyMs = Math.round(latencyMs);
    }
  }

  startRound(roomCode: string): { question: GameQuestionPayload; round: number } | null {
    const room = this.rooms.get(roomCode);
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

    // Reset last round answers
    for (const player of room.players.values()) {
      player.lastAnswerEvaluation = undefined;
    }

    return { question: room.currentQuestion, round: room.currentRound };
  }

  /**
   * Server-authoritative answer evaluation
   */
  async submitAnswer(
    roomCode: string,
    userId: string,
    answer: string,
  ): Promise<{ evaluation: AnswerEvaluation; player: RoomPlayer; ranking: RoomPlayer[] } | null> {
    const room = this.rooms.get(roomCode);
    if (!room || room.status !== 'IN_ROUND' || !room.currentQuestion) return null;

    const player = room.players.get(userId);
    if (!player) return null;

    // Anti-duplicate: only 1 submission per round
    if (player.lastAnsweredRound === room.currentRound) {
      return null;
    }

    const serverReceivedAt = Date.now();
    const responseTimeMs = Math.max(50, serverReceivedAt - room.roundStartedAt);

    // Anti-Cheat: Flag macro/bot if response time is ridiculously fast (< 250ms)
    if (responseTimeMs < 250) {
      player.fairPlayScore = Math.max(0, player.fairPlayScore - 25);
      this.logger.warn(`[Anti-Cheat] Player ${player.displayName} submitted suspiciously fast: ${responseTimeMs}ms`);
    }

    // Evaluate with game mode engine
    const engine = GAME_MODE_REGISTRY[room.gameMode] || GAME_MODE_REGISTRY[GameModeType.TRANSLATION_RUSH];
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

    if (evaluation.isCorrect) {
      player.score += evaluation.score;
      player.correctCount += 1;
      player.streak += 1;
      player.bestStreak = Math.max(player.bestStreak, player.streak);
    } else {
      player.streak = 0;
      player.score += evaluation.score; // partial points
    }

    this.updateRankings(room);
    const ranking = this.getLeaderboard(roomCode);

    return { evaluation, player, ranking };
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
    const room = this.rooms.get(roomCode);
    if (!room) return [];
    return Array.from(room.players.values()).sort((a, b) => a.rank - b.rank);
  }

  private cleanupStaleRooms(): void {
    const now = Date.now();
    const fifteenMinutes = 15 * 60 * 1000;

    for (const [code, room] of this.rooms.entries()) {
      const isOld = now - room.createdAt > fifteenMinutes;
      const isFinishedOld = room.status === 'FINISHED' && room.finishedAt && now - room.finishedAt > 5 * 60 * 1000;
      if (isFinishedOld || (isOld && room.players.size === 0)) {
        this.rooms.delete(code);
        this.logger.log(`Room #${code} cleaned up from in-memory store.`);
      }
    }
  }
}
