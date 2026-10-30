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
import { GameModeType } from '@prisma/client';

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

  constructor(private readonly gamesService: GamesService) {}

  afterInit(server: Server) {
    this.logger.log('Games WebSocket Gateway initialized for Realtime Battles');
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
    },
  ) {
    try {
      const mode = data.gameMode || GameModeType.TRANSLATION_RUSH;
      const { room, player } = await this.gamesService.joinOrCreateRoom(
        mode,
        data.userId,
        data.displayName,
        data.avatar,
        client.id,
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
          },
          durationSec: remainingSec,
        });
      }

      return { status: 'success', roomCode: room.roomCode };
    } catch (err: any) {
      this.logger.error(`Error joining game: ${err?.message}`);
      return { status: 'error', message: err?.message };
    }
  }

  /**
   * Player joins custom user-created room
   */
  @SubscribeMessage('join_custom_room')
  async handleJoinCustomRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      roomCode: string;
      userId: string;
      displayName: string;
      avatar: string;
    },
  ) {
    try {
      const code = data.roomCode.toUpperCase();
      let room = this.gamesService.roomManager.getRoom(code);
      if (!room) {
        // Fallback: load room from DB if not yet in memory
        const dbRoom = await this.gamesService.prisma.customGameRoom.findUnique({
          where: { roomCode: code },
        });
        if (!dbRoom) {
          return { status: 'error', message: 'Phòng thi đấu không tồn tại.' };
        }
        room = this.gamesService.roomManager.createRoom(
          dbRoom.roomCode,
          dbRoom.gameMode,
          dbRoom.title,
          [],
          dbRoom.roundDurationSec,
        );
      }

      const player = this.gamesService.roomManager.addPlayer(
        code,
        data.userId,
        data.displayName,
        data.avatar,
        client.id,
      );

      client.data.userId = data.userId;
      client.data.roomCode = code;
      client.join(`game_room_${code}`);

      // Notify player
      client.emit('room:joined_success', {
        roomCode: code,
        title: room.title,
        gameMode: room.gameMode,
        status: room.status,
        totalRounds: room.totalRounds,
        currentRound: room.currentRound,
        player,
        players: Array.from(room.players.values()),
      });

      // Broadcast to all participants in waiting room
      this.server.to(`game_room_${code}`).emit('room:player_joined', {
        player,
        totalPlayers: room.players.size,
        players: Array.from(room.players.values()),
      });

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
      },
      durationSec: room.roundDurationSec,
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

    this.server.to(`game_room_${roomCode}`).emit('round_ended', {
      round: room.currentRound,
      correctAnswer: room.currentQuestion?.correctAnswer || '',
      explanation: room.currentQuestion?.explanation || '',
      ranking,
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

    this.server.to(`game_room_${code}`).emit('live_ranking_update', {
      ranking,
      lastAnsweredBy: {
        displayName: player.displayName,
        scoreAdded: evaluation.score,
        isCorrect: evaluation.isCorrect,
        streak: player.streak,
      },
    });

    const room = this.gamesService.roomManager.getRoom(code);
    if (room && room.status === 'IN_ROUND') {
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
      totalRounds: room.totalRounds,
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
    const ranking = this.gamesService.roomManager.getLeaderboard(code);
    this.server.to(`game_room_${code}`).emit('live_ranking_update', { ranking });
  }
}
