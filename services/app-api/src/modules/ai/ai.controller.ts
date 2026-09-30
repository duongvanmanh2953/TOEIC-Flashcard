import { Controller, Post, Get, Body, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
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

  @Public()
  @Get('suggestions')
  @ApiOperation({ summary: 'Smart autocomplete and cached Q&A suggestions to save API tokens' })
  getSuggestions(@Query('q') q?: string) {
    return this.aiService.getChatSuggestions(q);
  }

  @Public()
  @Get('tts')
  @ApiOperation({ summary: 'Server-side high-fidelity Neural TTS Proxy (Brian Multilingual Male Voice, +25% Speed)' })
  async textToSpeech(
    @Query('text') text: string,
    @Query('lang') lang: string = 'auto',
    @Query('voice') voice: string = 'brian',
    @Res() res: Response,
  ) {
    try {
      const clean = (text || '').trim();
      if (!clean) {
        return res.status(400).send('Text is required');
      }

      // 1. High-Fidelity Microsoft Edge Neural Multilingual Male Voice (+25% Fast Speed)
      try {
        // @ts-ignore
        const { MsEdgeTTS, OUTPUT_FORMAT } = await import('msedge-tts');
        const tts = new MsEdgeTTS();

        // en-US-BrianMultilingualNeural natively reads English and Vietnamese in a natural male voice
        // vi-VN-NamMinhNeural is gold-standard Vietnamese broadcast male voice
        const hasVi = /[àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(clean);
        const selectedVoice =
          voice === 'namminh' || (lang === 'vi' && !/[a-zA-Z]{4,}/.test(clean))
            ? 'vi-VN-NamMinhNeural'
            : 'en-US-BrianMultilingualNeural';

        await tts.setMetadata(selectedVoice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
        const { audioStream } = tts.toStream(clean, { rate: '+14%', pitch: '+0Hz' });

        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400');

        audioStream.pipe(res);
        return;
      } catch (edgeErr) {
        console.warn('Edge Neural TTS streaming error, falling back:', edgeErr);
      }

      // 2. If OpenAI API key is available, use OpenAI TTS with 'onyx' male voice at 1.14x speed
      const openaiKey = process.env.OPENAI_API_KEY?.trim();
      if (openaiKey) {
        try {
          const openAiRes = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${openaiKey}`,
            },
            body: JSON.stringify({
              model: 'tts-1',
              voice: 'onyx',
              input: clean,
              speed: 1.14,
            }),
          });

          if (openAiRes.ok) {
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            const arrayBuffer = await openAiRes.arrayBuffer();
            return res.send(Buffer.from(arrayBuffer));
          }
        } catch (_) {}
      }

      // 3. Fallback to Google TTS
      const targetLang = lang.toLowerCase().startsWith('en') ? 'en' : 'vi';
      const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(clean)}&tl=${targetLang}&client=tw-ob`;

      const response = await fetch(googleUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Referer: 'https://translate.google.com/',
        },
      });

      if (!response.ok) {
        return res.status(response.status).send('TTS upstream failure');
      }

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      const arrayBuffer = await response.arrayBuffer();
      return res.send(Buffer.from(arrayBuffer));
    } catch (err: any) {
      return res.status(500).send(err.message);
    }
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
    @Body('language') language: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.aiService.tutorChat(message, userId, contextWord, language);
  }

  @UseGuards(JwtAuthGuard)
  @Post('tutor/analyze')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Analyze AI tutor conversation and reinforce Personal Vocabulary Brain' })
  analyzeConversation(
    @CurrentUser('id') userId: string,
    @Body('messages') messages: Array<{ role: string; content: string }>,
  ) {
    return this.aiService.analyzeTutorConversation(userId, messages);
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
    @Body('mode') mode?: 'kid' | 'adult',
    @Body('language') language?: string,
  ) {
    return this.aiService.evaluatePronunciation(word, spokenText, mode, language);
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
