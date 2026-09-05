import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Admin Dashboard & Control Center')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get overall admin SaaS metrics: users, retention, reviews, accuracy, AI usage' })
  getDashboardStats() {
    return this.adminService.getDashboardStats();
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
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.adminService.getUsers(search, page, limit);
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
  getAuditLogs(@Query('limit') limit: number = 20) {
    return this.adminService.getAuditLogs(limit);
  }
}

