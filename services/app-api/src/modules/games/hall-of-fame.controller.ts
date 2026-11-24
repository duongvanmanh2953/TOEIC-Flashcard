import { Controller, Get, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { HallOfFameService } from './hall-of-fame.service';

@Controller('games/hall-of-fame')
export class HallOfFameController {
  constructor(private readonly hallOfFame: HallOfFameService) {}

  @Public()
  @Get('live')
  live(@Query('page') page?: string, @Query('period') period?: string) {
    return this.hallOfFame.getStandings('live', { page, period });
  }

  @Public()
  @Get('battle')
  battle(@Query('page') page?: string, @Query('period') period?: string) {
    return this.hallOfFame.getStandings('battle', { page, period });
  }

  @UseGuards(JwtAuthGuard)
  @Get('awards')
  awards(@Req() request: { user: { id: string } }) {
    return this.hallOfFame.getAwards(request.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('awards/:id/claim')
  claim(@Req() request: { user: { id: string } }, @Param('id', ParseUUIDPipe) id: string) {
    return this.hallOfFame.claimReward(request.user.id, id);
  }
}
