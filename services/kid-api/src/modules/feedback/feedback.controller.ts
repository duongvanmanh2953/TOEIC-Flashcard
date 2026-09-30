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
import { FeedbackService } from './feedback.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, FeedbackType, FeedbackStatus, SupportPriority } from '@prisma/client';

@ApiTags('Feedback & Contributions')
@Controller('feedback')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @ApiOperation({ summary: 'User: Submit feedback or feature idea' })
  createFeedback(
    @CurrentUser('id') userId: string,
    @Body()
    dto: {
      type: FeedbackType;
      title: string;
      description: string;
      priority?: SupportPriority;
    },
  ) {
    return this.feedbackService.createFeedback(userId, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'User: Get own submitted feedback' })
  getMyFeedback(@CurrentUser('id') userId: string) {
    return this.feedbackService.getMyFeedback(userId);
  }

  @Get('public')
  @ApiOperation({ summary: 'User: Get public roadmap and community ideas' })
  getPublicRoadmap() {
    return this.feedbackService.getPublicRoadmap();
  }

  @Post(':id/vote')
  @ApiOperation({ summary: 'User: Upvote or unvote a feedback idea' })
  toggleVote(
    @CurrentUser('id') userId: string,
    @Param('id') feedbackId: string,
  ) {
    return this.feedbackService.toggleVote(userId, feedbackId);
  }

  // =========================================================================
  // ADMIN ROUTES
  // =========================================================================

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: Get all feedback with filters and status counts' })
  getAdminFeedback(
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

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: Get all feedback alias' })
  getAdminAllFeedback(
    @Query('status') status?: FeedbackStatus,
    @Query('type') type?: FeedbackType,
    @Query('priority') priority?: SupportPriority,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.getAdminFeedback(status, type, priority, search, page, limit);
  }

  @Patch('admin/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: Update feedback status and internal notes' })
  updateFeedbackStatus(
    @CurrentUser('id') adminId: string,
    @Param('id') feedbackId: string,
    @Body('status') status: FeedbackStatus,
    @Body('adminNotes') adminNotes?: string,
  ) {
    return this.feedbackService.updateFeedbackStatus(adminId, feedbackId, status, adminNotes);
  }

  @Patch('admin/:id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: Update feedback status alias' })
  updateFeedbackStatusAlias(
    @CurrentUser('id') adminId: string,
    @Param('id') feedbackId: string,
    @Body('status') status: FeedbackStatus,
  ) {
    return this.feedbackService.updateFeedbackStatus(adminId, feedbackId, status);
  }

  @Post('admin/:id/reply')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: Post public reply to user feedback' })
  adminReply(
    @CurrentUser('id') adminId: string,
    @Param('id') feedbackId: string,
    @Body('adminReply') adminReply: string,
  ) {
    return this.feedbackService.adminReply(adminId, feedbackId, adminReply);
  }

  @Post('admin/:id/respond')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: Respond to user feedback alias' })
  adminRespondAlias(
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
}
