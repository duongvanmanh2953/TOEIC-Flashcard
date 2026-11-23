import { Logger } from '@nestjs/common';
import { GameModeType } from '@prisma/client';
import { GameQuestionPayload, AnswerEvaluation } from './game-mode.interface';
import { GAME_MODE_REGISTRY, normalizeText, scoreBattleAnswer, scoreLiveResponse } from './game-modes';
import { LiveCommentEvent } from './live-integration/live-adapter.interface';

export function normalizeLiveAnswer(answer: string): string {
  return normalizeText(answer.normalize('NFKC'));
}

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
  answeredCount?: number;
  totalResponseTimeMs?: number;
  lastAnsweredRound: number;
  lastResponseTimeMs: number;
  lastAnswerEvaluation?: AnswerEvaluation;
  latencyMs: number;
  isConnected: boolean;
  fairPlayScore: number;
  rank: number;
  isHost?: boolean;
  isCommenter?: boolean;
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

export interface QuestionCommentAward {
  commenterId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  rank: number; // 1, 2, 3, 4+
  answer: string;
  points: number; // 30, 20, 15, 0
  receivedAt: number;
}

export interface GameRoom {
  roomCode: string;
  gameMode: GameModeType;
  title: string;
  languageId: string;
  isLiveMode: boolean;
  liveProvider?: 'MOCK' | 'TIKTOK_LIVE';
  allowLateJoin: boolean;
  hostUserId?: string;
  scheduled?: boolean;
  status: RoomStatus;
  currentRound: number;
  totalRounds: number;
  questions: GameQuestionPayload[];
  currentQuestion?: GameQuestionPayload;
  players: Map<string, RoomPlayer>;
  roundDurationSec: number;
  baseRoundDurationSec: number;
  roundStartedAt: number;
  createdAt: number;
  finishedAt?: number;
  roundAnswerCount: number;
  liveOptionVotes?: Record<string, number>;
  correctCommentersCount?: number;
  roundCommentCount?: number;
  questionCommentAwards?: Map<number, QuestionCommentAward[]>;
  liveAcceptedEvents?: Set<string>;
  summaryEndsAt?: number;
  remainingOnPause?: number;
}

export class GameRoomManager {
  private readonly logger = new Logger(GameRoomManager.name);
  private rooms = new Map<string, GameRoom>();

  constructor() {
    // Periodic TTL cleanup of stale/finished rooms older than 30 minutes
    setInterval(() => this.cleanupStaleRooms(), 60000).unref();
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
    const existing = this.rooms.get(code);
    if (existing) return existing;
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
      baseRoundDurationSec: roundDurationSec,
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
    if (!room || (room.status !== 'STARTING' && room.status !== 'ROUND_SUMMARY')) return null;

    const question = room.questions[room.currentRound];
    if (!question) return null;
    room.currentRound += 1;

    room.status = 'IN_ROUND';
    room.currentQuestion = question;
    room.roundDurationSec = room.isLiveMode ? 20 : room.baseRoundDurationSec;
    room.roundStartedAt = Date.now();
    room.roundAnswerCount = 0;
    room.liveOptionVotes = Object.create(null);
    room.summaryEndsAt = undefined;
    room.correctCommentersCount = 0;
    room.roundCommentCount = 0;

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
    room.remainingOnPause = Math.ceil(remainingMs / 1000);
    room.status = 'PAUSED';
    return { remainingSec: room.remainingOnPause };
  }

  resumeRound(roomCode: string): { remainingSec: number } | null {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room || room.status !== 'PAUSED') return null;

