import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QuestionProviderService } from './question-provider.service';
import { GamesService } from './games.service';
import { CreateCustomRoomDto } from './dto/custom-room.dto';
import { CustomRoomStatus, RoomVisibility } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class CustomRoomsService {
  private readonly logger = new Logger(CustomRoomsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly questionProvider: QuestionProviderService,
    private readonly gamesService: GamesService,
  ) {}

  /**
   * Generate an unambiguous 6-character room code (e.g. VF8291)
   */
  private generateRoomCode(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // exclude 0, 1, I, O to prevent confusion
    let code = 'VF';
    for (let i = 0; i < 4; i++) {
      code += chars[crypto.randomInt(0, chars.length)];
    }
    return code;
  }

  /**
   * User creates their own game room
   */
  async createRoom(hostUserId: string, dto: CreateCustomRoomDto) {
    let roomCode = this.generateRoomCode();
    let retries = 0;
    while (retries < 5) {
      const existing = await this.prisma.customGameRoom.findUnique({ where: { roomCode } });
      if (!existing) break;
      roomCode = this.generateRoomCode();
      retries++;
    }

    let passwordHash: string | null = null;
    if (dto.password && dto.password.trim().length > 0) {
      passwordHash = await bcrypt.hash(dto.password.trim(), 10);
    }

    // 1. Fetch questions via Question Provider Adapter
    const questions = await this.questionProvider.getQuestionsForRoom(
      dto.sourceType || 'SYSTEM_PRESET',
      dto.sourceId,
      dto.questionCount || 10,
      dto.gameMode,
      dto.languageId || 'en',
    );

    // 2. Persist room in PostgreSQL
    const room = await this.prisma.customGameRoom.create({
      data: {
        roomCode,
        hostUserId,
        title: dto.title,
        description: dto.description,
        languageId: dto.languageId || 'en',
        gameMode: dto.gameMode || 'TRANSLATION_RUSH',
        visibility: dto.visibility || RoomVisibility.PUBLIC,
        passwordHash,
        status: CustomRoomStatus.WAITING,
        sourceType: dto.sourceType || 'SYSTEM_PRESET',
        sourceId: dto.sourceId,
        difficulty: dto.difficulty || 'INTERMEDIATE',
        questionCount: questions.length,
        maxPlayers: dto.maxPlayers || 8,
        roundDurationSec: dto.roundDurationSec || 15,
        allowLateJoin: dto.allowLateJoin || false,
        penaltyForWrong: dto.penaltyForWrong || false,
        shuffleQuestions: dto.shuffleQuestions !== false,
        shuffleOptions: dto.shuffleOptions !== false,
        showAnswerAfterEach: dto.showAnswerAfterEach !== false,
        participants: {
          create: {
            userId: hostUserId,
            isHost: true,
            isReady: true,
          },
        },
      },
      include: {
        host: {
          select: { id: true, displayName: true, avatar: true },
        },
        participants: {
          include: {
            user: { select: { id: true, displayName: true, avatar: true } },
          },
        },
      },
    });

    // 3. Register in in-memory GameRoomManager for Socket.IO low latency loop
    this.gamesService.roomManager.createRoom(
      roomCode,
      room.gameMode,
      room.title,
      questions,
      room.roundDurationSec,
    );

    this.logger.log(`Custom Game Room created: #${roomCode} by User ${hostUserId} (${room.title})`);

    const { passwordHash: _, ...safeRoom } = room;
    return {
      ...safeRoom,
      hasPassword: !!passwordHash,
    };
  }

  /**
   * List open Public rooms for the Lobby browser
   */
  async getPublicRooms(query?: { languageId?: string; gameMode?: string }) {
    const where: any = {
      visibility: RoomVisibility.PUBLIC,
      status: CustomRoomStatus.WAITING,
    };

    if (query?.languageId) where.languageId = query.languageId;
    if (query?.gameMode) where.gameMode = query.gameMode;

    const rooms = await this.prisma.customGameRoom.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        host: {
          select: { id: true, displayName: true, avatar: true },
        },
        participants: {
          select: { id: true, userId: true, isReady: true, isHost: true },
        },
      },
    });

    return rooms.map((r) => {
      const { passwordHash, ...rest } = r;
      return {
        ...rest,
        hasPassword: !!passwordHash,
        playerCount: r.participants.length,
      };
    });
  }

  /**
   * Get single room details
   */
  async getRoomByCode(roomCode: string) {
    const room = await this.prisma.customGameRoom.findUnique({
      where: { roomCode: roomCode.toUpperCase() },
      include: {
        host: {
          select: { id: true, displayName: true, avatar: true },
        },
        participants: {
          include: {
            user: { select: { id: true, displayName: true, avatar: true } },
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException(`Phòng #${roomCode} không tồn tại hoặc đã bị hủy.`);
    }

    const { passwordHash, ...safeRoom } = room;
    return {
      ...safeRoom,
      hasPassword: !!passwordHash,
    };
  }

  /**
   * Verify password for password-protected rooms
   */
  async verifyPassword(roomCode: string, passwordAttempt: string): Promise<boolean> {
    const room = await this.prisma.customGameRoom.findUnique({
      where: { roomCode: roomCode.toUpperCase() },
    });

    if (!room) {
      throw new NotFoundException(`Phòng #${roomCode} không tồn tại.`);
    }

    if (!room.passwordHash) {
      return true; // No password required
    }

    return await bcrypt.compare(passwordAttempt, room.passwordHash);
  }

  /**
   * Host kicks a player from Waiting Room
   */
  async kickPlayer(hostUserId: string, roomCode: string, targetUserId: string) {
    const room = await this.prisma.customGameRoom.findUnique({
      where: { roomCode: roomCode.toUpperCase() },
    });

    if (!room) throw new NotFoundException('Phòng không tồn tại.');
    if (room.hostUserId !== hostUserId) {
      throw new ForbiddenException('Chỉ chủ phòng mới có quyền kick người chơi.');
    }
    if (hostUserId === targetUserId) {
      throw new BadRequestException('Chủ phòng không thể tự kick chính mình.');
    }

    // Remove from DB
    await this.prisma.customRoomParticipant.deleteMany({
      where: {
        roomId: room.id,
        userId: targetUserId,
      },
    });

    // Remove from in-memory room
    this.gamesService.roomManager.removePlayer(room.roomCode, targetUserId);

    return { success: true, message: 'Đã kick người chơi khỏi phòng.' };
  }

  /**
   * Send invite to friend
   */
  async inviteFriend(inviterUserId: string, roomCode: string, inviteeUserId: string) {
    const room = await this.prisma.customGameRoom.findUnique({
      where: { roomCode: roomCode.toUpperCase() },
    });

    if (!room) throw new NotFoundException('Phòng không tồn tại.');

    const invite = await this.prisma.customRoomInvitation.create({
      data: {
        roomId: room.id,
        inviterUserId,
        inviteeUserId,
      },
      include: {
        inviter: { select: { displayName: true, avatar: true } },
        room: { select: { roomCode: true, title: true, gameMode: true } },
      },
    });

    return invite;
  }
}

