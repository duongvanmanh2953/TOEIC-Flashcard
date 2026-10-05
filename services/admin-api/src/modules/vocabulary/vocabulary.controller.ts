import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VocabularyService } from './vocabulary.service';
import { QueryVocabDto } from './dto/query-vocab.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Vocabulary')
@Controller('vocabulary')
export class VocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  @Public()
  @Get('tts')
  @ApiOperation({ summary: 'Proxy TTS audio for Vietnamese and English to ensure iOS/Safari compatibility' })
  async proxyTts(
    @Query('text') text: string,
    @Query('lang') lang: string = 'vi',
    @Res() res: Response,
  ) {
    if (!text || !text.trim()) {
      return res.status(400).send('Text parameter is required');
    }

    try {
      const cleanText = text.trim().slice(0, 300);
      let targetLang = 'en';
      if (lang && /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,4})?$/i.test(lang.trim())) {
        targetLang = lang.trim();
      }
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=${targetLang}&client=gtx`;

      const upstream = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (!upstream.ok) {
        const fallbackUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=${targetLang}&client=dict-chrome-ex`;
        const fallbackUpstream = await fetch(fallbackUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });

        if (!fallbackUpstream.ok) {
          return res.status(fallbackUpstream.status).send('Failed to fetch TTS from upstream');
        }

        const fallbackBuffer = await fallbackUpstream.arrayBuffer();
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(Buffer.from(fallbackBuffer));
      }

      const buffer = await upstream.arrayBuffer();
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(Buffer.from(buffer));
    } catch (err) {
      return res.status(500).send('Internal TTS error');
    }
  }

  @Public()
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'List and filter vocabulary with pagination and search' })
  findAll(@Query() query: QueryVocabDto, @CurrentUser('id') userId?: string) {
    return this.vocabularyService.findAll(query, userId);
  }

  @Public()
  @Get('topics')
  @ApiOperation({ summary: 'Get all vocabulary topics/categories' })
  getTopics() {
    return this.vocabularyService.getTopics();
  }

  @Public()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get detailed vocabulary record with relations and audio' })
  findOne(@Param('id') id: string, @CurrentUser('id') userId?: string) {
    return this.vocabularyService.findOne(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/favorite')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle favorite status for current user' })
  toggleFavorite(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.vocabularyService.toggleFavorite(id, userId);
  }

  // =========================================================================
  // ADMIN VOCABULARY MANAGEMENT
  // =========================================================================

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Create new vocabulary item' })
  create(@Body() body: any, @CurrentUser('id') adminId: string) {
    return this.vocabularyService.createVocabulary(body, adminId);
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Update vocabulary item' })
  update(@Param('id') id: string, @Body() body: any, @CurrentUser('id') adminId: string) {
    return this.vocabularyService.updateVocabulary(id, body, adminId);
  }

  @Delete('admin/clear-all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Clear all vocabulary or by language' })
  clearAll(@Query('languageId') languageId?: string, @CurrentUser('id') adminId?: string) {
    return this.vocabularyService.clearAll(languageId, adminId);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Delete vocabulary item' })
  delete(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.vocabularyService.deleteVocabulary(id, adminId);
  }

  @Post('admin/bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Bulk actions on vocabulary items' })
  bulkAction(@Body() body: { ids: string[]; action: string; value: any }, @CurrentUser('id') adminId: string) {
    return this.vocabularyService.bulkAction(body.ids, body.action, body.value, adminId);
  }

  @Post('admin/import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Batch import vocabulary items' })
  importBatch(@Body() body: { items: any[] }, @CurrentUser('id') adminId: string) {
    return this.vocabularyService.importBatch(body.items, adminId);
  }
}
