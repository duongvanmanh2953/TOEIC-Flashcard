import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Dashboard & Analytics')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user learning dashboard overview metrics' })
  getDashboard(@CurrentUser('id') userId: string) {
    return this.dashboardService.getDashboard(userId);
  }

  @Get('heatmap')
  @ApiOperation({ summary: 'Get 30-day learning activity heatmap' })
  getHeatmap(@CurrentUser('id') userId: string) {
    return this.dashboardService.getHeatmap(userId);
  }
}
