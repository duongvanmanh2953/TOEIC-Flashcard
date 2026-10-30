import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { CustomRoomsService } from './custom-rooms.service';
import { CreateCustomRoomDto, VerifyRoomPasswordDto, InviteRoomPlayerDto } from './dto/custom-room.dto';
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
}

