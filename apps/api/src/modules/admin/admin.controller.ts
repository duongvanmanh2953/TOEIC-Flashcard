import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Admin Command Center')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/overview')
  @ApiOperation({ summary: 'Admin Ultra Overview: KPIs, Needs Attention, and Live Events' })
  getDashboardOverview(@Query('range') range?: string) {
    return this.adminService.getDashboardOverview(range);
  }

  @Get('overview')
  @ApiOperation({ summary: 'Alias for dashboard overview' })
  getOverviewAlias(@Query('range') range?: string) {
    return this.adminService.getDashboardOverview(range);
  }

  @Get('vocab-health')
  @ApiOperation({ summary: 'Alias for vocabulary health' })
  getVocabHealth() {
    return this.adminService.getVocabularyAnalytics();
  }

  @Get('learning-stats')
  @ApiOperation({ summary: 'Alias for learning telemetry' })
  getLearningStats() {
    return this.adminService.getLearningAnalytics();
  }

  @Get('ai-stats')
  @ApiOperation({ summary: 'Alias for AI telemetry' })
  getAiStats() {
    return this.adminService.getAIAnalytics();
  }

  @Get('billing-stats')
  @ApiOperation({ summary: 'Alias for billing and revenue telemetry' })
  getBillingStats() {
    return this.adminService.getBillingAnalytics();
  }

  @Get('system-health')
  @ApiOperation({ summary: 'Alias for infrastructure health' })
  getSystemHealthAlias() {
    return this.adminService.getSystemHealth();
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Legacy alias for overview' })
  getDashboardStats() {
    return this.adminService.getDashboardOverview('30d');
  }

  @Get('analytics/users')
  @ApiOperation({ summary: 'User growth, activation funnel, and retention cohort' })
  getUserAnalytics() {
    return this.adminService.getUserAnalytics();
  }

  @Get('analytics/vocabulary')
  @ApiOperation({ summary: 'Vocabulary health, error rates, and difficulty calibration' })
  getVocabularyAnalytics() {
    return this.adminService.getVocabularyAnalytics();
  }

  @Get('analytics/learning')
  @ApiOperation({ summary: 'Study sessions, review accuracy, and exercise type distribution' })
  getLearningAnalytics() {
    return this.adminService.getLearningAnalytics();
  }

  @Get('analytics/ai')
  @ApiOperation({ summary: 'AI request volume, latency, tokens, cost estimate, and feature breakdown' })
  getAIAnalytics() {
    return this.adminService.getAIAnalytics();
  }

  @Get('analytics/billing')
  @ApiOperation({ summary: 'Subscription distribution, MRR, conversion, and recent transactions' })
  getBillingAnalytics() {
    return this.adminService.getBillingAnalytics();
  }

  @Get('system/health')
  @ApiOperation({ summary: 'Infrastructure telemetry: API, DB, Redis, Memory, and Error logs' })
  getSystemHealth() {
    return this.adminService.getSystemHealth();
  }

  @Get('security/overview')
  @ApiOperation({ summary: 'Security audit logs and role-permission matrix' })
  getSecurityOverview() {
    return this.adminService.getSecurityOverview();
  }

  @Get('moderation/decks')
  @ApiOperation({ summary: 'List pending community decks for human review' })
  getPendingDecks() {
    return this.adminService.getPendingDecks();
  }

  @Patch('moderation/decks/:id')
  @ApiOperation({ summary: 'Approve or reject a community deck' })
  moderateDeck(
    @Param('id') deckId: string,
    @Body('action') action: 'APPROVE' | 'REJECT',
    @CurrentUser('id') actorId: string,
  ) {
    return this.adminService.moderateDeck(deckId, action, actorId);
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users with roles and study statistics' })
  getUsers(
    @Query('search') search?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.adminService.getUsers(search, parseInt(page, 10), parseInt(limit, 10));
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Toggle user suspension status' })
  toggleUserStatus(
    @Param('id') userId: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.adminService.toggleUserStatus(userId, actorId);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get recent administrative and moderation audit logs' })
  getAuditLogs(@Query('limit') limit: string = '20') {
    return this.adminService.getAuditLogs(parseInt(limit, 10));
  }

  @Post('purge-mock-data')
  @ApiOperation({ summary: 'Purge all mock operational data (tickets, feedback, fake orders, fake sessions)' })
  purgeMockData() {
    return this.adminService.purgeMockData();
  }
}
