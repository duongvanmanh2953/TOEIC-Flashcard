import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { FeedbackService } from '../feedback/feedback.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, FeedbackStatus, FeedbackType, SupportPriority, CefrLevel } from '@prisma/client';

@ApiTags('Admin Command Center')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly feedbackService: FeedbackService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  @Get('feedback')
  @ApiOperation({ summary: 'Admin feedback list with filters and status counts' })
  getFeedback(
    @Query('status') status?: FeedbackStatus,
    @Query('type') type?: FeedbackType,
    @Query('priority') priority?: SupportPriority,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.feedbackService.getAdminFeedback({
      status,
      type,
      priority,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 25,
    });
  }

  @Patch('feedback/:id/status')
  @ApiOperation({ summary: 'Update feedback status and optional internal notes' })
  updateFeedbackStatus(
    @CurrentUser('id') adminId: string,
    @Param('id') feedbackId: string,
    @Body('status') status: FeedbackStatus,
    @Body('adminNotes') adminNotes?: string,
  ) {
    return this.feedbackService.updateFeedbackStatus(adminId, feedbackId, status, adminNotes);
  }

  @Post('feedback/:id/reply')
  @ApiOperation({ summary: 'Post public reply to user feedback' })
  adminReplyFeedback(
    @CurrentUser('id') adminId: string,
    @Param('id') feedbackId: string,
    @Body('adminReply') adminReply: string,
  ) {
    return this.feedbackService.adminReply(adminId, feedbackId, adminReply);
  }

  @Post('feedback/:id/respond')
  @ApiOperation({ summary: 'Respond and update status alias' })
  adminRespondFeedback(
    @CurrentUser('id') adminId: string,
    @Param('id') feedbackId: string,
    @Body('response') response: string,
    @Body('newStatus') newStatus?: FeedbackStatus,
  ) {
    if (newStatus) {
      this.feedbackService.updateFeedbackStatus(adminId, feedbackId, newStatus);
    }
    return this.feedbackService.adminReply(adminId, feedbackId, response);
  }

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

  @Get('finance/overview')
  @ApiOperation({ summary: 'Dedicated Financial Intelligence: MRR, Net Revenue, ARPU, Ledgers' })
  getFinancialOverview(@Query('range') range?: string) {
    return this.adminService.getFinancialReport(range);
  }

  @Get('badge-counts')
  @ApiOperation({ summary: 'Real-time unread badges for admin operations sidebar' })
  getBadgeCounts() {
    return this.adminService.getAdminBadgeCounts();
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

  @Get('settings')
  @ApiOperation({ summary: 'Get unified system settings configuration across all 13 domains' })
  getSettings() {
    return this.adminService.getSettings();
  }

  @Post('settings/:section')
  @ApiOperation({ summary: 'Update a specific system settings section with audit logging' })
  updateSectionSettings(
    @Param('section') section: string,
    @Body() payload: any,
    @CurrentUser('id') actorId: string,
  ) {
    return this.adminService.updateSectionSettings(section, payload, actorId);
  }

  // =========================================================================
  // LEARNER SHARED VOCABULARY VAULT
  // =========================================================================

  @Get('shared-vocabulary')
  @ApiOperation({ summary: 'List and filter community shared decks with AI quality validation' })
  getSharedVocabularyDecks(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.adminService.getSharedVocabularyDecks({
      status,
      search,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
  }

  @Post('shared-vocabulary/:id/moderate')
  @ApiOperation({ summary: 'Approve or reject a shared community deck with optional feedback' })
  moderateSharedDeck(
    @Param('id') deckId: string,
    @Body('action') action: 'APPROVE' | 'REJECT',
    @Body('reason') reason?: string,
    @CurrentUser('id') actorId?: string,
  ) {
    return this.adminService.moderateSharedDeck(deckId, action, reason, actorId);
  }

  @Post('shared-vocabulary/:id/publish-master')
  @ApiOperation({ summary: 'Publish approved shared deck words into canonical Vocabulary dictionary' })
  publishDeckToMaster(
    @Param('id') deckId: string,
    @CurrentUser('id') actorId?: string,
  ) {
    return this.adminService.publishDeckToMaster(deckId, actorId);
  }

  // =========================================================================
  // SMART PRICING & COST MODEL INTELLIGENCE
  // =========================================================================

  @Get('pricing')
  @ApiOperation({ summary: 'Get pricing intelligence, plan configurations, and cost model simulator' })
  getPricing() {
    return this.adminService.getPricingIntelligence();
  }

  @Post('pricing')
  @ApiOperation({ summary: 'Save pricing configurations, quota limits, and plan prices' })
  savePricing(
    @Body() payload: any,
    @CurrentUser('id') actorId: string,
  ) {
    return this.adminService.savePricingIntelligence(payload, actorId);
  }

  // =========================================================================
  // SUBSCRIPTION PLANS CRUD & FEATURE MATRIX
  // =========================================================================

  @Get('plans')
  @ApiOperation({ summary: 'List all plans for admin management (active, inactive, archived)' })
  adminGetPlans() {
    return this.subscriptionsService.adminGetAllPlans();
  }

  @Post('plans')
  @ApiOperation({ summary: 'Create a new subscription plan with features and quota limits' })
  adminCreatePlan(
    @Body() dto: any,
    @CurrentUser('id') actorId: string,
  ) {
    return this.subscriptionsService.adminCreatePlan(dto, actorId);
  }

  @Patch('plans/:id')
  @ApiOperation({ summary: 'Update plan details, features, status, or quota limits' })
  adminUpdatePlan(
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUser('id') actorId: string,
  ) {
    return this.subscriptionsService.adminUpdatePlan(id, dto, actorId);
  }

  @Delete('plans/:id')
  @ApiOperation({ summary: 'Safely delete plan (rejected if active subscribers exist)' })
  adminDeletePlan(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.subscriptionsService.adminDeletePlan(id, actorId);
  }

  @Patch('plans/:id/archive')
  @ApiOperation({ summary: 'Archive plan when delete is prevented due to active subscribers' })
  adminArchivePlan(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.subscriptionsService.adminArchivePlan(id, actorId);
  }

  // =========================================================================
  // LEARNING RESOURCES & CONTENT MANAGEMENT
  // =========================================================================

  @Get('resources')
  @ApiOperation({ summary: 'List learning resources with pagination, search, and filters' })
  adminGetResources(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('level') level?: CefrLevel,
    @Query('requiredPlan') requiredPlan?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getResources({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 15,
      search,
      type,
      level,
      requiredPlan,
      status,
    });
  }

  @Post('resources')
  @ApiOperation({ summary: 'Create a new learning resource' })
  adminCreateResource(
    @Body() dto: any,
    @CurrentUser('id') actorId: string,
  ) {
    return this.adminService.createResource(dto, actorId);
  }

  @Get('resources/:id')
  @ApiOperation({ summary: 'Get learning resource details by ID' })
  adminGetResourceById(@Param('id') id: string) {
    return this.adminService.getResourceById(id);
  }

  @Patch('resources/:id')
  @ApiOperation({ summary: 'Update learning resource' })
  adminUpdateResource(
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUser('id') actorId: string,
  ) {
    return this.adminService.updateResource(id, dto, actorId);
  }

  @Delete('resources/:id')
  @ApiOperation({ summary: 'Delete learning resource' })
  adminDeleteResource(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.adminService.deleteResource(id, actorId);
  }

  @Patch('resources/:id/status')
  @ApiOperation({ summary: 'Quick toggle learning resource status (PUBLISHED, DRAFT, ARCHIVED)' })
  adminUpdateResourceStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser('id') actorId: string,
  ) {
    return this.adminService.updateResourceStatus(id, status, actorId);
  }
}

