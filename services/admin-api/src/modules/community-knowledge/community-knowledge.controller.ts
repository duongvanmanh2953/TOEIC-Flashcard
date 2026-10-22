import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommunityKnowledgeService } from './community-knowledge.service';
import { TrainingDataService } from './training-data.service';
import {
  CreateCommunityPostDto,
  UpdateCommunityPostDto,
  CommunityPostQueryDto,
  ReactionDto,
  CreateCommentDto,
  UpdateCommentDto,
  CommentQueryDto,
  RejectPostDto,
  UpdateTrainingStatusDto,
  CreateTopicDto,
  UpdateTopicDto,
} from './dto/community-post.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CommunityPostStatus, Role } from '@prisma/client';
import { Response } from 'express';

@ApiTags('Community Knowledge & Social Learning Feed')
@Controller('community')
export class CommunityKnowledgeController {
  constructor(
    private readonly communityService: CommunityKnowledgeService,
    private readonly trainingService: TrainingDataService,
  ) {}

  // ===========================================================================
  // TOPICS (PUBLIC)
  // ===========================================================================

  @Public()
  @Get('topics')
  @ApiOperation({ summary: 'Get active community learning topics' })
  getTopics() {
    return this.communityService.getTopics();
  }

  // ===========================================================================
  // FEED & POSTS (PUBLIC BROWSING + AUTH ENRICHMENT)
  // ===========================================================================

  @Public()
  @Get('posts')
  @ApiOperation({ summary: 'Browse public community knowledge posts (cursor pagination)' })
  getFeed(
    @Query() query: CommunityPostQueryDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.communityService.getFeed(query, userId);
  }

