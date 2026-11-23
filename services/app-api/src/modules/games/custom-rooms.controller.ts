import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { CustomRoomsService } from './custom-rooms.service';
import { CreateCustomRoomDto, VerifyRoomPasswordDto, InviteRoomPlayerDto, UpdateCustomRoomDto } from './dto/custom-room.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('games/rooms')
export class CustomRoomsController {
  constructor(private readonly customRoomsService: CustomRoomsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createRoom(@Request() req: any, @Body() dto: CreateCustomRoomDto) {
    const userId = req.user?.id || req.user?.sub;
    const room = await this.customRoomsService.createRoom(userId, dto);
    return {
      success: true,
      data: room,
      message: 'Tạo phòng đấu thành công!',
    };
  }

  @Public()
  @Get()
  async getPublicRooms(@Query('languageId') languageId?: string, @Query('gameMode') gameMode?: string) {
    const rooms = await this.customRoomsService.getPublicRooms({ languageId, gameMode });
    return {
      success: true,
      data: rooms,
    };
  }

  @Public()
  @Get(':roomCode')
  async getRoom(@Param('roomCode') roomCode: string) {
    const room = await this.customRoomsService.getRoomByCode(roomCode);
    return {
      success: true,
      data: room,
    };
  }

  @Patch(':roomCode')
  @UseGuards(JwtAuthGuard)
  async updateRoom(
    @Request() req: any,
    @Param('roomCode') roomCode: string,
    @Body() dto: UpdateCustomRoomDto,
  ) {
    const hostUserId = req.user?.id || req.user?.sub;
    const room = await this.customRoomsService.updateRoom(hostUserId, roomCode, dto);
    return {
      success: true,
      data: room,
      message: 'Cập nhật phòng đấu thành công!',
    };
  }

  @Delete(':roomCode')
  @UseGuards(JwtAuthGuard)
  async deleteRoom(@Request() req: any, @Param('roomCode') roomCode: string) {
    const hostUserId = req.user?.id || req.user?.sub;
    const result = await this.customRoomsService.deleteRoom(hostUserId, roomCode);
    return result;
  }

  @Public()
  @Post(':roomCode/verify-password')
  async verifyPassword(
    @Param('roomCode') roomCode: string,
    @Body() dto: VerifyRoomPasswordDto,
  ) {
    const isValid = await this.customRoomsService.verifyPassword(roomCode, dto.password);
    if (!isValid) {
      throw new BadRequestException('Mật khẩu phòng không chính xác.');
    }
    return {
      success: true,
      message: 'Mật khẩu chính xác. Bạn có thể tham gia phòng.',
    };
  }

  @Post(':roomCode/kick')
  @UseGuards(JwtAuthGuard)
  async kickPlayer(
    @Request() req: any,
    @Param('roomCode') roomCode: string,
    @Body('targetUserId') targetUserId: string,
  ) {
    const hostUserId = req.user?.id || req.user?.sub;
    const result = await this.customRoomsService.kickPlayer(hostUserId, roomCode, targetUserId);
    return result;
  }

  @Post(':roomCode/invite')
  @UseGuards(JwtAuthGuard)
  async invitePlayer(
    @Request() req: any,
    @Param('roomCode') roomCode: string,
    @Body() dto: InviteRoomPlayerDto,
  ) {
    const inviterUserId = req.user?.id || req.user?.sub;
    const invite = await this.customRoomsService.inviteFriend(inviterUserId, roomCode, dto.inviteeUserId);
    return {
      success: true,
      data: invite,
      message: 'Đã gửi lời mời tham gia phòng thi đấu!',
    };
  }

  @Public()
  @Get(':roomCode/live/status')
  getLiveStatus(@Param('roomCode') roomCode: string) {
    const status = this.customRoomsService.getLiveStatus(roomCode);
    return {
      success: true,
      data: status,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':roomCode/live/connect')
  async connectLive(
    @Request() req: any,
    @Param('roomCode') roomCode: string,
    @Body() body: { provider?: 'MOCK' | 'TIKTOK_LIVE'; channelName?: string },
  ) {
    await this.customRoomsService.assertLiveHost(roomCode, req.user?.id);
    const result = await this.customRoomsService.connectLive(
      roomCode,
      body.provider || 'MOCK',
      body.channelName || 'demo_stream',
    );
    return {
      success: result.success,
      data: result,
      message: result.message,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':roomCode/live/disconnect')
  async disconnectLive(@Request() req: any, @Param('roomCode') roomCode: string) {
    await this.customRoomsService.assertLiveHost(roomCode, req.user?.id);
    await this.customRoomsService.disconnectLive(roomCode);
    return {
      success: true,
      message: 'Đã ngắt kết nối Live Integration.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':roomCode/live/mock-comment')
  async sendMockComment(
    @Request() req: any,
    @Param('roomCode') roomCode: string,
    @Body() body: { username?: string; displayName?: string; commentText: string },
  ) {
    await this.customRoomsService.assertLiveHost(roomCode, req.user?.id);
    const event = this.customRoomsService.sendMockComment(roomCode, body);
    return {
      success: true,
      data: event,
      message: 'Đã gửi comment mô phỏng.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':roomCode/live/simulate-batch')
  async simulateBatch(
    @Request() req: any,
    @Param('roomCode') roomCode: string,
    @Body('count') count?: number,
  ) {
    await this.customRoomsService.assertLiveHost(roomCode, req.user?.id);
    const events = this.customRoomsService.simulateBatch(roomCode, count || 8);
    return {
      success: true,
      data: { count: events.length },
      message: `Đã kích hoạt mô phỏng ${events.length} comment khán giả.`,
    };
  }
}

