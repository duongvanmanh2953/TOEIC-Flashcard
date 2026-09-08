import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { SupportGateway } from './support.gateway';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, SupportStatus, SupportPriority } from '@prisma/client';

@ApiTags('Support Center')
@Controller('support')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SupportController {
  constructor(
    private readonly supportService: SupportService,
    private readonly supportGateway: SupportGateway,
  ) {}

  // =========================================================================
  // USER ROUTES
  // =========================================================================

  @Post('conversations')
  @ApiOperation({ summary: 'User: Create a support ticket' })
  async createTicket(
    @CurrentUser('id') userId: string,
    @Body()
    dto: {
      subject: string;
      message: string;
      priority?: SupportPriority;
      tags?: string[];
    },
  ) {
    const conv = await this.supportService.createTicket(userId, dto);
    if (conv?.messages?.[0]) {
      this.supportGateway.broadcastNewMessage(conv.id, conv.messages[0], userId);
    }
    this.supportGateway.broadcastAdminEvent({
      type: 'NEW_CONVERSATION',
      priority: dto.priority === 'URGENT' || dto.priority === 'HIGH' ? 'HIGH' : 'MEDIUM',
      title: 'Hội thoại hỗ trợ mới',
      message: `${conv.ticketId}: "${dto.subject}"`,
      targetType: 'CONVERSATION',
      targetId: conv.id,
    });
    return conv;
  }

  @Get('conversations')
  @ApiOperation({ summary: 'User: List own support tickets' })
  getUserTickets(@CurrentUser('id') userId: string) {
    return this.supportService.getUserTickets(userId);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'User: Get conversation messages' })
  getUserTicketDetail(
    @CurrentUser('id') userId: string,
    @Param('id') conversationId: string,
  ) {
    return this.supportService.getUserTicketDetail(userId, conversationId);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'User: Send message in conversation' })
  async userSendMessage(
    @CurrentUser('id') userId: string,
    @Param('id') conversationId: string,
    @Body('content') content: string,
  ) {
    const msg = await this.supportService.userSendMessage(userId, conversationId, content);
    this.supportGateway.broadcastNewMessage(conversationId, msg, userId);
    return msg;
  }

  @Post('conversations/:id/resolve')
  @ApiOperation({ summary: 'User: Mark own conversation as resolved' })
  userResolveTicket(
    @CurrentUser('id') userId: string,
    @Param('id') conversationId: string,
  ) {
    return this.supportService.userResolveTicket(userId, conversationId);
  }

  @Post('conversations/:id/read')
  @ApiOperation({ summary: 'User: Mark conversation as read' })
  async userMarkAsRead(
    @CurrentUser('id') userId: string,
    @Param('id') conversationId: string,
  ) {
    const result = await this.supportService.userMarkAsRead(userId, conversationId);
    if (result.count > 0) {
      this.supportGateway.broadcastMessagesRead(conversationId, 'USER');
    }
    return result;
  }

  // =========================================================================
  // ADMIN ROUTES
  // =========================================================================

  @Get('admin/conversations')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: List all support tickets with filtering' })
  getAdminConversations(
    @Query('status') status?: SupportStatus,
    @Query('priority') priority?: SupportPriority,
    @Query('assignedAdminId') assignedAdminId?: string,
    @Query('unassignedOnly') unassignedOnly?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.supportService.getAdminConversations({
      status,
      priority,
      assignedAdminId,
      unassignedOnly: unassignedOnly === 'true',
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 25,
    });
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: List all tickets alias' })
  getAdminAllConversations(
    @Query('status') status?: SupportStatus,
    @Query('priority') priority?: SupportPriority,
    @Query('assignedAdminId') assignedAdminId?: string,
    @Query('unassignedOnly') unassignedOnly?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.getAdminConversations(status, priority, assignedAdminId, unassignedOnly, search, page, limit);
  }

  @Get('admin/conversations/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: Get conversation detail with user context and internal notes' })
  getAdminConversationDetail(@Param('id') conversationId: string) {
    return this.supportService.getAdminConversationDetail(conversationId);
  }

  @Post('admin/conversations/:id/messages')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: Reply to user conversation' })
  async adminSendMessage(
    @CurrentUser('id') adminId: string,
    @Param('id') conversationId: string,
    @Body('content') content: string,
  ) {
    const msg = await this.supportService.adminSendMessage(adminId, conversationId, content, false);
    const recipientUserId = (msg as any)?.recipientUserId;
    this.supportGateway.broadcastNewMessage(conversationId, msg, recipientUserId);
    return msg;
  }

  @Post('admin/conversations/:id/note')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: Create internal note on conversation' })
  adminCreateNote(
    @CurrentUser('id') adminId: string,
    @Param('id') conversationId: string,
    @Body('content') content: string,
  ) {
    return this.supportService.adminSendMessage(adminId, conversationId, content, true);
  }

  @Patch('admin/conversations/:id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: Update ticket status' })
  updateStatus(
    @CurrentUser('id') adminId: string,
    @Param('id') conversationId: string,
    @Body('status') status: SupportStatus,
  ) {
    return this.supportService.updateStatus(adminId, conversationId, status);
  }

  @Patch('admin/conversations/:id/priority')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: Update ticket priority' })
  updatePriority(
    @Param('id') conversationId: string,
    @Body('priority') priority: SupportPriority,
  ) {
    return this.supportService.updatePriority(conversationId, priority);
  }

  @Post('admin/conversations/:id/assign')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: Assign conversation to admin' })
  assignAdmin(
    @Param('id') conversationId: string,
    @Body('assignedAdminId') assignedAdminId: string | null,
  ) {
    return this.supportService.assignAdmin(conversationId, assignedAdminId);
  }

  @Post('admin/cleanup-old-messages')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: Purge messages older than 3 days while keeping ticket requests' })
  cleanupOldMessages(@Body('days') days?: number) {
    return this.supportService.cleanupOldMessages(days || 3);
  }

  @Post('admin/conversations/:id/read')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: Mark conversation messages as read' })
  async adminMarkAsRead(@Param('id') conversationId: string) {
    const result = await this.supportService.adminMarkAsRead(conversationId);
    if (result.count > 0) {
      this.supportGateway.broadcastMessagesRead(conversationId, 'ADMIN');
    }
    return result;
  }
}
