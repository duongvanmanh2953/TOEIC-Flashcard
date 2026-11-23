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
import { JwtService } from '@nestjs/jwt';
import { Logger, OnModuleDestroy } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { normalizeLiveAnswer, type GameRoom } from './game-room.manager';
import { CustomRoomsService } from './custom-rooms.service';
import { GamesService } from './games.service';
import { QuestionProviderService } from './question-provider.service';
import { LiveIntegrationService } from './live-integration/live-integration.service';
import { LiveProviderType } from './live-integration/live-adapter.interface';
import { DeviceStatus, GameModeType } from '@prisma/client';
import { SYSTEM_PRESET_ROOMS, getSystemPresetRooms } from './custom-rooms.service';

interface JoinRoomRequest {
  roomCode: string;
  displayName: string;
  avatar: string;
  spectator?: boolean;
  password?: string;
  languageId?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class GamesGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GamesGateway.name);
  private scheduleTimer?: NodeJS.Timeout;
  private lastScheduledDay?: string;
  private roomTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly gamesService: GamesService,
    private readonly questionProvider: QuestionProviderService,
    private readonly liveIntegration: LiveIntegrationService,
    private readonly jwt: JwtService,
    private readonly customRooms: CustomRoomsService,
  ) {}

  afterInit(server: Server) {
    this.scheduleTimer = setInterval(() => {
      void this.startScheduledEvent().catch((error) => this.logger.error('Không thể khởi động đấu trường định kỳ', error));
    }, 1000);
    this.scheduleTimer.unref();
    this.logger.log('Games WebSocket Gateway initialized for Realtime Battles & Live Integration');

    // Subscribe to live comments from TikTok Live & Mock adapters
    this.liveIntegration.onLiveComment(async (event) => {
      const code = event.roomCode.toUpperCase();
      const room = this.gamesService.roomManager.getRoom(code);
      if (!room) return;

      if (!room.isLiveMode || room.liveProvider !== event.provider || room.status !== 'IN_ROUND' ||
          Date.now() >= room.roundStartedAt + room.roundDurationSec * 1000) return;
      const result = this.gamesService.roomManager.submitLiveComment(code, event);
      if (!result) return;

      const accepted = result.status === 'accepted';
      const commenterRanking = accepted ? this.gamesService.roomManager.getCommenterLeaderboard(code) : undefined;
      this.server.to(`game_room_${code}`).emit('live_comment_received', {
        eventId: event.eventId,
        username: event.username,
        displayName: event.displayName,
        avatarUrl: event.avatarUrl,
        commentText: event.commentText,
        timestamp: event.timestamp,
        round: room.currentRound,
        accepted,
        answer: accepted ? result.answer : undefined,
        scoreAdded: accepted ? result.score : undefined,
        liveOptionVotes: accepted ? room.liveOptionVotes : undefined,
        liveTop3: accepted ? room.questionCommentAwards?.get(room.currentRound) : undefined,
        commenterRanking,
        roundAnswerCount: room.roundAnswerCount,
        correctCommentersCount: room.correctCommentersCount ?? 0,
      });

    });
  }

  onModuleDestroy() {
    clearInterval(this.scheduleTimer);
    for (const timer of this.roomTimers.values()) clearTimeout(timer);
    this.roomTimers.clear();
  }

  private async startScheduledEvent() {
    if (!this.gamesService.getOperatingHoursStatus().serverTime.startsWith('19:00:')) return;
    const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short' }).format(new Date());
    if (this.lastScheduledDay === day) return;
    this.lastScheduledDay = day;
    const configs = await this.gamesService.getGameSchedule();
    const languages = ['en', 'zh', 'ja', 'ko', 'de', 'fr', 'es', 'th', 'vi'];
    await Promise.allSettled(configs.flatMap(({ gameMode }) => languages.map(async (languageId) => {
      try {
        const room = await this.gamesService.createScheduledRoom(gameMode, languageId);
        this.scheduleGameStart(room.roomCode, 3);
      } catch (error) {
        this.logger.error(`Không thể mở đấu trường ${gameMode}/${languageId}`, error);
      }
    })));
  }

  handleConnection(client: Socket) {
    // Client connected
  }

  private async authenticate(client: Socket): Promise<string | null> {
    const token = client.handshake.auth?.token;
    const secret = process.env.JWT_ACCESS_SECRET;
    if (typeof token !== 'string' || !secret) return null;
    try {
      const { sub } = await this.jwt.verifyAsync<{ sub: string }>(token, { secret, algorithms: ['HS256'] });
      if (typeof sub !== 'string' || !sub) return null;
      const user = await this.gamesService.prisma.user.findUnique({
        where: { id: sub },
        select: { status: true, refreshToken: true },
      });
      if (user?.status !== 'ACTIVE' || !user.refreshToken) return null;
      const deviceId = client.handshake.auth?.deviceId;
      if (typeof deviceId === 'string' && deviceId) {
        const device = await this.gamesService.prisma.userDevice.findUnique({
          where: { userId_deviceId: { userId: sub, deviceId } },
          select: { isAllowed: true, status: true },
        });
        if (device && (!device.isAllowed || device.status === DeviceStatus.BLOCKED)) return null;
      }
      return sub;
    } catch {
      return null;
    }
  }

  private isHost(client: Socket, code: string): boolean {
    const room = this.gamesService.roomManager.getRoom(code);
    const player = room?.players.get(client.data.userId);
    return client.data.roomCode === code && player?.socketId === client.id && player.isHost === true;
  }

  private hostDenied() {
    return { status: 'error', message: 'Chỉ chủ phòng có quyền thực hiện.' };
  }

  private clearTimer(key: string) {
    clearTimeout(this.roomTimers.get(key));
    this.roomTimers.delete(key);
  }

  private broadcastViewerCount(roomCode: string) {
    const count = this.server.sockets.adapter.rooms.get(`game_spectators_${roomCode}`)?.size ?? 0;
    this.server.to(`game_room_${roomCode}`).emit('room:viewer_count', { count });
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    const roomCode = client.data?.roomCode;
    if (roomCode && !userId) this.broadcastViewerCount(roomCode);
    if (roomCode && userId &&
        this.gamesService.roomManager.getRoom(roomCode)?.players.get(userId)?.socketId === client.id) {
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
    if (client.data.roomCode && client.data.userId) {
      this.gamesService.roomManager.updateLatency(client.data.roomCode, client.data.userId, roundTrip);
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
    const userId = await this.authenticate(client);
    if (!userId) return { status: 'error', message: 'Vui lòng đăng nhập lại để tham gia.' };
    if (!this.gamesService.getOperatingHoursStatus().isOpen) {
      return { status: 'error', message: 'Sự kiện mở lúc 19:00 (GMT+7).' };
    }
    try {
      const mode = data.gameMode || GameModeType.TRANSLATION_RUSH;
      const lang = data.languageId || 'en';
      const { room, player } = await this.gamesService.joinOrCreateRoom(
        mode,
        userId,
        data.displayName,
        data.avatar,
        client.id,
        lang,
      );

      client.data.userId = userId;
      client.data.roomCode = room.roomCode;
      client.join(`game_room_${room.roomCode}`);

      // Notify player
      client.emit('joined_game_room', {
        roomCode: room.roomCode,
        gameMode: room.gameMode,
        title: room.title,
        status: room.status,
        isLiveMode: room.isLiveMode,
        commenterRanking: this.gamesService.roomManager.getCommenterLeaderboard(room.roomCode),
        currentRound: room.currentRound,
        totalRounds: room.totalRounds,
        languageId: room.languageId,
        createdAt: room.createdAt,
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
      if (room.status === 'WAITING' && this.gamesService.getOperatingHoursStatus().testMode && !this.roomTimers.has(`start_${room.roomCode}`)) {
        this.scheduleGameStart(room.roomCode, 5);
      }

      if (room.status === 'FINISHED') client.emit('game_finished', this.getFinalResult(room));

      // If user rejoined an IN_ROUND game, send current question state immediately
      if ((room.status === 'IN_ROUND' || room.status === 'PAUSED') && room.currentQuestion) {
        const elapsedMs = Date.now() - room.roundStartedAt;
        const remainingSec = Math.max(0, Math.ceil((room.roundDurationSec * 1000 - elapsedMs) / 1000));
        client.emit('round_started', {
          round: room.currentRound,
          isLiveMode: room.isLiveMode,
          liveOptionVotes: room.liveOptionVotes ?? {},
          liveTop3: room.questionCommentAwards?.get(room.currentRound) ?? [],
          totalRounds: room.totalRounds,
          question: {
            id: room.currentQuestion.id,
            prompt: room.currentQuestion.prompt,
            direction: room.currentQuestion.direction,
            category: room.currentQuestion.category,
            difficulty: room.currentQuestion.difficulty,
            audioUrl: room.currentQuestion.audioUrl,
            options: room.currentQuestion.options,
            languageCode: room.currentQuestion.languageCode,
            questionType: room.currentQuestion.questionType,
            phonetic: room.currentQuestion.phonetic,
            targetWord: room.currentQuestion.targetWord,
            hint: room.currentQuestion.hint,
          },
          durationSec: room.roundDurationSec,
          remainingSec,
          serverTime: Date.now(),
          deadlineAt: room.roundStartedAt + room.roundDurationSec * 1000,
          alreadyAnswered: player?.lastAnsweredRound === room.currentRound,
          roundAnswerCount: room.roundAnswerCount,
          totalParticipants: room.players.size,
        });
      } else if (room.status === 'ROUND_SUMMARY' && room.currentQuestion) {
        const inAppRanking = this.gamesService.roomManager.getLeaderboard(room.roomCode).filter((player) => !player.isCommenter);
        const commenterRanking = this.gamesService.roomManager.getCommenterLeaderboard(room.roomCode);
        client.emit('round_started', {
          round: room.currentRound,
          isLiveMode: room.isLiveMode,
          liveOptionVotes: room.liveOptionVotes ?? {},
          liveTop3: room.questionCommentAwards?.get(room.currentRound) ?? [],
          totalRounds: room.totalRounds,
          question: room.currentQuestion,
          durationSec: room.roundDurationSec,
          remainingSec: 0,
        });
        client.emit('round_ended', {
          round: room.currentRound,
          ...this.getRoundReveal(room),
          ranking: inAppRanking,
          inAppRanking,
          commenterRanking,
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
  handleLegacyJoinCustomRoom(@ConnectedSocket() client: Socket, @MessageBody() data: JoinRoomRequest) {
    return this.handleJoinCustomRoom(client, data);
  }

  @SubscribeMessage('room:join_custom')
  async handleJoinCustomRoom(@ConnectedSocket() client: Socket, @MessageBody() data: JoinRoomRequest) {
    try {
      const code = data.roomCode.toUpperCase();
      let room = this.gamesService.roomManager.getRoom(code);
      const userId = await this.authenticate(client);
      if (!userId) return { status: 'error', message: 'Vui lòng đăng nhập lại để tham gia.' };
      const dbRoom = await this.gamesService.prisma.customGameRoom.findUnique({ where: { roomCode: code } });
      const isOwner = dbRoom?.hostUserId === userId;
      const spectator = data.spectator === true;
      if (dbRoom && ['COMPLETED', 'EXPIRED', 'CANCELLED'].includes(dbRoom.status) && !room) {
        return { status: 'error', message: 'Phòng đã đóng.' };
      }
      if (dbRoom?.passwordHash && !isOwner && !room?.players.has(userId) &&
          !(typeof data.password === 'string' && await this.customRooms.verifyPassword(code, data.password))) {
        return { status: 'error', message: 'Cần mật khẩu phòng.' };
      }

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
          // The first participating player hosts a preset room.
        } else {
          // 2. Fallback: load room from DB if not yet in memory
          if (!dbRoom) {
            return { status: 'error', message: 'Phòng thi đấu không tồn tại.' };
          }

          const effectiveDbLang = dbRoom.languageId || targetLang || 'en';
          const questions = await this.questionProvider.getQuestionsForRoom(
            dbRoom.sourceType,
            dbRoom.sourceId,
            dbRoom.questionCount || 10,
            dbRoom.gameMode,
            effectiveDbLang,
            dbRoom.hostUserId,
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

      if (room.status === 'FINISHED' && !room.players.has(userId) && !spectator) {
        return { status: 'error', message: 'Phòng đã đóng.' };
      }
      if (!spectator && !room.players.has(userId) && room.status !== 'WAITING' && !room.allowLateJoin) {
        return { status: 'error', message: 'Trận đã bắt đầu. Bạn có thể vào xem.' };
      }
      if (!spectator && dbRoom && !room.isLiveMode && !isOwner && !room.players.has(userId) &&
          Array.from(room.players.values()).filter((player) => !player.userId.startsWith('tt_')).length >= dbRoom.maxPlayers) {
        return { status: 'error', message: 'Phòng đã đầy.' };
      }
      if (!spectator && !room.scheduled && !room.hostUserId) room.hostUserId = dbRoom?.hostUserId ?? userId;
      if (client.data.roomCode && client.data.roomCode !== code) {
        await client.leave(`game_spectators_${client.data.roomCode}`);
        await client.leave(`game_room_${client.data.roomCode}`);
        this.handleDisconnect(client);
      }
      const player = spectator ? null : this.gamesService.roomManager.addPlayer(
        code,
        userId,
        data.displayName,
        data.avatar,
        client.id,
        room.hostUserId === userId,
      );

      client.data.userId = spectator ? undefined : userId;
      client.data.roomCode = code;
      await client.join(`game_room_${code}`);
      if (spectator) await client.join(`game_spectators_${code}`);
      else await client.leave(`game_spectators_${code}`);

      const liveStatus = this.liveIntegration.getLiveStatus(code);

      // Notify player
      client.emit('room:joined_success', {
        roomCode: code,
        title: room.title,
        gameMode: room.gameMode,
        status: room.status,
        isLiveMode: room.isLiveMode,
        commenterRanking: this.gamesService.roomManager.getCommenterLeaderboard(room.roomCode),
        totalRounds: room.totalRounds,
        currentRound: room.currentRound,
        languageId: room.languageId,
        liveStatus,
        player,
        players: Array.from(room.players.values()),
        roundAnswerCount: room.roundAnswerCount,
        liveOptionVotes: room.liveOptionVotes ?? {},
      });

      this.broadcastViewerCount(code);

      // Broadcast to all participants
      if (player) this.server.to(`game_room_${code}`).emit('room:player_joined', {
        player,
        totalPlayers: room.players.size,
        players: Array.from(room.players.values()),
      });

      if (room.status === 'FINISHED') client.emit('game_finished', this.getFinalResult(room));

      // If user rejoined an IN_ROUND game, send current question state immediately
      if ((room.status === 'IN_ROUND' || room.status === 'PAUSED') && room.currentQuestion) {
        const elapsedMs = Date.now() - room.roundStartedAt;
        const remainingSec = Math.max(0, Math.ceil((room.roundDurationSec * 1000 - elapsedMs) / 1000));
        client.emit('round_started', {
          round: room.currentRound,
          isLiveMode: room.isLiveMode,
          liveOptionVotes: room.liveOptionVotes ?? {},
          liveTop3: room.questionCommentAwards?.get(room.currentRound) ?? [],
          totalRounds: room.totalRounds,
          question: {
            id: room.currentQuestion.id,
            prompt: room.currentQuestion.prompt,
            direction: room.currentQuestion.direction,
            category: room.currentQuestion.category,
            difficulty: room.currentQuestion.difficulty,
            audioUrl: room.currentQuestion.audioUrl,
            options: room.currentQuestion.options,
            languageCode: room.currentQuestion.languageCode,
            questionType: room.currentQuestion.questionType,
            phonetic: room.currentQuestion.phonetic,
            targetWord: room.currentQuestion.targetWord,
            hint: room.currentQuestion.hint,
          },
          durationSec: room.roundDurationSec,
          remainingSec,
          serverTime: Date.now(),
          deadlineAt: room.roundStartedAt + room.roundDurationSec * 1000,
          alreadyAnswered: player?.lastAnsweredRound === room.currentRound,
          roundAnswerCount: room.roundAnswerCount,
          totalParticipants: room.players.size,
        });
      } else if (room.status === 'ROUND_SUMMARY' && room.currentQuestion) {
        const inAppRanking = this.gamesService.roomManager.getLeaderboard(room.roomCode).filter((player) => !player.isCommenter);
        const commenterRanking = this.gamesService.roomManager.getCommenterLeaderboard(room.roomCode);
        client.emit('round_started', {
          round: room.currentRound,
          isLiveMode: room.isLiveMode,
          liveOptionVotes: room.liveOptionVotes ?? {},
          liveTop3: room.questionCommentAwards?.get(room.currentRound) ?? [],
          totalRounds: room.totalRounds,
          question: room.currentQuestion,
          durationSec: room.roundDurationSec,
          remainingSec: 0,
        });
        client.emit('round_ended', {
          round: room.currentRound,
          ...this.getRoundReveal(room),
          ranking: inAppRanking,
          inAppRanking,
          commenterRanking,
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
    if (client.data.roomCode !== code || !client.data.userId) return { status: 'ignored' };
    this.server.to(`game_room_${code}`).emit('room:player_ready_changed', {
      userId: client.data.userId,
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
    if (!this.isHost(client, code)) return this.hostDenied();
    if (!this.scheduleGameStart(code, 5)) return { status: 'error', message: 'Phòng đang chạy hoặc chưa có câu hỏi.' };
    this.server.to(`game_room_${code}`).emit('room:starting_countdown', { countdownSec: 5 });
    return { status: 'starting' };
  }

  /**
   * Host pauses current round
   */
  @SubscribeMessage('room:host_pause_game')
  handleHostPauseGame(@ConnectedSocket() client: Socket, @MessageBody() data: { roomCode: string }) {
    const code = data.roomCode.toUpperCase();
    if (!this.isHost(client, code)) return this.hostDenied();
    if (this.gamesService.roomManager.getRoom(code)?.isLiveMode) return { status: 'ignored' };
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
  handleHostResumeGame(@ConnectedSocket() client: Socket, @MessageBody() data: { roomCode: string }) {
    const code = data.roomCode.toUpperCase();
    if (!this.isHost(client, code)) return this.hostDenied();
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
    @ConnectedSocket() client: Socket, @MessageBody() data: { roomCode: string; extraSec?: number },
  ) {
    const code = data.roomCode.toUpperCase();
    if (!this.isHost(client, code)) return this.hostDenied();
    if (this.gamesService.roomManager.getRoom(code)?.isLiveMode) return { status: 'ignored' };
    const extra = Number.isFinite(data.extraSec) ? Math.max(1, Math.min(15, Math.trunc(data.extraSec!))) : 5;
    const res = this.gamesService.roomManager.extendRoundTime(code, extra);
    if (res) {
      const room = this.gamesService.roomManager.getRoom(code);
      if (room?.status === 'IN_ROUND') {
        const key = `round_${code}`;
        this.clearTimer(key);
        const remainingMs = Math.max(0, room.roundStartedAt + room.roundDurationSec * 1000 - Date.now());
        this.roomTimers.set(key, setTimeout(() => this.endRound(code), remainingMs));
      }

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
  handleHostNextRound(@ConnectedSocket() client: Socket, @MessageBody() data: { roomCode: string }) {
    const code = data.roomCode.toUpperCase();
    if (!this.isHost(client, code)) return this.hostDenied();
    if (this.gamesService.roomManager.getRoom(code)?.isLiveMode) return { status: 'ignored' };
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
  handleHostEndGame(@ConnectedSocket() client: Socket, @MessageBody() data: { roomCode: string }) {
    const code = data.roomCode.toUpperCase();
    if (!this.isHost(client, code)) return this.hostDenied();
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
    if (!this.isHost(client, code)) return this.hostDenied();
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
  async handleDisconnectLive(@ConnectedSocket() client: Socket, @MessageBody() data: { roomCode: string }) {
    const code = data.roomCode.toUpperCase();
    if (!this.isHost(client, code)) return this.hostDenied();
    await this.liveIntegration.disconnectRoomLive(code);
    const room = this.gamesService.roomManager.getRoom(code);
    if (room) {
      room.liveProvider = undefined;
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
    @ConnectedSocket() client: Socket, @MessageBody()
    data: {
      roomCode: string;
      username?: string;
      displayName?: string;
      commentText: string;
    },
  ) {
    const code = data.roomCode.toUpperCase();
    if (!this.isHost(client, code)) return this.hostDenied();
    if (this.gamesService.roomManager.getRoom(code)?.liveProvider !== 'MOCK') return { status: 'ignored' };
    const event = this.liveIntegration.sendMockComment(data.roomCode, data);
    return { status: 'sent', event };
  }

  /**
   * Host triggers a burst of mock audience comments
   */
  @SubscribeMessage('room:simulate_batch_comments')
  handleSimulateBatchComments(@ConnectedSocket() client: Socket, @MessageBody() data: { roomCode: string; count?: number }) {
    const code = data.roomCode.toUpperCase();
    if (!this.isHost(client, code)) return this.hostDenied();
    if (this.gamesService.roomManager.getRoom(code)?.liveProvider !== 'MOCK') return { status: 'ignored' };
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
    if (!this.isHost(client, code) || data.targetUserId === client.data.userId) return this.hostDenied();
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
    const player = this.gamesService.roomManager.getRoom(code)?.players.get(client.data.userId);
    if (client.data.roomCode !== code || player?.socketId !== client.id || !player.isConnected) return;
    this.server.to(`game_room_${code}`).emit('room:chat_message', {
      id: Date.now().toString(),
      userId: player.userId,
      displayName: player.displayName,
      avatar: player.avatar,
      message: data.message.trim().slice(0, 500),
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
    const userId = await this.authenticate(client);
    if (!userId) return { status: 'error', message: 'Vui lòng đăng nhập lại để tham gia.' };
    try {
      const mode = data.gameMode || GameModeType.TRANSLATION_RUSH;
      const enqueued = await this.gamesService.enqueueMatchmaking(mode, {
        userId,
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
  private scheduleGameStart(roomCode: string, countdownSec: number) {
    let remaining = countdownSec;
    const room = this.gamesService.roomManager.getRoom(roomCode);
    if (!room || room.status !== 'WAITING' || !room.totalRounds) return false;

    room.status = 'STARTING';
    const timerKey = `start_${roomCode}`;

    if (this.roomTimers.has(timerKey)) {
      clearInterval(this.roomTimers.get(timerKey)!);
    }

    // Emit initial countdown immediately at t = 0 so players don't wait 1s before seeing countdown
    this.server.to(`game_room_${roomCode}`).emit('game_starting_countdown', {
      secondsRemaining: remaining,
    });
    remaining -= 1;

    const interval = setInterval(() => {
      if (remaining < 0) {
        clearInterval(interval);
        this.roomTimers.delete(timerKey);
        this.startNextRound(roomCode);
        return;
      }

      this.server.to(`game_room_${roomCode}`).emit('game_starting_countdown', {
        secondsRemaining: remaining,
      });

      remaining -= 1;
    }, 1000);

    this.roomTimers.set(timerKey, interval);
    return true;
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
      isLiveMode: room.isLiveMode,
      totalRounds: room.totalRounds,
      question: {
        id: roundData.question.id,
        prompt: roundData.question.prompt,
        direction: roundData.question.direction,
        category: roundData.question.category,
        difficulty: roundData.question.difficulty,
        audioUrl: roundData.question.audioUrl,
        options: roundData.question.options,
        languageCode: roundData.question.languageCode,
        questionType: roundData.question.questionType,
        phonetic: roundData.question.phonetic,
        targetWord: roundData.question.targetWord,
        hint: roundData.question.hint,
      },
      durationSec: room.roundDurationSec,
      serverTime: Date.now(),
      deadlineAt: room.roundStartedAt + room.roundDurationSec * 1000,
      roundAnswerCount: 0,
      totalParticipants: room.players.size,
    });

    const roundTimerKey = `round_${roomCode}`;
    const roundTimer = setTimeout(() => {
      this.endRound(roomCode);
    }, room.roundDurationSec * 1000);

    this.roomTimers.set(roundTimerKey, roundTimer);
  }

  private getRoundReveal(room: GameRoom) {
    const question = room.currentQuestion;
    const correctOptionIndex = question?.correctOptionIndex;
    const correctAnswer = (correctOptionIndex !== undefined ? question?.options?.[correctOptionIndex] : undefined)
      ?? question?.correctAnswer ?? '';
    const acceptedAnswers = room.isLiveMode && !question?.options?.length
      ? [correctAnswer, ...(question?.acceptedAnswers ?? [])].filter(Boolean).map(normalizeLiveAnswer)
      : undefined;
    return {
      correctAnswer,
      correctOptionIndex,
      acceptedAnswers,
      explanation: question?.explanation ?? '',
      serverTime: Date.now(),
      summaryEndsAt: room.summaryEndsAt,
      liveOptionVotes: room.liveOptionVotes ?? {},
      liveTop3: room.questionCommentAwards?.get(room.currentRound) ?? [],
    };
  }

  private endRound(roomCode: string) {
    const room = this.gamesService.roomManager.getRoom(roomCode);
    if (!room || (room.status !== 'IN_ROUND' && room.status !== 'PAUSED')) return;
    this.clearTimer(`round_${roomCode}`);

    room.status = 'ROUND_SUMMARY';
    const summaryDurationMs = room.isLiveMode ? 10000 : 5000;
    room.summaryEndsAt = Date.now() + summaryDurationMs;
    const ranking = this.gamesService.roomManager.getLeaderboard(roomCode);


    const reveal = this.getRoundReveal(room);
    this.server.to(`game_room_${roomCode}`).emit('round_ended', {
      round: room.currentRound,
      ...reveal,
      ranking,
      roundAnswerCount: room.roundAnswerCount,
      totalParticipants: room.players.size,
    });

    const summaryKey = `summary_${roomCode}`;
    const summaryTimer = setTimeout(() => {
      this.roomTimers.delete(summaryKey);
      if (room.status !== 'ROUND_SUMMARY') return;
      if (room.currentRound >= room.totalRounds) {
        this.finishGame(roomCode);
      } else {
        this.startNextRound(roomCode);
      }
    }, summaryDurationMs);
    this.roomTimers.set(summaryKey, summaryTimer);
  }

  @SubscribeMessage('submit_answer')
  async handleSubmitAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      roomCode: string;
      userId: string;
      answer: string;
      round: number;
      skip?: boolean;
    },
  ) {
    const code = data.roomCode.toUpperCase();
    const playerInRoom = this.gamesService.roomManager.getRoom(code)?.players.get(client.data.userId);
    if (client.data.roomCode !== code || playerInRoom?.socketId !== client.id || !playerInRoom.isConnected || !Number.isInteger(data.round) ||
        (data.skip !== true && (typeof data.answer !== 'string' || !data.answer.trim() || data.answer.length > 256))) {
      return { status: 'ignored' };
    }
    const result = await this.gamesService.roomManager.submitAnswer(
      code,
      client.data.userId,
      data.answer,
      data.round,
      data.skip === true,
    );

    if (!result) {
      return { status: 'ignored' };
    }

    const { evaluation, player, ranking } = result;

    client.emit('answer_result', {
      round: data.round,
      skipped: data.skip === true,
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

    if (room && room.status === 'IN_ROUND' && !room.isLiveMode) {
      const allAnswered = Array.from(room.players.values()).filter((p) => !p.isCommenter && p.isConnected && !p.isEliminated).every(
        (p) => p.lastAnsweredRound === room.currentRound && Boolean(p.lastAnswerEvaluation),
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
    room.finishedAt = Date.now();
    this.clearTimer(`start_${code}`);
    this.clearTimer(`round_${code}`);
    this.clearTimer(`summary_${code}`);
    this.server.to(`game_room_${code}`).emit('game_finished', this.getFinalResult(room));

    const writes = await Promise.allSettled([
      this.gamesService.prisma.customGameRoom.updateMany({
        where: { roomCode: code, hostUserId: room.hostUserId ?? '' },
        data: { status: 'COMPLETED', finishedAt: new Date(room.finishedAt) },
      }),
      this.gamesService.persistGameResults(code),
    ]);
    for (const write of writes) {
      if (write.status === 'rejected') this.logger.error(`Could not persist result for room ${code}`, write.reason);
    }
  }

  private getFinalResult(room: GameRoom) {
    const code = room.roomCode;
    const everyone = this.gamesService.roomManager.getLeaderboard(code);
    const ranking = everyone.filter((entry) => !entry.userId.startsWith('tt_'));
    const commenterRanking = everyone.filter((entry) => entry.userId.startsWith('tt_'));

    return {
      roomCode: code,
      gameMode: room.gameMode,
      languageId: room.languageId,
      totalRounds: room.totalRounds,
      playedRounds: room.currentRound,
      totalParticipants: room.players.size,
      ranking,
      inAppRanking: ranking,
      commenterRanking,
      top3: {
        first: ranking[0] || null,
        second: ranking[1] || null,
        third: ranking[2] || null,
      },
    };

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
