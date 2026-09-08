import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications with tab filtering & pagination' })
  getUserNotifications(
    @CurrentUser('id') userId: string,
    @Query('type') type?: string,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.getUserNotifications(userId, {
      type,
      unreadOnly: unreadOnly === 'true',
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get user total unread notifications count' })
  getUnreadCount(@CurrentUser('id') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark single notification as read' })
  markAsRead(
    @CurrentUser('id') userId: string,
    @Param('id') notificationId: string,
  ) {
    return this.notificationsService.markAsRead(userId, notificationId);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all user notifications as read' })
  markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Post('mark-all-read')
  @ApiOperation({ summary: 'Mark all user notifications as read alias' })
  markAllAsReadAlias(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a single notification' })
  deleteNotification(
    @CurrentUser('id') userId: string,
    @Param('id') notificationId: string,
  ) {
    return this.notificationsService.deleteNotification(userId, notificationId);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear all user notifications' })
  clearAll(@CurrentUser('id') userId: string) {
    return this.notificationsService.clearAll(userId);
  }

  @Post('admin/broadcast')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: Broadcast announcement to audience' })
  broadcastAnnouncement(
    @CurrentUser('id') adminId: string,
    @Body('title') title: string,
    @Body('content') content?: string,
    @Body('message') message?: string,
    @Body('audience') audience?: 'ALL' | 'FREE' | 'PREMIUM' | 'INACTIVE_7D',
    @Body('targetAudience') targetAudience?: 'ALL' | 'FREE' | 'PREMIUM' | 'INACTIVE_7D',
  ) {
    const finalContent = content || message || '';
    const finalAudience = audience || targetAudience || 'ALL';
    return this.notificationsService.broadcastAnnouncement(
      title,
      finalContent,
      finalAudience,
      adminId,
    );
  }

  @Post('broadcast')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: Broadcast announcement alias' })
  broadcastAnnouncementAlias(
    @CurrentUser('id') adminId: string,
    @Body('title') title: string,
    @Body('content') content?: string,
    @Body('message') message?: string,
    @Body('audience') audience?: 'ALL' | 'FREE' | 'PREMIUM' | 'INACTIVE_7D',
    @Body('targetAudience') targetAudience?: 'ALL' | 'FREE' | 'PREMIUM' | 'INACTIVE_7D',
  ) {
    return this.broadcastAnnouncement(adminId, title, content, message, audience, targetAudience);
  }

  @Get('admin/announcements')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: List historical announcements' })
  getAnnouncements() {
    return this.notificationsService.getAnnouncements();
  }

  @Get('announcements')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: List historical announcements alias' })
  getAnnouncementsAlias() {
    return this.notificationsService.getAnnouncements();
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: List all system notifications with user context' })
  getAdminAllNotifications(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.getAdminAllNotifications(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 30,
    );
  }

  @Delete('admin/all')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: Clear all notifications from system' })
  clearAllNotificationsAdmin(@CurrentUser('id') adminId: string) {
    return this.notificationsService.adminClearAllNotifications(adminId);
  }
}
