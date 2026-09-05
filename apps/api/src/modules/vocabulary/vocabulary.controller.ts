import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VocabularyService } from './vocabulary.service';
import { QueryVocabDto } from './dto/query-vocab.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Vocabulary')
@Controller('vocabulary')
export class VocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

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
}
