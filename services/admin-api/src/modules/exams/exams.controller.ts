import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ExamsService } from './exams.service';
import {
  CreateExamDto,
  UpdateExamDto,
  SubmitExamAttemptDto,
} from './dto/exam.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Exam Bank & Assessments')
@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Browse all public approved exams' })
  getPublicExams(
    @Query('search') search?: string,
    @Query('examType') examType?: string,
    @Query('languageId') languageId?: string,
    @Query('level') level?: string,
    @Query('section') section?: string,
    @Query('sortBy') sortBy?: 'popular' | 'newest' | 'attempts' | 'likes',
    @CurrentUser('id') userId?: string,
  ) {
    return this.examsService.getPublicExams(
      { search, examType, languageId, level, section, sortBy },
      userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-exams')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user personal exams' })
  getMyExams(@CurrentUser('id') userId: string) {
    return this.examsService.getMyExams(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('saved')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get exams saved to personal list' })
  getSavedExams(@CurrentUser('id') userId: string) {
    return this.examsService.getSavedExams(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get exam taking history' })
  getUserExamHistory(@CurrentUser('id') userId: string) {
    return this.examsService.getUserExamHistory(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('wrong-answers')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all wrong answers for smart review' })
  getUserWrongAnswers(
    @CurrentUser('id') userId: string,
    @Query('grammarType') grammarType?: string,
  ) {
    return this.examsService.getUserWrongAnswers(userId, grammarType);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get exam metadata and questions' })
  getExamDetails(
    @Param('id') examId: string,
    @Query('password') password?: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.examsService.getExamDetails(examId, userId, password);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new exam (Draft or Published)' })
  createExam(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateExamDto,
  ) {
    return this.examsService.createExam(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing exam and questions' })
  updateExam(
    @CurrentUser('id') userId: string,
    @Param('id') examId: string,
    @Body() dto: UpdateExamDto,
  ) {
    return this.examsService.updateExam(userId, examId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an exam' })
  deleteExam(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Param('id') examId: string,
  ) {
    return this.examsService.deleteExam(userId, examId, role);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/publish')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish draft exam' })
  publishExam(
    @CurrentUser('id') userId: string,
    @Param('id') examId: string,
  ) {
    return this.examsService.publishExam(userId, examId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/submit-review')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit exam for review' })
  submitForReview(@CurrentUser('id') userId: string, @Param('id') examId: string) {
    return this.examsService.submitForReview(userId, examId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/approve')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin approve exam' })
  approveExam(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Param('id') examId: string,
  ) {
    return this.examsService.approveExam(userId, examId, role);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/reject')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin reject exam' })
  rejectExam(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Param('id') examId: string,
    @Body() body: { reason?: string },
  ) {
    return this.examsService.rejectExam(userId, examId, role, body?.reason);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/duplicate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Duplicate/Fork exam to my exams' })
  duplicateExam(
    @CurrentUser('id') userId: string,
    @Param('id') examId: string,
  ) {
    return this.examsService.duplicateExam(userId, examId);
  }

  // ===========================================================================
  // EXAM ENGINE ENDPOINTS
  // ===========================================================================

  @UseGuards(JwtAuthGuard)
  @Post(':id/start')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start taking an exam (creates attempt)' })
  startExam(
    @CurrentUser('id') userId: string,
    @Param('id') examId: string,
  ) {
    return this.examsService.startExam(userId, examId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('attempts/:attemptId/submit')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit exam answers for server grading and analytics' })
  submitExam(
    @CurrentUser('id') userId: string,
    @Param('attemptId') attemptId: string,
    @Body() dto: SubmitExamAttemptDto,
  ) {
    return this.examsService.submitExam(userId, attemptId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('attempts/:attemptId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get detailed attempt results and explanation breakdown' })
  getAttemptResult(
    @CurrentUser('id') userId: string,
    @Param('attemptId') attemptId: string,
  ) {
    return this.examsService.getAttemptResult(userId, attemptId);
  }

  // ===========================================================================
  // COMMUNITY INTERACTIONS (LIKES, DISLIKES, SAVES, COMMENTS)
  // ===========================================================================

  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle like on an exam' })
  toggleLikeExam(
    @CurrentUser('id') userId: string,
    @Param('id') examId: string,
  ) {
    return this.examsService.toggleLikeExam(userId, examId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/dislike')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle dislike on an exam' })
  toggleDislikeExam(
    @CurrentUser('id') userId: string,
    @Param('id') examId: string,
  ) {
    return this.examsService.toggleDislikeExam(userId, examId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/save')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save or unsave exam to personal collection' })
  toggleSaveExam(
    @CurrentUser('id') userId: string,
    @Param('id') examId: string,
  ) {
    return this.examsService.toggleSaveExam(userId, examId);
  }

  @Public()
  @Get(':id/comments')
  @ApiOperation({ summary: 'Get exam comments and replies' })
  getExamComments(@Param('id') examId: string) {
    return this.examsService.getExamComments(examId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/comments')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a comment or reply to an exam' })
  addExamComment(
    @CurrentUser('id') userId: string,
    @Param('id') examId: string,
    @Body() body: { content: string; parentId?: string },
  ) {
    return this.examsService.addExamComment(userId, examId, body.content, body.parentId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('comments/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit own exam comment' })
  updateExamComment(
    @CurrentUser('id') userId: string,
    @Param('id') commentId: string,
    @Body() body: { content: string },
  ) {
    return this.examsService.updateExamComment(userId, commentId, body.content);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('comments/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete exam comment' })
  deleteExamComment(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Param('id') commentId: string,
  ) {
    return this.examsService.deleteExamComment(userId, commentId, role);
  }
}
