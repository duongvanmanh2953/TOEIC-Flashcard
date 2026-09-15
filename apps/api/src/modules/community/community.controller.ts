import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommunityService } from './community.service';
import { CreateDeckDto, CreateWordItemDto, UnlockDeckDto, SyncCloudDto } from './dto/create-deck.dto';
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
  ) {
    return this.communityService.getPublicDecks(search, category, cefrLevel);
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
}
