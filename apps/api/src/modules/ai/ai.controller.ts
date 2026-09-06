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
}
