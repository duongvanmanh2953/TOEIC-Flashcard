import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { StartSessionDto } from './dto/start-session.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Smart Review Engine')
@Controller('reviews')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('smart-session')
  @ApiOperation({ summary: 'Initialize an adaptive spaced repetition review session' })
  startSmartSession(
    @CurrentUser('id') userId: string,
    @Body() dto: StartSessionDto,
  ) {
    return this.reviewsService.createSmartSession(userId, dto);
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
