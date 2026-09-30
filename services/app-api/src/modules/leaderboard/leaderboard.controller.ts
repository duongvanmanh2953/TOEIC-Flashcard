import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private leaderboardService: LeaderboardService) {}

  @Public()
  @Get('xp')
  async getXPLeaderboard(
    @Query('timeframe') timeframe: 'weekly' | 'all-time' = 'weekly',
    @Query('limit') limit: number = 20,
  ) {
    const data = await this.leaderboardService.getXPLeaderboard(timeframe, Number(limit) || 20);
    return {
      success: true,
      data,
      meta: {
        category: 'XP & Exam Score',
        timeframe,
        antiCheatActive: true,
      },
    };
  }

  @Public()
  @Get('flashcards')
  async getFlashcardsLeaderboard(@Query('limit') limit: number = 20) {
    const data = await this.leaderboardService.getFlashcardMasteryLeaderboard(Number(limit) || 20);
    return {
      success: true,
      data,
      meta: {
        category: 'Mastered Flashcard Vocabulary',
        antiCheatActive: true,
      },
    };
  }

  @Public()
  @Get('streak')
  async getStreakLeaderboard(@Query('limit') limit: number = 20) {
    const data = await this.leaderboardService.getStreakLeaderboard(Number(limit) || 20);
    return {
      success: true,
      data,
      meta: {
        category: 'Continuous Study Streak',
        antiCheatActive: true,
      },
    };
  }

  @Get('my-rank')
  @UseGuards(JwtAuthGuard)
  async getMyRank(@Request() req: any) {
    const data = await this.leaderboardService.getUserRank(req.user.id);
    return {
      success: true,
      data,
    };
  }

  @Post('verify-action')
  @UseGuards(JwtAuthGuard)
  async verifyAction(
    @Request() req: any,
    @Body() body: { itemsCount: number; durationMs: number },
  ) {
    const result = this.leaderboardService.verifyActionIntegrity(
      req.user.id,
      body.itemsCount || 1,
      body.durationMs || 1000,
    );
    return {
      success: true,
      data: result,
    };
  }
}
