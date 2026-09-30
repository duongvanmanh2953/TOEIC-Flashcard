import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotesService } from './notes.service';
import {
  CreateNoteDto,
  UpdateNoteDto,
  NoteQueryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  ReorderCategoriesDto,
} from './dto/create-note.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Personal Notes & Knowledge Workspace')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  // ---------------------------------------------------------------------------
  // Category Endpoints
  // ---------------------------------------------------------------------------

  @Get('note-categories')
  @ApiOperation({ summary: 'Get user note categories with note count' })
  getCategories(@CurrentUser('id') userId: string) {
    return this.notesService.getCategories(userId);
  }

  @Post('note-categories')
  @ApiOperation({ summary: 'Create note category' })
  createCategory(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.notesService.createCategory(userId, dto);
  }

  @Patch('note-categories/reorder')
  @ApiOperation({ summary: 'Reorder categories position' })
  reorderCategories(
    @CurrentUser('id') userId: string,
    @Body() dto: ReorderCategoriesDto,
  ) {
    return this.notesService.reorderCategories(userId, dto);
  }

  @Patch('note-categories/:id')
  @ApiOperation({ summary: 'Update note category' })
  updateCategory(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.notesService.updateCategory(userId, id, dto);
  }

  @Delete('note-categories/:id')
  @ApiOperation({ summary: 'Delete note category' })
  deleteCategory(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.notesService.deleteCategory(userId, id);
  }

  // ---------------------------------------------------------------------------
  // Note Endpoints
  // ---------------------------------------------------------------------------

  @Get('notes/count')
  @ApiOperation({ summary: 'Get cached notes count and summary for header badge' })
  getNotesCount(@CurrentUser('id') userId: string) {
    return this.notesService.getNotesOverviewCount(userId);
  }

  @Get('notes')
  @ApiOperation({ summary: 'List notes with cursor pagination and search' })
  getNotes(
    @CurrentUser('id') userId: string,
    @Query() query: NoteQueryDto,
  ) {
    return this.notesService.getNotes(userId, query);
  }

  @Post('notes')
  @ApiOperation({ summary: 'Create a new personal note' })
  createNote(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateNoteDto,
  ) {
    return this.notesService.createNote(userId, dto);
  }

  @Get('notes/:id')
  @ApiOperation({ summary: 'Get single note detail with full rich text content' })
  getNoteById(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.notesService.getNoteById(userId, id);
  }

  @Patch('notes/:id')
  @ApiOperation({ summary: 'Update note' })
  updateNote(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateNoteDto,
  ) {
    return this.notesService.updateNote(userId, id, dto);
  }

  @Delete('notes/:id')
  @ApiOperation({ summary: 'Soft delete note' })
  deleteNote(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.notesService.deleteNote(userId, id);
  }

  @Post('notes/:id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted note' })
  restoreNote(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.notesService.restoreNote(userId, id);
  }
}
