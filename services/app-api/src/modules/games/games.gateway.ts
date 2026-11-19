import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { GamesService } from './games.service';
import { QuestionProviderService } from './question-provider.service';
import { LiveIntegrationService } from './live-integration/live-integration.service';
import { LiveProviderType } from './live-integration/live-adapter.interface';
import { GameModeType } from '@prisma/client';
import { SYSTEM_PRESET_ROOMS, getSystemPresetRooms } from './custom-rooms.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class GamesGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GamesGateway.name);
  private roomTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly gamesService: GamesService,
    private readonly questionProvider: QuestionProviderService,
    private readonly liveIntegration: LiveIntegrationService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('Games WebSocket Gateway initialized for Realtime Battles & Live Integration');

    // Subscribe to live comments from TikTok Live & Mock adapters
    this.liveIntegration.onLiveComment(async (event) => {
      const code = event.roomCode.toUpperCase();
      const room = this.gamesService.roomManager.getRoom(code);
      if (!room) return;

      const result = await this.gamesService.roomManager.submitLiveComment(code, event);

      // 1. Broadcast comment to the Live Activity feed
      this.server.to(`game_room_${code}`).emit('live_comment_received', {
        eventId: event.eventId,
        username: event.username,
        displayName: event.displayName,
        avatarUrl: event.avatarUrl,
        commentText: event.commentText,
        parsedOption: event.parsedOption,
        timestamp: event.timestamp,
        provider: event.provider,
        isCorrect: result?.evaluation?.isCorrect,
        scoreAdded: result?.evaluation?.score,
        totalScore: result?.player?.score,
        rank: result?.player?.rank,
        streak: result?.player?.streak,
      });

      // 2. Broadcast updated leaderboard if answer was evaluated
      if (result && result.isNewAnswer) {
        this.server.to(`game_room_${code}`).emit('live_ranking_update', {
          ranking: result.ranking,
          roundAnswerCount: room.roundAnswerCount,
          totalParticipants: room.players.size,
          lastAnsweredBy: {
            displayName: result.player.displayName,
            scoreAdded: result.evaluation?.score || 0,
            isCorrect: result.evaluation?.isCorrect || false,
            streak: result.player.streak,
          },
        });
      }
    });
  }

  handleConnection(client: Socket) {
    // Client connected
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    const roomCode = client.data?.roomCode;
    if (roomCode && userId) {
      this.gamesService.roomManager.removePlayer(roomCode, userId);
      this.server.to(`game_room_${roomCode}`).emit('player_left', { userId });
      this.server.to(`game_room_${roomCode}`).emit('room:player_left', { userId });
      this.broadcastRanking(roomCode);
    }
  }

  /**
   * Ping - Pong latency diagnostic
   */
  @SubscribeMessage('ping_latency')
  handlePingLatency(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { clientTime: number; roomCode?: string; userId?: string },
  ) {
    const serverTime = Date.now();
    const roundTrip = serverTime - (data.clientTime || serverTime);
    if (data.roomCode && data.userId) {
      this.gamesService.roomManager.updateLatency(data.roomCode, data.userId, roundTrip);
    }
    return { clientTime: data.clientTime, serverTime, latencyMs: roundTrip };
  }

  /**
   * Player joins or creates an automatic game room
   */
  @SubscribeMessage('join_game')
  async handleJoinGame(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      gameMode: GameModeType;
      userId: string;
      displayName: string;
      avatar: string;
      languageId?: string;
    },
  ) {
    try {
      const mode = data.gameMode || GameModeType.TRANSLATION_RUSH;
      const lang = data.languageId || 'en';
      const { room, player } = await this.gamesService.joinOrCreateRoom(
        mode,
        data.userId,
        data.displayName,
        data.avatar,
        client.id,
        lang,
      );

      client.data.userId = data.userId;
      client.data.roomCode = room.roomCode;
      client.join(`game_room_${room.roomCode}`);

      // Notify player
      client.emit('joined_game_room', {
        roomCode: room.roomCode,
        gameMode: room.gameMode,
        title: room.title,
        status: room.status,
        currentRound: room.currentRound,
        totalRounds: room.totalRounds,
        languageId: room.languageId,
        player,
        ranking: this.gamesService.roomManager.getLeaderboard(room.roomCode),
      });

      // Broadcast to room
      this.server.to(`game_room_${room.roomCode}`).emit('player_joined', {
        player,
        totalPlayers: room.players.size,
        ranking: this.gamesService.roomManager.getLeaderboard(room.roomCode),
      });

      // If room is in WAITING state and has >= 1 player, trigger automatic starting countdown (5 seconds)
      if (room.status === 'WAITING' && !this.roomTimers.has(`start_${room.roomCode}`)) {
        this.scheduleGameStart(room.roomCode, 5);
      }

      // If user rejoined an IN_ROUND game, send current question state immediately
      if (room.status === 'IN_ROUND' && room.currentQuestion) {
        const elapsedMs = Date.now() - room.roundStartedAt;
        const remainingSec = Math.max(1, Math.round((room.roundDurationSec * 1000 - elapsedMs) / 1000));
        client.emit('round_started', {
          round: room.currentRound,
          totalRounds: room.totalRounds,
          question: {
            id: room.currentQuestion.id,
            prompt: room.currentQuestion.prompt,
            direction: room.currentQuestion.direction,
            category: room.currentQuestion.category,
            audioUrl: room.currentQuestion.audioUrl,
            options: room.currentQuestion.options,
            languageCode: room.currentQuestion.languageCode,
            questionType: room.currentQuestion.questionType,
            phonetic: room.currentQuestion.phonetic,
            targetWord: room.currentQuestion.targetWord,
            hint: room.currentQuestion.hint,
          },
          durationSec: remainingSec,
          roundAnswerCount: room.roundAnswerCount,
          totalParticipants: room.players.size,
        });
      }

      return { status: 'success', roomCode: room.roomCode };
    } catch (err: any) {
      this.logger.error(`Error in handleJoinGame: ${err.message}`);
      return { status: 'error', message: err.message };
    }
  }

  /**
   * Player joins custom user-created room (supports both event names)
   */
  @SubscribeMessage('join_custom_room')
  @SubscribeMessage('room:join_custom')
  async handleJoinCustomRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      roomCode: string;
      userId: string;
      displayName: string;
      avatar: string;
      isHost?: boolean;
      languageId?: string;
    },
  ) {
    try {
      const code = data.roomCode.toUpperCase();
      let room = this.gamesService.roomManager.getRoom(code);
      let isHost = !!data.isHost;

      if (!room) {
        // 1. Check if it's a predefined system preset room across all supported languages
        const targetLang = (data.languageId || 'en').toLowerCase().trim();
        const langList = [targetLang, 'zh', 'ja', 'ko', 'en', 'de', 'fr', 'es', 'th', 'vi'];
        let preset: any = null;
        for (const l of langList) {
          const match = getSystemPresetRooms(l).find((p) => p.roomCode === code);
          if (match) {
            preset = match;
            break;
          }
        }

        if (preset) {
          const effectiveLang = preset.languageId || targetLang;
          const questions = await this.questionProvider.getQuestionsForRoom(
            preset.sourceType,
            undefined,
            preset.questionCount,
            preset.gameMode,
            effectiveLang,
          );
          const roundDuration = Math.min(15, preset.roundDurationSec || 12);
          room = this.gamesService.roomManager.createRoom(
            preset.roomCode,
            preset.gameMode,
            preset.title,
            questions,
            roundDuration,
            effectiveLang,
            preset.isLiveMode,
            preset.allowLateJoin,
          );
          // If user created or joins system preset first, give them host controls
          isHost = true;
        } else {
          // 2. Fallback: load room from DB if not yet in memory
          const dbRoom = await this.gamesService.prisma.customGameRoom.findUnique({
            where: { roomCode: code },
          });
          if (!dbRoom) {
            return { status: 'error', message: 'Phòng thi đấu không tồn tại.' };
          }
          if (dbRoom.hostUserId === data.userId) {
            isHost = true;
          }

          const effectiveDbLang = dbRoom.languageId || targetLang || 'en';
          const questions = await this.questionProvider.getQuestionsForRoom(
            dbRoom.sourceType,
            dbRoom.sourceId,
            dbRoom.questionCount || 10,
            dbRoom.gameMode,
            effectiveDbLang,
          );
          const isLive = Boolean((dbRoom as any).isLiveMode || (dbRoom.maxPlayers && dbRoom.maxPlayers > 50));
          const dbDuration = Math.min(15, dbRoom.roundDurationSec || 12);
          room = this.gamesService.roomManager.createRoom(
            dbRoom.roomCode,
            dbRoom.gameMode,
            dbRoom.title,
            questions,
            dbDuration,
            effectiveDbLang,
            isLive,
            dbRoom.allowLateJoin,
          );
        }
      }

      const player = this.gamesService.roomManager.addPlayer(
        code,
        data.userId,
        data.displayName,
        data.avatar,
        client.id,
        isHost,
      );

      client.data.userId = data.userId;
      client.data.roomCode = code;
      client.join(`game_room_${code}`);

      const liveStatus = this.liveIntegration.getLiveStatus(code);

      // Notify player
      client.emit('room:joined_success', {
        roomCode: code,
        title: room.title,
        gameMode: room.gameMode,
        status: room.status,
        totalRounds: room.totalRounds,
        currentRound: room.currentRound,
        languageId: room.languageId,
        isLiveMode: room.isLiveMode,
        liveStatus,
        player,
        players: Array.from(room.players.values()),
        roundAnswerCount: room.roundAnswerCount,
      });

      // Broadcast to all participants
      this.server.to(`game_room_${code}`).emit('room:player_joined', {
        player,
        totalPlayers: room.players.size,
        players: Array.from(room.players.values()),
      });

      // If user rejoined an IN_ROUND game, send current question state immediately
      if (room.status === 'IN_ROUND' && room.currentQuestion) {
        const elapsedMs = Date.now() - room.roundStartedAt;
        const remainingSec = Math.max(1, Math.round((room.roundDurationSec * 1000 - elapsedMs) / 1000));
        client.emit('round_started', {
          round: room.currentRound,
          totalRounds: room.totalRounds,
          question: {
            id: room.currentQuestion.id,
            prompt: room.currentQuestion.prompt,
            direction: room.currentQuestion.direction,
            category: room.currentQuestion.category,
            audioUrl: room.currentQuestion.audioUrl,
            options: room.currentQuestion.options,
            languageCode: room.currentQuestion.languageCode,
            questionType: room.currentQuestion.questionType,
            phonetic: room.currentQuestion.phonetic,
            targetWord: room.currentQuestion.targetWord,
            hint: room.currentQuestion.hint,
          },
          durationSec: remainingSec,
          roundAnswerCount: room.roundAnswerCount,
          totalParticipants: room.players.size,
        });
      }

      return { status: 'success', roomCode: code };
    } catch (err: any) {
      this.logger.error(`Error joining custom room: ${err?.message}`);
      return { status: 'error', message: err?.message };
    }
  }

  /**
   * Player toggles ready status in waiting room
   */
  @SubscribeMessage('room:toggle_ready')
  handleToggleReady(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomCode: string; userId: string; isReady: boolean },
  ) {
    const code = data.roomCode.toUpperCase();
    this.server.to(`game_room_${code}`).emit('room:player_ready_changed', {
      userId: data.userId,
      isReady: data.isReady,
    });
    return { status: 'success' };
  }

  /**
   * Host starts game from waiting room
   */
  @SubscribeMessage('room:host_start_game')
  handleHostStartGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomCode: string },
  ) {
    const code = data.roomCode.toUpperCase();
    this.server.to(`game_room_${code}`).emit('room:starting_countdown', { countdownSec: 3 });
    this.scheduleGameStart(code, 3);
    return { status: 'starting' };
  }

  /**
   * Host pauses current round
   */
  @SubscribeMessage('room:host_pause_game')
  handleHostPauseGame(@MessageBody() data: { roomCode: string }) {
    const code = data.roomCode.toUpperCase();
    const paused = this.gamesService.roomManager.pauseRound(code);
    if (paused) {
      const roundTimerKey = `round_${code}`;
      if (this.roomTimers.has(roundTimerKey)) {
        clearTimeout(this.roomTimers.get(roundTimerKey)!);
        this.roomTimers.delete(roundTimerKey);
      }
      this.server.to(`game_room_${code}`).emit('room:game_paused', {
        remainingSec: paused.remainingSec,
      });
    }
    return { status: 'paused' };
  }

  /**
   * Host resumes current round
   */
  @SubscribeMessage('room:host_resume_game')
  handleHostResumeGame(@MessageBody() data: { roomCode: string }) {
    const code = data.roomCode.toUpperCase();
    const resumed = this.gamesService.roomManager.resumeRound(code);
    if (resumed) {
      const roundTimerKey = `round_${code}`;
      const timer = setTimeout(() => {
        this.endRound(code);
      }, resumed.remainingSec * 1000);
      this.roomTimers.set(roundTimerKey, timer);

      this.server.to(`game_room_${code}`).emit('room:game_resumed', {
        remainingSec: resumed.remainingSec,
      });
    }
    return { status: 'resumed' };
  }

  /**
   * Host extends thinking time dynamically (+5s or specified extraSec)
   */
  @SubscribeMessage('room:host_extend_time')
  handleHostExtendTime(
    @MessageBody() data: { roomCode: string; extraSec?: number },
  ) {
    const code = data.roomCode.toUpperCase();
    const extra = data.extraSec || 5;
    const res = this.gamesService.roomManager.extendRoundTime(code, extra);
    if (res) {
      const roundTimerKey = `round_${code}`;
      if (this.roomTimers.has(roundTimerKey)) {
        clearTimeout(this.roomTimers.get(roundTimerKey)!);
      }
      const timer = setTimeout(() => {
        this.endRound(code);
      }, res.newRemainingSec * 1000);
      this.roomTimers.set(roundTimerKey, timer);

      this.server.to(`game_room_${code}`).emit('room:time_extended', {
        extraSec: extra,
        newRemainingSec: res.newRemainingSec,
      });
    }
    return { status: 'extended' };
  }

  /**
   * Host advances immediately to next round
   */
  @SubscribeMessage('room:host_next_round')
  handleHostNextRound(@MessageBody() data: { roomCode: string }) {
    const code = data.roomCode.toUpperCase();
    const roundTimerKey = `round_${code}`;
    if (this.roomTimers.has(roundTimerKey)) {
      clearTimeout(this.roomTimers.get(roundTimerKey)!);
      this.roomTimers.delete(roundTimerKey);
    }
    this.endRound(code);
    return { status: 'advanced' };
  }

  /**
   * Host ends game immediately
   */
  @SubscribeMessage('room:host_end_game')
  handleHostEndGame(@MessageBody() data: { roomCode: string }) {
    const code = data.roomCode.toUpperCase();
    const roundTimerKey = `round_${code}`;
    if (this.roomTimers.has(roundTimerKey)) {
      clearTimeout(this.roomTimers.get(roundTimerKey)!);
      this.roomTimers.delete(roundTimerKey);
    }
    this.finishGame(code);
    return { status: 'finished' };
  }

  /**
   * Connect TikTok Live or Mock Provider
   */
  @SubscribeMessage('room:connect_live')
  async handleConnectLive(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      roomCode: string;
      provider?: LiveProviderType;
      channelName: string;
      roomId?: string;
      sessionToken?: string;
    },
  ) {
    const code = data.roomCode.toUpperCase();
    const res = await this.liveIntegration.connectRoomLive(
      code,
      data.provider || 'MOCK',
      data.channelName,
      { roomId: data.roomId, sessionToken: data.sessionToken },
    );

    const room = this.gamesService.roomManager.getRoom(code);
    if (room && res.success) {
      room.isLiveMode = true;
      room.liveProvider = res.provider;
    }

    this.server.to(`game_room_${code}`).emit('live_status_changed', res);
    return res;
  }

  /**
   * Disconnect Live Integration
   */
  @SubscribeMessage('room:disconnect_live')
  async handleDisconnectLive(@MessageBody() data: { roomCode: string }) {
    const code = data.roomCode.toUpperCase();
    await this.liveIntegration.disconnectRoomLive(code);
    const room = this.gamesService.roomManager.getRoom(code);
    if (room) {
      room.isLiveMode = false;
    }
    const res = {
      success: true,
      status: 'DISCONNECTED',
      message: 'Đã ngắt kết nối Live Integration.',
      provider: 'MOCK' as LiveProviderType,
    };
    this.server.to(`game_room_${code}`).emit('live_status_changed', res);
    return res;
  }

  /**
   * Host triggers a simulated test comment
   */
  @SubscribeMessage('room:send_mock_comment')
  handleSendMockComment(
    @MessageBody()
    data: {
      roomCode: string;
      username?: string;
      displayName?: string;
      commentText: string;
    },
  ) {
    const event = this.liveIntegration.sendMockComment(data.roomCode, data);
    return { status: 'sent', event };
  }

  /**
   * Host triggers a burst of mock audience comments
   */
  @SubscribeMessage('room:simulate_batch_comments')
  handleSimulateBatchComments(@MessageBody() data: { roomCode: string; count?: number }) {
    const events = this.liveIntegration.simulateAudienceBatch(data.roomCode, data.count || 8);
    return { status: 'simulating', count: events.length };
  }

  /**
   * Host kicks a player from waiting room
   */
  @SubscribeMessage('room:kick_user')
  handleKickUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomCode: string; targetUserId: string },
  ) {
    const code = data.roomCode.toUpperCase();
    this.gamesService.roomManager.removePlayer(code, data.targetUserId);
    this.server.to(`game_room_${code}`).emit('room:player_kicked', {
      targetUserId: data.targetUserId,
    });
    this.broadcastRanking(code);
    return { status: 'success' };
  }

  /**
   * Chat message inside waiting room or battle room
   */
  @SubscribeMessage('room:send_chat')
  handleRoomChat(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      roomCode: string;
      userId: string;
      displayName: string;
      message: string;
      avatar?: string;
    },
  ) {
    if (!data.message || !data.message.trim()) return;
    const code = data.roomCode.toUpperCase();
    this.server.to(`game_room_${code}`).emit('room:chat_message', {
      id: Date.now().toString(),
      userId: data.userId,
      displayName: data.displayName,
      avatar: data.avatar,
      message: data.message.trim(),
      timestamp: Date.now(),
    });
  }

  /**
   * Enter RabbitMQ Matchmaking Queue for balanced Arena battles
   */
  @SubscribeMessage('queue_matchmaking')
  async handleQueueMatchmaking(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      gameMode: GameModeType;
      userId: string;
      displayName: string;
      avatar: string;
    },
  ) {
    try {
      const mode = data.gameMode || GameModeType.TRANSLATION_RUSH;
      const enqueued = await this.gamesService.enqueueMatchmaking(mode, {
        userId: data.userId,
        displayName: data.displayName,
        avatar: data.avatar,
        socketId: client.id,
      });

      if (!enqueued) {
        client.emit('matchmaking_status', {
          status: 'ALREADY_QUEUED',
          gameMode: mode,
          message: 'Bạn đang có yêu cầu ghép trận đang chờ xử lý. Vui lòng đợi trong giây lát!',
        });
        return { status: 'already_queued', gameMode: mode };
      }

      client.emit('matchmaking_status', {
        status: 'QUEUED',
        gameMode: mode,
        message: 'Đã vào hàng đợi tìm đối thủ đấu trường...',
        queuedAt: Date.now(),
      });
      return { status: 'queued', gameMode: mode };
    } catch (err: any) {
      this.logger.error(`Failed to queue player for matchmaking: ${err?.message}`);
      return { status: 'error', message: 'Không thể xếp vào hàng đợi thi đấu.' };
    }
  }

  /**
   * Start game countdown immediately
   */
  @SubscribeMessage('start_game_now')
  handleStartGameNow(@MessageBody() data: { roomCode: string }) {
    this.scheduleGameStart(data.roomCode.toUpperCase(), 3);
  }

  private scheduleGameStart(roomCode: string, countdownSec: number) {
    let remaining = countdownSec;
    const room = this.gamesService.roomManager.getRoom(roomCode);
    if (!room) return;

    room.status = 'STARTING';
    const timerKey = `start_${roomCode}`;

    if (this.roomTimers.has(timerKey)) {
      clearInterval(this.roomTimers.get(timerKey)!);
    }

    const interval = setInterval(() => {
      this.server.to(`game_room_${roomCode}`).emit('game_starting_countdown', {
        secondsRemaining: remaining,
      });

      remaining -= 1;
      if (remaining < 0) {
        clearInterval(interval);
        this.roomTimers.delete(timerKey);
        this.startNextRound(roomCode);
      }
    }, 1000);

    this.roomTimers.set(timerKey, interval);
  }

  private startNextRound(roomCode: string) {
    const roundData = this.gamesService.roomManager.startRound(roomCode);
    if (!roundData) {
      this.finishGame(roomCode);
      return;
    }

    const room = this.gamesService.roomManager.getRoom(roomCode);
    if (!room) return;

    this.server.to(`game_room_${roomCode}`).emit('round_started', {
      round: roundData.round,
      totalRounds: room.totalRounds,
      question: {
        id: roundData.question.id,
        prompt: roundData.question.prompt,
        direction: roundData.question.direction,
        category: roundData.question.category,
        audioUrl: roundData.question.audioUrl,
        options: roundData.question.options,
        languageCode: roundData.question.languageCode,
        questionType: roundData.question.questionType,
        phonetic: roundData.question.phonetic,
        targetWord: roundData.question.targetWord,
        hint: roundData.question.hint,
      },
      durationSec: room.roundDurationSec,
      roundAnswerCount: 0,
      totalParticipants: room.players.size,
    });

    const roundTimerKey = `round_${roomCode}`;
    const roundTimer = setTimeout(() => {
      this.endRound(roomCode);
    }, room.roundDurationSec * 1000);

    this.roomTimers.set(roundTimerKey, roundTimer);
  }

  private endRound(roomCode: string) {
    const room = this.gamesService.roomManager.getRoom(roomCode);
    if (!room) return;

    room.status = 'ROUND_SUMMARY';
    const ranking = this.gamesService.roomManager.getLeaderboard(roomCode);

    // Full correct answer text
    const correctDisplay =
      room.currentQuestion?.options &&
      typeof room.currentQuestion.correctOptionIndex === 'number'
        ? room.currentQuestion.options[room.currentQuestion.correctOptionIndex]
        : room.currentQuestion?.correctAnswer || '';

    this.server.to(`game_room_${roomCode}`).emit('round_ended', {
      round: room.currentRound,
      correctAnswer: correctDisplay,
      correctOptionIndex: room.currentQuestion?.correctOptionIndex,
      explanation: room.currentQuestion?.explanation || '',
      ranking,
      roundAnswerCount: room.roundAnswerCount,
      totalParticipants: room.players.size,
    });

    setTimeout(() => {
      if (room.currentRound >= room.totalRounds) {
        this.finishGame(roomCode);
      } else {
        this.startNextRound(roomCode);
      }
    }, 4000);
  }

  @SubscribeMessage('submit_answer')
  async handleSubmitAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      roomCode: string;
      userId: string;
      answer: string;
    },
  ) {
    const code = data.roomCode.toUpperCase();
    const result = await this.gamesService.roomManager.submitAnswer(
      code,
      data.userId,
      data.answer,
    );

    if (!result) {
      return { status: 'ignored' };
    }

    const { evaluation, player, ranking } = result;

    client.emit('answer_result', {
      evaluation,
      currentScore: player.score,
      currentStreak: player.streak,
      rank: player.rank,
    });

    const room = this.gamesService.roomManager.getRoom(code);

    this.server.to(`game_room_${code}`).emit('live_ranking_update', {
      ranking,
      roundAnswerCount: room?.roundAnswerCount || 0,
      totalParticipants: room?.players.size || 0,
      lastAnsweredBy: {
        displayName: player.displayName,
        scoreAdded: evaluation.score,
        isCorrect: evaluation.isCorrect,
        streak: player.streak,
      },
    });

    if (room && room.status === 'IN_ROUND' && !room.isLiveMode && room.players.size <= 4) {
      const allAnswered = Array.from(room.players.values()).every(
        (p) => p.lastAnsweredRound === room.currentRound,
      );
      if (allAnswered) {
        const roundTimerKey = `round_${code}`;
        if (this.roomTimers.has(roundTimerKey)) {
          clearTimeout(this.roomTimers.get(roundTimerKey)!);
          this.roomTimers.delete(roundTimerKey);
        }
        this.endRound(code);
      }
    }

    return { status: 'submitted' };
  }

  private async finishGame(roomCode: string) {
    const code = roomCode.toUpperCase();
    const room = this.gamesService.roomManager.getRoom(code);
    if (!room || room.status === 'FINISHED') return;

    room.status = 'FINISHED';
    const ranking = this.gamesService.roomManager.getLeaderboard(code);

    this.server.to(`game_room_${code}`).emit('game_finished', {
      roomCode: code,
      gameMode: room.gameMode,
      languageId: room.languageId,
      totalRounds: room.totalRounds,
      totalParticipants: room.players.size,
      ranking,
      top3: {
        first: ranking[0] || null,
        second: ranking[1] || null,
        third: ranking[2] || null,
      },
    });

    await this.gamesService.persistGameResults(code);
  }

  private broadcastRanking(roomCode: string) {
    const code = roomCode.toUpperCase();
    const room = this.gamesService.roomManager.getRoom(code);
    const ranking = this.gamesService.roomManager.getLeaderboard(code);
    this.server.to(`game_room_${code}`).emit('live_ranking_update', {
      ranking,
      roundAnswerCount: room?.roundAnswerCount || 0,
      totalParticipants: room?.players.size || 0,
    });
  }
}
