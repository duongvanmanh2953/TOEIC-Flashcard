import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Public()
  @Get('unified-summary')
  async getUnifiedSummary(@Request() req: any) {
    const userId = req.user?.id || req.user?.sub || 'demo_user';
    const summary = await this.progressService.getUnifiedSummary(userId);
    return {
      success: true,
      data: summary,
    };
  }
}
