import { Controller, Post, Get, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { StartSessionDto } from './dto/start-session.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { BatchReviewDto } from './dto/batch-review.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Smart Review Engine')
@Controller('reviews')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('memory-rescue')
  @ApiOperation({ summary: 'Get summary of slipping vocabulary at risk of forgetting' })
  getMemoryRescueSummary(@CurrentUser('id') userId: string) {
    return this.reviewsService.getMemoryRescueSummary(userId);
  }

  @Post('memory-rescue/session')
  @ApiOperation({ summary: 'Start a targeted Memory Rescue session for slipping words' })
  startMemoryRescueSession(@CurrentUser('id') userId: string) {
    return this.reviewsService.createMemoryRescueSession(userId);
  }

  @Post('smart-session')
  @ApiOperation({ summary: 'Initialize an adaptive spaced repetition review session' })
  startSmartSession(
    @CurrentUser('id') userId: string,
    @Body() dto: StartSessionDto,
  ) {
    return this.reviewsService.createSmartSession(userId, dto);
  }

  
  @Post('batch')
  @ApiOperation({ summary: 'Atomically commit and complete a review session batch with XP & streak updates' })
  completeBatchSession(
    @CurrentUser('id') userId: string,
    @Body() dto: BatchReviewDto,
  ) {
    return this.reviewsService.completeBatchSession(userId, dto);
  }

  @Get('forgotten-words')
  @ApiOperation({ summary: 'Get paginated list of slipping/forgotten words for active user' })
  getForgottenWords(
    @CurrentUser('id') userId: string,
    @Query() query: { languageId?: string; filter?: string; sortBy?: string; page?: number; limit?: number },
  ) {
    return this.reviewsService.getForgottenWords(userId, query);
  }

  @Get(':vocabularyId/diagnostic')
  @ApiOperation({ summary: 'Get root-cause memory diagnostic and forgetting reasons for word' })
  getVocabularyDiagnostic(
    @Param('vocabularyId') vocabularyId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.reviewsService.getVocabularyDiagnostic(vocabularyId, userId);
  }

  @Post(':sessionId/answer')
  @ApiOperation({ summary: 'Submit an answer, calculate mastery score and schedule next review' })
  submitAnswer(
    @Param('sessionId') sessionId: string,
    @Body() dto: SubmitAnswerDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.reviewsService.submitAnswer(sessionId, dto, userId);
  }

  @Post(':sessionId/complete')
  @ApiOperation({ summary: 'Finish study session and calculate summary statistics' })
  completeSession(
    @Param('sessionId') sessionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.reviewsService.completeSession(sessionId, userId);
  }
}
