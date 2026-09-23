import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommunityService } from './community.service';
import {
  CreateDeckDto,
  CreateWordItemDto,
  UnlockDeckDto,
  SyncCloudDto,
  UpdateDeckDto,
  UpdateWordItemDto,
  BulkDeleteDto,
} from './dto/create-deck.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CefrLevel } from '@prisma/client';

@ApiTags('Personal & Community Word Bank')
@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Public()
  @Get('decks')
  @ApiOperation({ summary: 'Browse all public approved community vocabulary decks' })
  getDecks(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('cefrLevel') cefrLevel?: CefrLevel,
    @CurrentUser('id') userId?: string,
  ) {
    return this.communityService.getPublicDecks(search, category, cefrLevel, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-decks')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user personal decks with pending/approved/rejected status' })
  getMyDecks(@CurrentUser('id') userId: string) {
    return this.communityService.getMyDecks(userId);
  }

  @Public()
  @Get('decks/:id')
  @ApiOperation({ summary: 'Get details and word list of a community deck' })
  getDeckDetails(@Param('id') id: string) {
    return this.communityService.getDeckDetails(id);
  }

  @Public()
  @Post('decks/:id/unlock')
  @ApiOperation({ summary: 'Unlock a protected community deck using its password' })
  unlockDeck(@Param('id') id: string, @Body() dto: UnlockDeckDto) {
    return this.communityService.unlockDeck(id, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Post('decks')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new personal deck and optionally share to community' })
  createDeck(@CurrentUser('id') userId: string, @Body() dto: CreateDeckDto) {
    return this.communityService.createDeck(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('decks/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update personal deck title, description, category, privacy, or password' })
  updateDeck(
    @CurrentUser('id') userId: string,
    @Param('id') deckId: string,
    @Body() dto: UpdateDeckDto,
  ) {
    return this.communityService.updateDeck(userId, deckId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('decks/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a personal deck and all its words' })
  deleteDeck(
    @CurrentUser('id') userId: string,
    @Param('id') deckId: string,
  ) {
    return this.communityService.deleteDeck(userId, deckId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('decks/bulk-delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk delete multiple personal decks' })
  bulkDeleteDecks(
    @CurrentUser('id') userId: string,
    @Body() dto: BulkDeleteDto,
  ) {
    return this.communityService.bulkDeleteDecks(userId, dto.ids);
  }

  @UseGuards(JwtAuthGuard)
  @Post('decks/:id/words')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a word to a personal deck' })
  addWordToDeck(
    @CurrentUser('id') userId: string,
    @Param('id') deckId: string,
    @Body() dto: CreateWordItemDto,
  ) {
    return this.communityService.addWordToDeck(userId, deckId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('decks/:id/words/:wordId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a word inside a personal deck' })
  updateWordInDeck(
    @CurrentUser('id') userId: string,
    @Param('id') deckId: string,
    @Param('wordId') wordId: string,
    @Body() dto: UpdateWordItemDto,
  ) {
    return this.communityService.updateWordInDeck(userId, deckId, wordId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('decks/:id/words/:wordId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a word from a personal deck' })
  deleteWordFromDeck(
    @CurrentUser('id') userId: string,
    @Param('id') deckId: string,
    @Param('wordId') wordId: string,
  ) {
    return this.communityService.deleteWordFromDeck(userId, deckId, wordId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('decks/:id/words/bulk-delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk delete multiple words from a personal deck' })
  bulkDeleteWordsFromDeck(
    @CurrentUser('id') userId: string,
    @Param('id') deckId: string,
    @Body() dto: BulkDeleteDto,
  ) {
    return this.communityService.bulkDeleteWordsFromDeck(userId, deckId, dto.ids);
  }

  @UseGuards(JwtAuthGuard)
  @Post('decks/:id/clone')
  @ApiBearerAuth()
  @ApiOperation({ summary: '1-click Clone/Fork community deck into personal review bank' })
  cloneDeck(
    @CurrentUser('id') userId: string,
    @Param('id') deckId: string,
    @Body() body?: { password?: string },
  ) {
    return this.communityService.cloneDeck(userId, deckId, body?.password);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sync-cloud')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync offline/IndexedDB word bank and decks to cloud (VIP Plus/Pro)' })
  syncCloud(@CurrentUser('id') userId: string, @Body() dto: SyncCloudDto) {
    return this.communityService.syncCloud(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('words/quick-add')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Quick add a custom word to personal bank' })
  quickAddWord(@CurrentUser('id') userId: string, @Body() dto: CreateWordItemDto) {
    return this.communityService.quickAddWord(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('words/batch-add')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Batch import custom words from Excel/CSV' })
  batchAddWords(@CurrentUser('id') userId: string, @Body() body: { words: CreateWordItemDto[] }) {
    return this.communityService.batchAddWords(userId, body.words);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-words')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get personal word bank categorized by status' })
  getMyWords(@CurrentUser('id') userId: string, @Query('filter') filter?: string) {
    return this.communityService.getMyWords(userId, filter);
  }

  @UseGuards(JwtAuthGuard)
  @Post('words/:id/favorite')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle favorite status for personal word' })
  toggleWordFavorite(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.communityService.toggleWordFavorite(userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('words/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a single word from personal bank' })
  deleteUserWord(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.communityService.deleteUserWord(userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('words/bulk-delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk delete multiple words from personal bank' })
  bulkDeleteUserWords(
    @CurrentUser('id') userId: string,
    @Body() dto: BulkDeleteDto,
  ) {
    return this.communityService.bulkDeleteUserWords(userId, dto.ids);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('my-words/clear')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clear all personal word bank data and decks' })
  clearAllMyWords(@CurrentUser('id') userId: string) {
    return this.communityService.clearAllMyWords(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('decks/:id/like')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle like on a community vocabulary deck' })
  toggleLikeDeck(@CurrentUser('id') userId: string, @Param('id') deckId: string) {
    return this.communityService.toggleLikeDeck(userId, deckId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('decks/:id/dislike')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle dislike on a community vocabulary deck' })
  toggleDislikeDeck(@CurrentUser('id') userId: string, @Param('id') deckId: string) {
    return this.communityService.toggleDislikeDeck(userId, deckId);
  }

  @Public()
  @Get('decks/:id/comments')
  @ApiOperation({ summary: 'Get comments and nested replies of a community deck' })
  getDeckComments(@Param('id') deckId: string) {
    return this.communityService.getDeckComments(deckId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('decks/:id/comments')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a comment or reply to a community deck' })
  addDeckComment(
    @CurrentUser('id') userId: string,
    @Param('id') deckId: string,
    @Body() body: { content: string; parentId?: string },
  ) {
    return this.communityService.addDeckComment(userId, deckId, body.content, body.parentId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('comments/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit own comment' })
  updateDeckComment(
    @CurrentUser('id') userId: string,
    @Param('id') commentId: string,
    @Body() body: { content: string },
  ) {
    return this.communityService.updateDeckComment(userId, commentId, body.content);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('comments/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete comment (author or admin)' })
  deleteDeckComment(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Param('id') commentId: string,
  ) {
    return this.communityService.deleteDeckComment(userId, commentId, role);
  }
}

