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
   * Player joins or creates a game room
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
    this.scheduleGameStart(data.roomCode, 3);
  }

  private scheduleGameStart(roomCode: string, countdownSec: number) {
    let remaining = countdownSec;
    const room = this.gamesService.roomManager.getRoom(roomCode);
    if (!room) return;

    room.status = 'STARTING';
    const timerKey = `start_${roomCode}`;

    const interval = setInterval(() => {
      this.server.to(`game_room_${roomCode}`).emit('game_countdown', {
        countdown: remaining,
      });

      if (remaining <= 0) {
        clearInterval(interval);
        this.roomTimers.delete(timerKey);
        this.startNextRound(roomCode);
      }
      remaining -= 1;
    }, 1000);

    this.roomTimers.set(timerKey, interval);
  }

  private startNextRound(roomCode: string) {
    const room = this.gamesService.roomManager.getRoom(roomCode);
    if (!room) return;

    const roundData = this.gamesService.roomManager.startRound(roomCode);

    if (!roundData) {
      // All rounds completed -> FINISH GAME
      this.finishGame(roomCode);
      return;
    }

    const { question, round } = roundData;

    // Broadcast question to all players without revealing the answer!
    this.server.to(`game_room_${roomCode}`).emit('round_started', {
      round,
      totalRounds: room.totalRounds,
      question: {
        id: question.id,
        prompt: question.prompt,
        direction: question.direction,
        category: question.category,
        audioUrl: question.audioUrl,
      },
      durationSec: room.roundDurationSec,
    });

    // Schedule round end timeout
    const roundTimerKey = `round_${roomCode}`;
    if (this.roomTimers.has(roundTimerKey)) {
      clearTimeout(this.roomTimers.get(roundTimerKey)!);
    }

    const timer = setTimeout(() => {
      this.endRound(roomCode);
    }, room.roundDurationSec * 1000 + 500);

    this.roomTimers.set(roundTimerKey, timer);
  }

  private endRound(roomCode: string) {
    const room = this.gamesService.roomManager.getRoom(roomCode);
    if (!room || room.status !== 'IN_ROUND') return;

    room.status = 'ROUND_SUMMARY';
    const answer = room.currentQuestion?.correctAnswer;
    const explanation = room.currentQuestion?.explanation;

    this.server.to(`game_room_${roomCode}`).emit('round_ended', {
      round: room.currentRound,
      correctAnswer: answer,
      explanation,
      ranking: this.gamesService.roomManager.getLeaderboard(roomCode),
    });

    // Short 3-second break between rounds, then start next round
    setTimeout(() => {
      this.startNextRound(roomCode);
    }, 3000);
  }

  /**
   * Player submits an answer
   */
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
    const result = await this.gamesService.roomManager.submitAnswer(
      data.roomCode,
      data.userId,
      data.answer,
    );

    if (!result) {
      return { status: 'ignored' };
    }

    const { evaluation, player, ranking } = result;

    // Send instant individual evaluation feedback to user
    client.emit('answer_result', {
      evaluation,
      currentScore: player.score,
      currentStreak: player.streak,
      rank: player.rank,
    });

    // Broadcast live ranking update with rank change micro-animation event
    this.server.to(`game_room_${data.roomCode}`).emit('live_ranking_update', {
      ranking,
      lastAnsweredBy: {
        displayName: player.displayName,
        scoreAdded: evaluation.score,
        isCorrect: evaluation.isCorrect,
        streak: player.streak,
      },
    });

    // If all active players in room have answered, end round early
    const room = this.gamesService.roomManager.getRoom(data.roomCode);
    if (room && room.status === 'IN_ROUND') {
      const allAnswered = Array.from(room.players.values()).every(
        (p) => p.lastAnsweredRound === room.currentRound,
      );
      if (allAnswered) {
        const roundTimerKey = `round_${data.roomCode}`;
        if (this.roomTimers.has(roundTimerKey)) {
          clearTimeout(this.roomTimers.get(roundTimerKey)!);
          this.roomTimers.delete(roundTimerKey);
        }
        this.endRound(data.roomCode);
      }
    }

    return { status: 'submitted' };
  }

  private async finishGame(roomCode: string) {
    const room = this.gamesService.roomManager.getRoom(roomCode);
    if (!room || room.status === 'FINISHED') return;

    room.status = 'FINISHED';
    const ranking = this.gamesService.roomManager.getLeaderboard(roomCode);

    // Broadcast Game Over celebration and podium
    this.server.to(`game_room_${roomCode}`).emit('game_finished', {
      roomCode,
      gameMode: room.gameMode,
      totalRounds: room.totalRounds,
      ranking,
      top3: {
        first: ranking[0] || null,
        second: ranking[1] || null,
        third: ranking[2] || null,
      },
    });

    // Persist final Top records to database (PostgreSQL)
    await this.gamesService.persistGameResults(roomCode);
  }

  private broadcastRanking(roomCode: string) {
    const ranking = this.gamesService.roomManager.getLeaderboard(roomCode);
    this.server.to(`game_room_${roomCode}`).emit('live_ranking_update', { ranking });
  }
}
