import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
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
