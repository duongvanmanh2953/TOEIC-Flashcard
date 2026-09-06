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
  constructor(private readonly supportService: SupportService) {}

  // =========================================================================
  // USER ROUTES
  // =========================================================================

  @Post('conversations')
  @ApiOperation({ summary: 'User: Create a support ticket' })
  createTicket(
    @CurrentUser('id') userId: string,
    @Body()
    dto: {
      subject: string;
      message: string;
      priority?: SupportPriority;
      tags?: string[];
    },
  ) {
    return this.supportService.createTicket(userId, dto);
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
  userSendMessage(
    @CurrentUser('id') userId: string,
    @Param('id') conversationId: string,
    @Body('content') content: string,
  ) {
    return this.supportService.userSendMessage(userId, conversationId, content);
  }

  @Post('conversations/:id/resolve')
  @ApiOperation({ summary: 'User: Mark own conversation as resolved' })
  userResolveTicket(
    @CurrentUser('id') userId: string,
    @Param('id') conversationId: string,
  ) {
    return this.supportService.userResolveTicket(userId, conversationId);
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
  adminSendMessage(
    @CurrentUser('id') adminId: string,
    @Param('id') conversationId: string,
    @Body('content') content: string,
  ) {
    return this.supportService.adminSendMessage(adminId, conversationId, content, false);
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
}
