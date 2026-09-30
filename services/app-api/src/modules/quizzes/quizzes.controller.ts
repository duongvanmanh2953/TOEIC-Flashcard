import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QuizzesService, GenerateQuizDto } from './quizzes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Auto Quiz & Test Generator')
@Controller('quizzes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Auto-generate a personalized quiz from Favorites, Weak Words, or Community Deck' })
  generateQuiz(@CurrentUser('id') userId: string, @Body() dto: GenerateQuizDto) {
    return this.quizzesService.generateQuiz(userId, dto);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit answers for custom quiz and compute accuracy and XP' })
  submitQuiz(
    @Param('id') quizId: string,
    @CurrentUser('id') userId: string,
    @Body('answers') answers: Record<string, string>,
    @Body('responseTimeMs') responseTimeMs: number,
  ) {
    return this.quizzesService.submitQuiz(quizId, userId, answers, responseTimeMs);
  }
}
