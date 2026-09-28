import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MemoryEngineService } from './memory-engine.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Personal Vocabulary Memory Engine')
@Controller('vocabulary')
export class MemoryEngineController {
  constructor(private readonly memoryEngineService: MemoryEngineService) {}

  @UseGuards(JwtAuthGuard)
  @Get('x-ray')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get full Vocabulary X-Ray telemetry & quality breakdown' })
  getXRay(@CurrentUser('id') userId: string) {
    return this.memoryEngineService.getVocabularyXRay(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/diagnostic')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Why am I bad at this word? Root-cause weakness & Word Journey timeline' })
  getDiagnostic(
    @Param('id') wordId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.memoryEngineService.getWordDiagnosticAndJourney(wordId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('capture/analyze')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Capture real-world text: extract vocabulary, filter known words, contextualize' })
  analyzeCaptureText(
    @CurrentUser('id') userId: string,
    @Body('text') text: string,
    @Body('sourceTitle') sourceTitle?: string,
  ) {
    return this.memoryEngineService.captureAndAnalyzeText(userId, text, sourceTitle);
  }

  @UseGuards(JwtAuthGuard)
  @Post('capture/save')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Connect captured words to Personal Vocabulary Brain & Smart Review' })
  saveCapturedVocabulary(
    @CurrentUser('id') userId: string,
    @Body()
    payload: {
      sourceTitle?: string;
      rawText: string;
      words: Array<{
        word: string;
        contextSentence?: string;
        contextMeaning?: string;
        cefrLevel?: any;
        collocations?: string[];
      }>;
    },
  ) {
    return this.memoryEngineService.saveCapturedVocabulary(userId, payload);
  }

  @UseGuards(JwtAuthGuard)
  @Get('smart-queue')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Categorized Smart Review Queue & Micro-learning packages' })
  getSmartQueue(@CurrentUser('id') userId: string) {
    return this.memoryEngineService.getSmartReviewQueue(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('production-practice')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Use It or Lose It: Evaluate sentence production & reinforce memory model' })
  evaluateProductionPractice(
    @CurrentUser('id') userId: string,
    @Body()
    body: {
      vocabularyId: string;
      userSentence: string;
      exerciseType: 'CREATE_SENTENCE' | 'FILL_BLANK' | 'COLLOCATION_PICK';
    },
  ) {
    return this.memoryEngineService.evaluateProductionExercise(userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('confusion-pairs')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get words frequently confused & targeted comparison guides' })
  getConfusionPairs(@CurrentUser('id') userId: string) {
    return this.memoryEngineService.getConfusionEngineData(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('learning-goal')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set learner primary and secondary mission goals' })
  updateLearningGoal(
    @CurrentUser('id') userId: string,
    @Body('primaryGoal') primaryGoal: string,
    @Body('secondaryGoal') secondaryGoal?: string,
  ) {
    return this.memoryEngineService.updateLearningGoal(userId, primaryGoal, secondaryGoal);
  }
}
