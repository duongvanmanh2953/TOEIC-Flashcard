import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AIService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('AI Vocabulary Assistant')
@Controller('ai')
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Public()
  @Get('semantic-search')
  @ApiOperation({ summary: 'Semantic search for vocabulary by concept or related idea' })
  semanticSearch(@Query('query') query: string) {
    return this.aiService.semanticSearch(query);
  }

  @UseGuards(JwtAuthGuard)
  @Post('pipeline')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Execute multi-tier AI pipeline (Search + Learning Engine + Router + Evaluation)' })
  pipelineQuery(
    @CurrentUser('id') userId: string,
    @Body('query') query: string,
    @Body('contextWord') contextWord?: string,
  ) {
    return this.aiService.pipelineQuery(userId, query, contextWord);
  }

  @UseGuards(JwtAuthGuard)
  @Post('explain')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request deep educational explanation of a word calibrated to user level' })
  explainWord(
    @Body('word') word: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.aiService.explainWord(word, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('generate-sentences')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate graded example sentences across CEFR levels (A2-C1)' })
  generateSentences(
    @Body('word') word: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.aiService.generateSentences(word, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('tutor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Interactive chat with AI Personal Tutor' })
  tutorChat(
    @Body('message') message: string,
    @Body('contextWord') contextWord: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.aiService.tutorChat(message, userId, contextWord);
  }

  @UseGuards(JwtAuthGuard)
  @Post('story')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a short context story containing target vocabulary words' })
  generateStory(
    @CurrentUser('id') userId: string,
    @Body('words') words: string[],
    @Body('topic') topic?: string,
  ) {
    return this.aiService.generateStory(userId, words, topic);
  }

  @UseGuards(JwtAuthGuard)
  @Post('text-to-vocab')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Analyze raw text and extract high-yield vocabulary words' })
  textToVocabulary(
    @CurrentUser('id') userId: string,
    @Body('text') text: string,
  ) {
    return this.aiService.textToVocabulary(userId, text);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sound-better')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Transform sentence into Correct, Natural, Professional, and Native-style expressions' })
  makeMeSoundBetter(
    @Body('sentence') sentence: string,
    @Body('topic') topic?: string,
  ) {
    return this.aiService.makeMeSoundBetter(sentence, topic);
  }

  @UseGuards(JwtAuthGuard)
  @Post('roleplay')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Execute multi-turn real-world simulation and roleplay conversation' })
  roleplay(
    @CurrentUser('id') userId: string,
    @Body('scenarioId') scenarioId: string,
    @Body('message') message: string,
    @Body('history') history?: Array<{ role: string; content: string }>,
  ) {
    return this.aiService.roleplayStep(userId, scenarioId, message, history);
  }

  @UseGuards(JwtAuthGuard)
  @Post('pronunciation')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Evaluate pronunciation with phoneme analysis, stress, and articulation guide' })
  evaluatePronunciation(
    @Body('word') word: string,
    @Body('spokenText') spokenText: string,
  ) {
    return this.aiService.evaluatePronunciation(word, spokenText);
  }

  @UseGuards(JwtAuthGuard)
  @Get('error-bank')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve user root-cause error bank and weakness heatmap' })
  getErrorBank(@CurrentUser('id') userId: string) {
    return this.aiService.getErrorBankAndHeatmap(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('smart-content')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Extract interactive smart transcript and practice from URL or text' })
  smartContent(@Body('source') source: string) {
    return this.aiService.smartContentExtract(source);
  }

  @UseGuards(JwtAuthGuard)
  @Get('power-score')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get holistic English Power Score (0-1000) and weekly AI coach report' })
  getPowerScore(@CurrentUser('id') userId: string) {
    return this.aiService.getEnglishPowerScoreAndReport(userId);
  }
}
