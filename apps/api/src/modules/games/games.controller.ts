import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GamesService } from './games.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GameModeType, Role, CefrLevel } from '@prisma/client';

@ApiTags('Realtime Games & Competitive Leaderboard')
@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Public()
  @Get('lobby')
  @ApiOperation({ summary: 'Get realtime game lobby status, daily operating hours, and schedule' })
  async getLobby() {
    const hoursStatus = this.gamesService.getOperatingHoursStatus();
    const schedule = await this.gamesService.getGameSchedule();
    const activeRooms = this.gamesService.roomManager.getActiveRooms().map((r) => ({
      roomCode: r.roomCode,
      gameMode: r.gameMode,
      title: r.title,
      status: r.status,
      playerCount: r.players.size,
      currentRound: r.currentRound,
      totalRounds: r.totalRounds,
    }));

    return {
      hoursStatus,
      schedule,
      activeRooms,
    };
  }

  @Public()
  @Get('leaderboard')
  @ApiOperation({ summary: 'Get redesigned competitive leaderboard with Podium & Daily Champion' })
  async getLeaderboard(
    @Query('timeframe') timeframe?: 'daily' | 'weekly' | 'monthly' | 'all-time',
    @Query('gameMode') gameMode?: GameModeType,
    @Query('date') date?: string,
    @Query('userId') userId?: string,
  ) {
    return this.gamesService.getCompetitiveLeaderboard({
      timeframe,
      gameMode,
      date,
      currentUserId: userId,
    });
  }

  @Public()
  @Get('configs')
  @ApiOperation({ summary: 'Get public game mode configs' })
  async getConfigs() {
    return this.gamesService.getGameConfigs();
  }

  // =========================================================================
  // ADMIN GAME & QUESTION BANK MANAGEMENT
  // =========================================================================

  @Post('admin/toggle-test-mode')
  @ApiOperation({ summary: 'Toggle game test mode (bypass 20:00-22:00 restriction for QA)' })
  toggleTestMode(@Body('enabled') enabled: boolean) {
    const status = this.gamesService.setTestMode(Boolean(enabled));
    return { testMode: status, message: `Test mode is now ${status ? 'ENABLED' : 'DISABLED'}` };
  }

  @Get('admin/questions')
  @ApiOperation({ summary: 'Admin: Get game questions pool' })
  getAdminQuestions(
    @Query('gameMode') gameMode?: GameModeType,
    @Query('cefrLevel') cefrLevel?: CefrLevel,
    @Query('search') search?: string,
  ) {
    return this.gamesService.getAdminQuestions({ gameMode, cefrLevel, search });
  }

  @Post('admin/questions')
  @ApiOperation({ summary: 'Admin: Add question to question bank' })
  createQuestion(@Body() body: any) {
    return this.gamesService.createQuestion(body);
  }

  @Put('admin/questions/:id')
  @ApiOperation({ summary: 'Admin: Edit question' })
  updateQuestion(@Param('id') id: string, @Body() body: any) {
    return this.gamesService.updateQuestion(id, body);
  }

  @Delete('admin/questions/:id')
  @ApiOperation({ summary: 'Admin: Delete question' })
  deleteQuestion(@Param('id') id: string) {
    return this.gamesService.deleteQuestion(id);
  }

  @Get('admin/configs')
  @ApiOperation({ summary: 'Admin: Get game schedules and configs' })
  getAdminConfigs() {
    return this.gamesService.getGameConfigs();
  }

  @Put('admin/configs/:id')
  @ApiOperation({ summary: 'Admin: Update game schedule and configuration' })
  updateAdminConfig(@Param('id') id: string, @Body() body: any) {
    return this.gamesService.updateGameConfig(id, body);
  }
}
