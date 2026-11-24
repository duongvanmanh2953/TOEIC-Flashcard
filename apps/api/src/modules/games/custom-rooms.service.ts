import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QuestionProviderService } from './question-provider.service';
import { GamesService } from './games.service';
import { CreateCustomRoomDto, UpdateCustomRoomDto } from './dto/custom-room.dto';
import { Prisma, CustomRoomStatus, RoomVisibility, GameModeType, QuestionSourceType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { LiveIntegrationService } from './live-integration/live-integration.service';
import { LiveProviderType } from './live-integration/live-adapter.interface';

export function getSystemPresetRooms(languageId: string = 'en') {
  const lang = (languageId || 'en').toLowerCase().trim();

  const langMetadata: Record<string, { flag: string; name: string; focus: string; coach: string }> = {
    zh: { flag: '🇨🇳', name: 'Tiếng Trung HSK', focus: 'Hán Tự & Pinyin', coach: 'HSK Master Coach' },
    ja: { flag: '🇯🇵', name: 'Tiếng Nhật JLPT', focus: 'Kanji & Hiragana', coach: 'JLPT Sensei Coach' },
    ko: { flag: '🇰🇷', name: 'Tiếng Hàn TOPIK', focus: 'Hangul & Giao tiếp Seoul', coach: 'Seoul Vocab Coach' },
    en: { flag: '🇬🇧', name: 'Tiếng Anh TOEIC', focus: 'TOEIC 750+ & Oxford Core', coach: 'VocabFlow AI Coach' },
    de: { flag: '🇩🇪', name: 'Tiếng Đức Goethe', focus: 'A1-B2 & Quán từ der/die/das', coach: 'Goethe Vocab Coach' },
    fr: { flag: '🇫🇷', name: 'Tiếng Pháp DELF', focus: 'DELF A1-B2 & Đàm thoại', coach: 'Parisian Master Coach' },
    es: { flag: '🇪🇸', name: 'Tiếng Tây Ban Nha', focus: 'DELE A1-B2 & Từ vựng cốt lõi', coach: 'Madrid Vocab Coach' },
    th: { flag: '🇹🇭', name: 'Tiếng Thái Lan', focus: 'Chữ Thái & Đàm thoại Bangkok', coach: 'Bangkok Vocab Coach' },
    vi: { flag: '🇻🇳', name: 'Tiếng Việt Chuyên Sâu', focus: 'Hán Việt & Thành ngữ giao tiếp', coach: 'VocabFlow Tiếng Việt' },
  };

  const meta = langMetadata[lang] || langMetadata['en'];

  const liveRooms = [
    { key: 'REFLEX', title: 'Phản xạ từ vựng', gameMode: GameModeType.CLASSIC_QUIZ, count: 10 },
    { key: 'LISTEN', title: 'Nghe và chọn', gameMode: GameModeType.LISTENING_RUSH, count: 8 },
    { key: 'BLITZ', title: 'Dịch nhanh', gameMode: GameModeType.TRANSLATION_RUSH, count: 12 },
  ];
  return [
    {
      roomCode: `${lang.toUpperCase()}-CLASSIC`,
      title: `${meta.flag} ${meta.name} — Đại Chiến Trắc Nghiệm Phản Xạ`,
      description: `Đấu trường trắc nghiệm tiêu chuẩn 4 lựa chọn. Tranh tài tốc độ phản xạ ${meta.focus} với bảng xếp hạng realtime.`,
      languageId: lang,
      gameMode: GameModeType.CLASSIC_QUIZ,
      sourceType: QuestionSourceType.SYSTEM_PRESET,
      difficulty: 'INTERMEDIATE',
      questionCount: 10,
      maxPlayers: 1000,
      roundDurationSec: 15,
      allowLateJoin: true,
      isLiveMode: false,
      playerCount: 0,
      status: CustomRoomStatus.WAITING,
      visibility: RoomVisibility.PUBLIC,
      hasPassword: false,
      host: {
        id: `coach_${lang}`,
        displayName: meta.coach,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=vocabflow_${lang}`,
      },
      participants: [],
    },
    {
      roomCode: `${lang.toUpperCase()}-SURVIVAL`,
      title: `${meta.flag} ${meta.name} — Đấu Trường Sinh Tồn 3 Mạng`,
      description: `Mỗi đấu thủ có 3 mạng tim. Trả lời sai mất 1 mạng, hết tim chuyển sang Chế độ Khán giả theo dõi!`,
      languageId: lang,
      gameMode: GameModeType.SURVIVAL,
      sourceType: QuestionSourceType.SYSTEM_PRESET,
      difficulty: 'ADVANCED',
      questionCount: 15,
      maxPlayers: 500,
      roundDurationSec: 12,
      allowLateJoin: true,
      isLiveMode: false,
      playerCount: 0,
      status: CustomRoomStatus.WAITING,
      visibility: RoomVisibility.PUBLIC,
      hasPassword: false,
      host: {
        id: `coach_${lang}_survival`,
        displayName: `${meta.name} Arena Master`,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=survival_${lang}`,
      },
      participants: [],
    },
    {
      roomCode: `${lang.toUpperCase()}-DUEL`,
      title: `${meta.flag} ${meta.name} — Song Đấu 1vs1 Đối Kháng`,
      description: `Ghép cặp đấu đối kháng trực diện. So tài kiến thức ${meta.focus} từng câu với cơ chế tie-breaker công bằng.`,
      languageId: lang,
      gameMode: GameModeType.DUEL,
      sourceType: QuestionSourceType.SYSTEM_PRESET,
      difficulty: 'INTERMEDIATE',
      questionCount: 8,
      maxPlayers: 2,
      roundDurationSec: 12,
      allowLateJoin: false,
      isLiveMode: false,
      playerCount: 0,
      status: CustomRoomStatus.WAITING,
      visibility: RoomVisibility.PUBLIC,
      hasPassword: false,
      host: {
        id: `coach_${lang}_duel`,
        displayName: `${meta.name} Duel Arbiter`,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=duel_${lang}`,
      },
      participants: [],
    },
    {
      roomCode: `${lang.toUpperCase()}-TEAM`,
      title: `${meta.flag} ${meta.name} — Bang Hội Đại Chiến (Red vs Blue)`,
      description: `Chia 2 phe Đỏ / Xanh. Điểm số được chuẩn hóa công bằng theo tỷ lệ người chơi hợp lệ.`,
      languageId: lang,
      gameMode: GameModeType.TEAM_BATTLE,
      sourceType: QuestionSourceType.SYSTEM_PRESET,
      difficulty: 'INTERMEDIATE',
      questionCount: 12,
      maxPlayers: 50,
      roundDurationSec: 15,
      allowLateJoin: true,
      isLiveMode: false,
      playerCount: 0,
      status: CustomRoomStatus.WAITING,
      visibility: RoomVisibility.PUBLIC,
      hasPassword: false,
      host: {
        id: `coach_${lang}_team`,
        displayName: `${meta.name} Commander`,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=team_${lang}`,
      },
      participants: [],
    },
    {
      roomCode: `${lang.toUpperCase()}-RUSH`,
      title: `${meta.flag} ${meta.name} — Word Rush Giải Mã Ký Tự`,
      description: `Sắp xếp ký tự xáo trộn, gõ từ vựng nhanh và xử lý chuẩn hóa ký tự đa ngữ.`,
      languageId: lang,
      gameMode: GameModeType.WORD_RUSH,
      sourceType: QuestionSourceType.SYSTEM_PRESET,
      difficulty: 'INTERMEDIATE',
      questionCount: 10,
      maxPlayers: 100,
      roundDurationSec: 20,
      allowLateJoin: true,
      isLiveMode: false,
      playerCount: 0,
      status: CustomRoomStatus.WAITING,
      visibility: RoomVisibility.PUBLIC,
      hasPassword: false,
      host: {
        id: `coach_${lang}_rush`,
        displayName: `${meta.name} Rush Host`,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=rush_${lang}`,
      },
      participants: [],
    },
    {
      roomCode: `${lang.toUpperCase()}-BOSS`,
      title: `${meta.flag} ${meta.name} — Vòng Đấu Trùm (Boss Round x2 Điểm)`,
      description: `Các câu hỏi nâng cao, điểm thưởng x2. Kèm giải thích kiến thức ngữ cảnh chuyên sâu sau vòng.`,
      languageId: lang,
      gameMode: GameModeType.BOSS_ROUND,
      sourceType: QuestionSourceType.SYSTEM_PRESET,
      difficulty: 'EXPERT',
      questionCount: 5,
      maxPlayers: 1000,
      roundDurationSec: 25,
      allowLateJoin: true,
      isLiveMode: false,
      playerCount: 0,
      status: CustomRoomStatus.WAITING,
      visibility: RoomVisibility.PUBLIC,
      hasPassword: false,
      host: {
        id: `coach_${lang}_boss`,
        displayName: `${meta.name} Grandmaster`,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=boss_${lang}`,
      },
      participants: [],
    },
    {
      roomCode: `${lang.toUpperCase()}-FINAL`,
      title: `${meta.flag} ${meta.name} — Chung Kết Quyết Đấu (Final Showdown x3 Điểm)`,
      description: `3 câu hỏi đỉnh cao định đoạt Quán Quân toàn trận với trọng số x3 điểm!`,
      languageId: lang,
      gameMode: GameModeType.FINAL_SHOWDOWN,
      sourceType: QuestionSourceType.SYSTEM_PRESET,
      difficulty: 'EXPERT',
      questionCount: 3,
      maxPlayers: 1000,
      roundDurationSec: 20,
      allowLateJoin: true,
      isLiveMode: false,
      playerCount: 0,
      status: CustomRoomStatus.WAITING,
      visibility: RoomVisibility.PUBLIC,
      hasPassword: false,
      host: {
        id: `coach_${lang}_final`,
        displayName: `${meta.name} Arena Host`,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=final_${lang}`,
      },
      participants: [],
    },
    ...liveRooms.map(({ key, title, gameMode, count }) => ({
      roomCode: `${lang.toUpperCase()}-LIVE-${key}`,
      title: `${title} · ${meta.name}`,
      description: `${count} câu · ${meta.focus} · Trả lời qua bình luận Live.`,
      languageId: lang,
      gameMode,
      sourceType: QuestionSourceType.SYSTEM_PRESET,
      difficulty: 'INTERMEDIATE',
      questionCount: count,
      maxPlayers: 10000,
      roundDurationSec: 20,
      allowLateJoin: true,
      isLiveMode: true,
      playerCount: 0,
      status: CustomRoomStatus.WAITING,
      visibility: RoomVisibility.PUBLIC,
      hasPassword: false,
      host: null,
      participants: [],
    })),

  ];
}

export const SYSTEM_PRESET_ROOMS = getSystemPresetRooms('en');

@Injectable()
export class CustomRoomsService {
  private readonly logger = new Logger(CustomRoomsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly questionProvider: QuestionProviderService,
    private readonly gamesService: GamesService,
    private readonly liveIntegration: LiveIntegrationService,
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
  private async createWithUniqueCode<T>(create: (code: string) => Promise<T>): Promise<T> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = this.generateRoomCode();
      if (this.gamesService.roomManager.getRoom(code)) continue;
      try {
        return await create(code);
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error;
      }
    }
    throw new BadRequestException('Chưa thể tạo mã phòng. Vui lòng thử lại.');
  }

  async createRoom(hostUserId: string, dto: CreateCustomRoomDto) {
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
      hostUserId,
    );

    const requestedCount = dto.questionCount || 10;
    if (questions.length < requestedCount) {
      throw new BadRequestException(`Bộ câu hỏi chỉ có ${questions.length} câu. Hãy giảm số câu hoặc chọn bộ khác.`);
    }
    // The database unique index arbitrates concurrent room creation.
    const create = async (roomCode: string) => {
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
          maxPlayers: dto.maxPlayers || (dto.isLiveMode ? 10000 : 8),
          roundDurationSec: Math.min(15, Math.max(5, dto.roundDurationSec || 15)),
          allowLateJoin: dto.isLiveMode ? true : dto.allowLateJoin || false,
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
      return room;
    };

    const room = await this.createWithUniqueCode(create);
    const { roomCode } = room;

    // 3. Register in in-memory GameRoomManager for Socket.IO low latency loop
    this.gamesService.roomManager.createRoom(
      roomCode,
      room.gameMode,
      room.title,
      questions,
      room.roundDurationSec,
      room.languageId,
      dto.isLiveMode || false,
      dto.isLiveMode ? true : room.allowLateJoin,
    );

    this.logger.log(`Custom Game Room created: #${roomCode} by User ${hostUserId} (${room.title})`);

    const { passwordHash: _, ...safeRoom } = room;
    return {
      ...safeRoom,
      isLiveMode: this.gamesService.roomManager.getRoom(room.roomCode)?.isLiveMode
        ?? (room.maxPlayers > 50 && room.allowLateJoin),
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

    const activeLang = query?.languageId || 'en';
    const presetsForLang = getSystemPresetRooms(activeLang);

    const matchingPresets = presetsForLang
      .filter((preset) => !query?.gameMode || preset.gameMode === query.gameMode)
      .map((preset) => {
        const room = this.gamesService.roomManager.getRoom(preset.roomCode);
        const host = room?.hostUserId ? room.players.get(room.hostUserId) : undefined;
        return {
          ...preset,
          status: room?.status === 'FINISHED' ? CustomRoomStatus.COMPLETED
            : room?.status === 'STARTING' ? CustomRoomStatus.STARTING
            : room?.status === 'ROUND_SUMMARY' ? CustomRoomStatus.ROUND_SUMMARY
            : room && room.status !== 'WAITING' ? CustomRoomStatus.IN_PROGRESS : preset.status,
          host: host ? { id: host.userId, displayName: host.displayName, avatar: host.avatar } : null,
          playerCount: room ? Array.from(room.players.values()).filter((player) =>
            player.isConnected && !player.userId.startsWith('tt_')).length : 0,
        };
      });

    const userRooms = rooms.map((r) => {
      const { passwordHash, ...rest } = r;
      return {
        ...rest,
        isLiveMode: this.gamesService.roomManager.getRoom(r.roomCode)?.isLiveMode
          ?? (r.maxPlayers > 50 && r.allowLateJoin),
        hasPassword: !!passwordHash,
        playerCount: Array.from(this.gamesService.roomManager.getRoom(r.roomCode)?.players.values() ?? [])
          .filter((player) => player.isConnected && !player.userId.startsWith('tt_')).length,
      };
    });

    return [...matchingPresets, ...userRooms];
  }

  /**
   * Get single room details
   */
  async getRoomByCode(roomCode: string) {
    const code = roomCode.toUpperCase();
    
    // Check dynamic presets across all languages
    for (const lang of ['zh', 'ja', 'ko', 'en', 'de', 'fr', 'es', 'th', 'vi']) {
      const preset = getSystemPresetRooms(lang).find((p) => p.roomCode === code);
      if (preset) return preset;
    }

    const room = await this.prisma.customGameRoom.findUnique({
      where: { roomCode: code },
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
      isLiveMode: this.gamesService.roomManager.getRoom(room.roomCode)?.isLiveMode
        ?? (room.maxPlayers > 50 && room.allowLateJoin),
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

  getLiveStatus(roomCode: string) {
    return this.liveIntegration.getLiveStatus(roomCode);
  }

  async assertLiveHost(roomCode: string, userId: string) {
    const current = this.gamesService.roomManager.getRoom(roomCode);
    const owner = current?.hostUserId ?? (await this.prisma.customGameRoom.findUnique({
      where: { roomCode: roomCode.toUpperCase() },
      select: { hostUserId: true },
    }))?.hostUserId;
    if (!userId || owner !== userId) throw new ForbiddenException('Chỉ chủ phòng quản lý được kết nối trực tiếp.');
  }

  async connectLive(roomCode: string, provider: LiveProviderType, channelName: string) {
    const res = await this.liveIntegration.connectRoomLive(roomCode, provider, channelName);
    const room = this.gamesService.roomManager.getRoom(roomCode);
    if (room && res.success) {
      room.isLiveMode = true;
      room.liveProvider = res.provider;
    }
    return res;
  }

  async disconnectLive(roomCode: string) {
    await this.liveIntegration.disconnectRoomLive(roomCode);
    const room = this.gamesService.roomManager.getRoom(roomCode);
    if (room) {
      room.liveProvider = undefined;
    }
  }

  sendMockComment(roomCode: string, body: any) {
    return this.liveIntegration.sendMockComment(roomCode, body);
  }

  simulateBatch(roomCode: string, count?: number) {
    return this.liveIntegration.simulateAudienceBatch(roomCode, count);
  }

  ingestLiveComment(roomCode: string, payload: any) {
    return this.liveIntegration.ingestExternalComment(roomCode, payload);
  }

  /**
   * Host edits room settings (only allowed while in WAITING status)
   */
  async updateRoom(hostUserId: string, roomCode: string, dto: UpdateCustomRoomDto) {
    const code = roomCode.toUpperCase();
    const room = await this.prisma.customGameRoom.findUnique({
      where: { roomCode: code },
    });

    if (!room) throw new NotFoundException('Phòng không tồn tại.');
    if (room.hostUserId !== hostUserId) {
      throw new ForbiddenException('Chỉ chủ phòng mới có quyền chỉnh sửa thông tin phòng.');
    }
    if (room.status !== CustomRoomStatus.WAITING) {
      throw new BadRequestException('Chỉ có thể chỉnh sửa phòng khi đang ở trạng thái chờ.');
    }

    let passwordHash = room.passwordHash;
    if (dto.password !== undefined) {
      if (dto.password && dto.password.trim().length > 0) {
        passwordHash = await bcrypt.hash(dto.password.trim(), 10);
      } else {
        passwordHash = null;
      }
    }

    const updated = await this.prisma.customGameRoom.update({
      where: { id: room.id },
      data: {
        title: dto.title !== undefined ? dto.title.trim() : room.title,
        description: dto.description !== undefined ? dto.description?.trim() : room.description,
        gameMode: dto.gameMode ?? room.gameMode,
        visibility: dto.visibility ?? room.visibility,
        passwordHash,
        difficulty: dto.difficulty ?? room.difficulty,
        maxPlayers: dto.maxPlayers ?? room.maxPlayers,
        roundDurationSec: dto.roundDurationSec ? Math.min(15, Math.max(5, dto.roundDurationSec)) : room.roundDurationSec,
        penaltyForWrong: dto.penaltyForWrong ?? room.penaltyForWrong,
        shuffleQuestions: dto.shuffleQuestions ?? room.shuffleQuestions,
        shuffleOptions: dto.shuffleOptions ?? room.shuffleOptions,
        showAnswerAfterEach: dto.showAnswerAfterEach ?? room.showAnswerAfterEach,
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

    // Update in-memory room if present
    const memRoom = this.gamesService.roomManager.getRoom(code);
    if (memRoom) {
      if (dto.title) memRoom.title = dto.title.trim();
      if (dto.gameMode) memRoom.gameMode = dto.gameMode;
      if (dto.roundDurationSec) memRoom.roundDurationSec = Math.min(15, Math.max(5, dto.roundDurationSec));
    }

    const { passwordHash: _, ...safeRoom } = updated;
    return {
      ...safeRoom,
      hasPassword: !!updated.passwordHash,
    };
  }

  /**
   * Host deletes custom room
   */
  async deleteRoom(hostUserId: string, roomCode: string) {
    const code = roomCode.toUpperCase();
    const room = await this.prisma.customGameRoom.findUnique({
      where: { roomCode: code },
    });

    if (!room) throw new NotFoundException('Phòng không tồn tại.');
    if (room.hostUserId !== hostUserId) {
      throw new ForbiddenException('Chỉ chủ phòng mới có quyền xóa phòng.');
    }

    await this.prisma.$transaction([
      this.prisma.customRoomInvitation.deleteMany({ where: { roomId: room.id } }),
      this.prisma.customRoomParticipant.deleteMany({ where: { roomId: room.id } }),
      this.prisma.customGameRoom.delete({ where: { id: room.id } }),
    ]);

    this.gamesService.roomManager.removeRoom(code);

    return {
      success: true,
      message: 'Đã xóa phòng đấu thành công.',
    };
  }
}