  @Public()
  @Get('posts/:id')
  @ApiOperation({ summary: 'Get full post details by ID' })
  getPostById(
    @Param('id') id: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.communityService.getPostById(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('posts')
  @ApiOperation({ summary: 'Create new knowledge post (DRAFT or PENDING_REVIEW)' })
  createPost(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCommunityPostDto,
  ) {
    return this.communityService.createPost(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('posts/:id')
  @ApiOperation({ summary: 'Update post (resets approved post back to PENDING_REVIEW)' })
  updatePost(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCommunityPostDto,
  ) {
    return this.communityService.updatePost(userId, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('posts/:id/submit')
  @ApiOperation({ summary: 'Submit draft post for admin moderation' })
  submitDraft(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.communityService.submitDraft(userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('posts/:id')
  @ApiOperation({ summary: 'Delete own post (soft delete)' })
  deletePost(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Param('id') id: string,
  ) {
    const isAdmin = ([Role.ADMIN, Role.SUPER_ADMIN, Role.MODERATOR] as Role[]).includes(role);
    return this.communityService.deletePost(userId, id, isAdmin);
  }

  // ===========================================================================
  // ATOMIC REACTIONS (LIKE / DISLIKE / NONE)
  // ===========================================================================

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('posts/:id/reaction')
  @ApiOperation({ summary: 'Set reaction (LIKE, DISLIKE, or NONE)' })
  handleReaction(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: ReactionDto,
  ) {
    return this.communityService.handleReaction(userId, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('posts/:id/like')
  @ApiOperation({ summary: 'Like a post' })
  likePost(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.communityService.handleReaction(userId, id, { type: 'LIKE' });
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('posts/:id/dislike')
  @ApiOperation({ summary: 'Dislike a post' })
  dislikePost(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.communityService.handleReaction(userId, id, { type: 'DISLIKE' });
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('posts/:id/reaction')
  @ApiOperation({ summary: 'Remove like or dislike' })
  removeReaction(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.communityService.handleReaction(userId, id, { type: 'NONE' });
  }

  // ===========================================================================
  // SAVES / BOOKMARKS
  // ===========================================================================

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('posts/:id/save')
  @ApiOperation({ summary: 'Save / bookmark post' })
  savePost(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.communityService.toggleSavePost(userId, id, true);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('posts/:id/save')
  @ApiOperation({ summary: 'Unsave / remove bookmark' })
  unsavePost(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.communityService.toggleSavePost(userId, id, false);
  }

  // ===========================================================================
  // SHARES
  // ===========================================================================

  @Public()
  @Post('posts/:id/share')
  @ApiOperation({ summary: 'Track post share event' })
  trackShare(
    @Param('id') id: string,
    @CurrentUser('id') userId?: string,
    @Body('platform') platform?: string,
  ) {
    return this.communityService.trackShare(id, userId, platform);
  }

  // ===========================================================================
  // MULTI-LEVEL COMMENTS
  // ===========================================================================

  @Public()
  @Get('posts/:id/comments')
  @ApiOperation({ summary: 'Get root comments or replies of a parent comment' })
  getComments(
    @Param('id') postId: string,
    @Query() query: CommentQueryDto,
    @CurrentUser('id') userId?: string,
  ) {
    return this.communityService.getComments(postId, query, userId);
  }

  @Public()
  @Get('comments/:id/replies')
  @ApiOperation({ summary: 'Get replies for a specific comment (nested tree)' })
  getCommentReplies(
    @Param('id') commentId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
    @CurrentUser('id') userId?: string,
  ) {
    return this.communityService.getComments('', { parentId: commentId, cursor, limit }, userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('posts/:id/comments')
  @ApiOperation({ summary: 'Post root comment or reply' })
  createComment(
    @CurrentUser('id') userId: string,
    @Param('id') postId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.communityService.createComment(userId, postId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('comments/:id')
  @ApiOperation({ summary: 'Update own comment' })
  updateComment(
    @CurrentUser('id') userId: string,
    @Param('id') commentId: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.communityService.updateComment(userId, commentId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('comments/:id')
  @ApiOperation({ summary: 'Delete comment (soft delete)' })
  deleteComment(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
    @Param('id') commentId: string,
  ) {
    const isAdmin = ([Role.ADMIN, Role.SUPER_ADMIN, Role.MODERATOR] as Role[]).includes(role);
    return this.communityService.deleteComment(userId, commentId, isAdmin);
  }

  // ===========================================================================
  // MY POSTS & SAVED POSTS
  // ===========================================================================

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('my-posts')
  @ApiOperation({ summary: 'Get current user personal posts (all statuses)' })
  getMyPosts(
    @CurrentUser('id') userId: string,
    @Query('status') status?: CommunityPostStatus,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ) {
    return this.communityService.getMyPosts(userId, status, cursor, limit);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('saved-posts')
  @ApiOperation({ summary: 'Get current user bookmarked posts' })
  getSavedPosts(
    @CurrentUser('id') userId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ) {
    return this.communityService.getSavedPosts(userId, cursor, limit);
  }

  // ===========================================================================
  // ADMIN MODERATION & AI DATASET FOUNDATION
  // ===========================================================================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MODERATOR)
  @ApiBearerAuth()
  @Get('admin/posts')
  @ApiOperation({ summary: 'Admin: Get posts for moderation with filter' })
  getAdminPosts(
    @Query('status') status?: CommunityPostStatus,
    @Query('search') search?: string,
    @Query('topicId') topicId?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ) {
    return this.communityService.getAdminPosts({ status, search, topicId, cursor, limit });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MODERATOR)
  @ApiBearerAuth()
  @Get('admin/pending-count')
  @ApiOperation({ summary: 'Admin: Get pending review count badge' })
  getPendingCount() {
    return this.communityService.getPendingReviewCount();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MODERATOR)
  @ApiBearerAuth()
  @Post('admin/posts/:id/approve')
  @ApiOperation({ summary: 'Admin: Approve knowledge post' })
  approvePost(
    @CurrentUser('id') adminId: string,
    @Param('id') id: string,
  ) {
    return this.communityService.approvePost(adminId, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MODERATOR)
  @ApiBearerAuth()
  @Post('admin/posts/:id/reject')
  @ApiOperation({ summary: 'Admin: Reject knowledge post with reason' })
  rejectPost(
    @CurrentUser('id') adminId: string,
    @Param('id') id: string,
    @Body() dto: RejectPostDto,
  ) {
    return this.communityService.rejectPost(adminId, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MODERATOR)
  @ApiBearerAuth()
  @Post('admin/posts/:id/archive')
  @ApiOperation({ summary: 'Admin: Archive knowledge post' })
  archivePost(
    @CurrentUser('id') adminId: string,
    @Param('id') id: string,
  ) {
    return this.communityService.archivePost(adminId, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.MODERATOR)
  @ApiBearerAuth()
  @Patch('admin/posts/:id/training-status')
  @ApiOperation({ summary: 'Admin: Update AI training eligibility & quality score' })
  updateTrainingStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTrainingStatusDto,
  ) {
    return this.trainingService.updatePostTrainingEligibility(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @Post('admin/topics')
  @ApiOperation({ summary: 'Admin: Create topic' })
  createTopic(@Body() dto: CreateTopicDto) {
    return this.communityService.createTopic(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @Patch('admin/topics/:id')
  @ApiOperation({ summary: 'Admin: Update topic' })
  updateTopic(
    @Param('id') id: string,
    @Body() dto: UpdateTopicDto,
  ) {
    return this.communityService.updateTopic(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @Delete('admin/topics/:id')
  @ApiOperation({ summary: 'Admin: Delete topic' })
  deleteTopic(@Param('id') id: string) {
    return this.communityService.deleteTopic(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @Get('admin/training-data/export')
  @ApiOperation({ summary: 'Admin: Export eligible community posts to JSONL for AI Training' })
  async exportTrainingData(
    @Query('topicId') topicId?: string,
    @Query('language') language?: string,
    @Query('minQualityScore') minQualityScore?: number,
    @Query('limit') limit?: number,
    @Res() res?: Response,
  ) {
    const jsonl = await this.trainingService.exportDatasetJsonl({
      topicId,
      language,
      minQualityScore: minQualityScore ? Number(minQualityScore) : 0.5,
      limit: limit ? Number(limit) : 1000,
    });

    if (res) {
      res.setHeader('Content-Type', 'application/x-jsonlines');
      res.setHeader('Content-Disposition', 'attachment; filename="letstun_training_dataset.jsonl"');
      return res.status(HttpStatus.OK).send(jsonl);
    }

    return { dataset: jsonl };
  }
}