    const remainingSec = room.remainingOnPause ?? 0;
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
    round?: number,
    skip = false,
  ): Promise<{ evaluation: AnswerEvaluation; player: RoomPlayer; ranking: RoomPlayer[] } | null> {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room || room.isLiveMode || room.status !== 'IN_ROUND' || !room.currentQuestion) return null;

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
    const acceptedRound = room.currentRound;
    if ((round !== undefined && round !== acceptedRound) ||
        serverReceivedAt >= room.roundStartedAt + room.roundDurationSec * 1000) return null;

    // Reserve the answer before awaiting the scoring engine.
    player.lastAnsweredRound = acceptedRound;
    const responseTimeMs = Math.max(50, serverReceivedAt - room.roundStartedAt);

    // Anti-Cheat: Flag suspicious macro submission (< 200ms)
    if (responseTimeMs < 200 && !userId.startsWith('tt_')) {
      player.fairPlayScore = Math.max(0, player.fairPlayScore - 25);
      this.logger.warn(`[Anti-Cheat] Player ${player.displayName} submitted suspiciously fast: ${responseTimeMs}ms`);
    }

    // Evaluate using Game Mode Engine
    const engine =
      GAME_MODE_REGISTRY[room.gameMode] || GAME_MODE_REGISTRY[GameModeType.TRANSLATION_RUSH];
    const evaluation: AnswerEvaluation = skip
      ? { isCorrect: false, accuracy: 0, semanticSimilarity: 0, speedBonus: 0, streakBonus: 0, score: 0, feedbackText: 'Đã bỏ qua' }
      : await engine.evaluate(
        room.currentQuestion,
        answer,
        responseTimeMs,
        player.streak,
      );
    evaluation.score = scoreBattleAnswer(evaluation.isCorrect, responseTimeMs);
    evaluation.speedBonus = 0;
    evaluation.streakBonus = 0;

    if (room.status !== 'IN_ROUND' || room.currentRound !== acceptedRound) return null;

    // Update player stats
    player.lastResponseTimeMs = responseTimeMs;
    player.answeredCount = (player.answeredCount ?? 0) + 1;
    player.totalResponseTimeMs = (player.totalResponseTimeMs ?? 0) + responseTimeMs;
    player.lastAnswerEvaluation = evaluation;
    player.roundScore = evaluation.score;

    if (evaluation.isCorrect) {
      player.score += evaluation.score;
      player.correctCount += 1;
      player.streak += 1;
      player.bestStreak = Math.max(player.bestStreak, player.streak);
    } else {
      player.streak = 0;
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
  submitLiveComment(roomCode: string, event: LiveCommentEvent) {
    const room = this.rooms.get(roomCode.toUpperCase());
    const question = room?.currentQuestion;
    const receivedAt = Date.now();
    if (!room?.isLiveMode || !question || room.status !== 'IN_ROUND' ||
        event.timestamp < room.roundStartedAt || receivedAt >= room.roundStartedAt + room.roundDurationSec * 1000) return null;

    const username = event.username.trim().toLowerCase();
    if (!username) return null;
    const commenterId = `tt_${username}`;
    const existing = room.players.get(commenterId);
    room.roundCommentCount = (room.roundCommentCount ?? 0) + 1;
    const raw = typeof event.commentText === 'string' ? event.commentText.trim() : '';
    if (!raw || raw.length > 100) return null;
    const normalized = normalizeLiveAnswer(raw);
    const letters = ['A', 'B', 'C', 'D'];
    const isChoice = Boolean(question.options?.length);
    const variations = [question.correctAnswer, ...(question.acceptedAnswers ?? [])]
      .filter(Boolean).map(normalizeLiveAnswer);
    let answer: string;
    let isCorrect: boolean;
    if (isChoice) {
      const exactChoice = letters.indexOf(raw.toUpperCase());
      const numberChoice = /^[1-4]$/.test(raw) ? Number(raw) - 1 : -1;
      const optionText = question.options!.findIndex((value) =>
        normalizeLiveAnswer(value.replace(/^[ABCD][.):]\s*/i, '')) === normalized);
      const index = [exactChoice, numberChoice, optionText].find((value) => value >= 0) ?? -1;
      if (!normalized || !letters[index] || !question.options?.[index]) return null;
      answer = letters[index];
      isCorrect = index === question.correctOptionIndex;
    } else {
      isCorrect = variations.includes(normalized);
      // Accept short word answers (including wrong guesses) and exact accepted phrases.
      if (!normalized || (!isCorrect && !/^[\p{L}\p{M}]+(?:[- ][\p{L}\p{M}]+){0,2}$/u.test(normalized))) return null;
      answer = normalized;
    }

    if (existing?.lastAnsweredRound === room.currentRound || room.liveAcceptedEvents?.has(event.eventId)) {
      return { status: 'duplicate' as const };
    }

    const player: RoomPlayer = existing ?? {
      userId: commenterId,
      displayName: event.displayName || `@${username}`,
      avatar: event.avatarUrl || '',
      socketId: '',
      score: 0,
      streak: 0,
      bestStreak: 0,
      correctCount: 0,
      lastAnsweredRound: -1,
      lastResponseTimeMs: 0,
      latencyMs: 0,
      isConnected: true,
      fairPlayScore: 100,
      rank: 0,
      isCommenter: true,
    };
    room.players.set(commenterId, player);
    (room.liveAcceptedEvents ??= new Set()).add(event.eventId);
    player.lastAnsweredRound = room.currentRound;
    player.lastResponseTimeMs = receivedAt - room.roundStartedAt;
    const votes = room.liveOptionVotes ??= Object.create(null);
    votes[answer] = (votes[answer] ?? 0) + 1;
    room.roundAnswerCount++;
    let score = 0;
    if (isCorrect) {
      const allAwards = room.questionCommentAwards ??= new Map<number, QuestionCommentAward[]>();
      const awards = allAwards.get(room.currentRound) ?? [];
      score = scoreLiveResponse(awards.length);
      if (score > 0) {
        awards.push({
          commenterId,
          username,
          displayName: player.displayName,
          avatarUrl: player.avatar,
          rank: awards.length + 1,
          answer,
          points: score,
          receivedAt,
        });
        allAwards.set(room.currentRound, awards);
      }
      player.score += score;
      player.correctCount++;
      player.streak++;
      player.bestStreak = Math.max(player.bestStreak, player.streak);
      room.correctCommentersCount = (room.correctCommentersCount ?? 0) + 1;
    } else {
      player.streak = 0;
    }
    player.roundScore = score;
    this.updateRankings(room);
    return { status: 'accepted' as const, player, answer, isCorrect, score };
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

  getCommenterLeaderboard(roomCode: string): RoomPlayer[] {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) return [];
    return Array.from(room.players.values())
      .filter((p) => Boolean(p.isCommenter))
      .sort((a, b) => {
        const scoreA = a.score ?? 0;
        const scoreB = b.score ?? 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return a.lastResponseTimeMs - b.lastResponseTimeMs;
      })
      .map((p, idx) => ({ ...p, rank: idx + 1, score: p.score ?? 0 }));
  }

  removeRoom(roomCode: string): void {
    const code = roomCode.toUpperCase();
    this.rooms.delete(code);
  }

  private cleanupStaleRooms(): void {
    const now = Date.now();
    const halfHour = 30 * 60 * 1000;

    for (const [code, room] of this.rooms.entries()) {
      const isOld = now - room.createdAt > halfHour;
      const isFinishedOld =
        room.status === 'FINISHED' && room.finishedAt && now - room.finishedAt > 10 * 60 * 1000;
      if (isFinishedOld || (isOld && room.status === 'WAITING' && !Array.from(room.players.values()).some((player) => player.isConnected))) {
        this.rooms.delete(code);
        this.logger.log(`Room #${code} cleaned up.`);
      }
    }
  }
}
