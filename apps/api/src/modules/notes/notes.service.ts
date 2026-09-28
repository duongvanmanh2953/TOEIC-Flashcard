import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisCacheService } from '../../common/cache/redis-cache.service';
import { ContentSanitizer } from '../../common/utils/sanitizer.util';
import {
  CreateNoteDto,
  UpdateNoteDto,
  NoteQueryDto,
  NoteSortBy,
  CreateCategoryDto,
  UpdateCategoryDto,
  ReorderCategoriesDto,
} from './dto/create-note.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
  ) {}

  // ===========================================================================
  // CATEGORIES
  // ===========================================================================

  async getCategories(userId: string) {
    const cacheKey = `user:${userId}:note-categories`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const categories = await this.prisma.noteCategory.findMany({
      where: {
        userId,
        isArchived: false,
      },
      orderBy: [
        { position: 'asc' },
        { createdAt: 'asc' },
      ],
      include: {
        _count: {
          select: {
            notes: {
              where: {
                isDeleted: false,
                isArchived: false,
              },
            },
          },
        },
      },
    });

    const result = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      color: cat.color,
      icon: cat.icon,
      position: cat.position,
      isArchived: cat.isArchived,
      noteCount: cat._count.notes,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    }));

    await this.cache.set(cacheKey, result, 600); // 10 minutes
    return result;
  }

  async createCategory(userId: string, dto: CreateCategoryDto) {
    // Get highest position
    let position = dto.position;
    if (position === undefined) {
      const highest = await this.prisma.noteCategory.findFirst({
        where: { userId },
        orderBy: { position: 'desc' },
        select: { position: true },
      });
      position = (highest?.position ?? -1) + 1;
    }

    const category = await this.prisma.noteCategory.create({
      data: {
        userId,
        name: dto.name.trim(),
        description: dto.description?.trim(),
        color: dto.color || '#6366f1',
        icon: dto.icon || 'Folder',
        position,
      },
    });

    await this.invalidateUserNotesCache(userId);
    return category;
  }

  async updateCategory(userId: string, id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.noteCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Note category not found');
    }
    if (category.userId !== userId) {
      throw new ForbiddenException('You do not own this category');
    }

    const updated = await this.prisma.noteCategory.update({
      where: { id },
      data: {
        name: dto.name !== undefined ? dto.name.trim() : undefined,
        description: dto.description !== undefined ? dto.description.trim() : undefined,
        color: dto.color !== undefined ? dto.color : undefined,
        icon: dto.icon !== undefined ? dto.icon : undefined,
        position: dto.position !== undefined ? dto.position : undefined,
        isArchived: dto.isArchived !== undefined ? dto.isArchived : undefined,
      },
    });

    await this.invalidateUserNotesCache(userId);
    return updated;
  }

  async deleteCategory(userId: string, id: string) {
    const category = await this.prisma.noteCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Note category not found');
    }
    if (category.userId !== userId) {
      throw new ForbiddenException('You do not own this category');
    }

    // Unassign notes in this category before deleting
    await this.prisma.note.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });

    await this.prisma.noteCategory.delete({
      where: { id },
    });

    await this.invalidateUserNotesCache(userId);
    return { success: true, message: 'Category deleted' };
  }

  async reorderCategories(userId: string, dto: ReorderCategoriesDto) {
    const updates = dto.orderedIds.map((id, index) =>
      this.prisma.noteCategory.updateMany({
        where: { id, userId },
        data: { position: index },
      }),
    );

    await this.prisma.$transaction(updates);
    await this.invalidateUserNotesCache(userId);
    return { success: true };
  }

  // ===========================================================================
  // NOTES CRUD & HIGH-PERFORMANCE CURSOR PAGINATION
  // ===========================================================================

  async getNotes(userId: string, query: NoteQueryDto) {
    const limit = query.limit || 30;
    const isArchived = query.isArchived === true;

    const where: Prisma.NoteWhereInput = {
      userId,
      isDeleted: false,
      isArchived,
    };

    if (query.categoryId) {
      if (query.categoryId === 'uncategorized') {
        where.categoryId = null;
      } else {
        where.categoryId = query.categoryId;
      }
    }

    if (query.isPinned !== undefined) {
      where.isPinned = query.isPinned;
    }

    if (query.tag) {
      where.tags = { has: query.tag.toLowerCase().trim() };
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { plainTextPreview: { contains: term, mode: 'insensitive' } },
        { tags: { has: term.toLowerCase() } },
      ];
    }

    // Determine sort order
    let orderBy: Prisma.NoteOrderByWithRelationInput[] = [];
    if (where.isPinned === undefined) {
      // Keep pinned notes at the top if not explicitly filtering pinned
      orderBy.push({ isPinned: 'desc' });
    }

    switch (query.sortBy) {
      case NoteSortBy.OLDEST:
        orderBy.push({ createdAt: 'asc' });
        break;
      case NoteSortBy.UPDATED:
        orderBy.push({ updatedAt: 'desc' });
        break;
      case NoteSortBy.TITLE:
        orderBy.push({ title: 'asc' });
        break;
      case NoteSortBy.LATEST:
      default:
        orderBy.push({ createdAt: 'desc' });
        break;
    }

    // Pagination query setup
    const findArgs: Prisma.NoteFindManyArgs = {
      where,
      orderBy,
      take: limit + 1, // Fetch 1 extra to check for next page
      select: {
        id: true,
        title: true,
        plainTextPreview: true,
        categoryId: true,
        tags: true,
        isPinned: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
    };

    if (query.cursor) {
      findArgs.cursor = { id: query.cursor };
      findArgs.skip = 1;
    }

    const items = await this.prisma.note.findMany(findArgs);

    let nextCursor: string | null = null;
    let hasMore = false;

    if (items.length > limit) {
      hasMore = true;
      const nextItem = items.pop();
      nextCursor = nextItem ? nextItem.id : null;
    }

    return {
      items,
      nextCursor,
      hasMore,
      limit,
    };
  }

  async getNoteById(userId: string, id: string) {
    const note = await this.prisma.note.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
    });

    if (!note || note.isDeleted) {
      throw new NotFoundException('Note not found');
    }
    if (note.userId !== userId) {
      throw new ForbiddenException('You do not own this note');
    }

    return note;
  }

  async createNote(userId: string, dto: CreateNoteDto) {
    if (dto.categoryId) {
      const cat = await this.prisma.noteCategory.findUnique({
        where: { id: dto.categoryId },
      });
      if (!cat || cat.userId !== userId) {
        throw new BadRequestException('Invalid category specified');
      }
    }

    const sanitizedContent = ContentSanitizer.sanitizeHtml(dto.content || '');
    const plainTextPreview = ContentSanitizer.createPlainTextPreview(sanitizedContent, 240);
    const normalizedTags = ContentSanitizer.normalizeTags(dto.tags);

    const note = await this.prisma.note.create({
      data: {
        userId,
        title: dto.title.trim(),
        content: sanitizedContent,
        plainTextPreview,
        categoryId: dto.categoryId || null,
        tags: normalizedTags,
        isPinned: dto.isPinned ?? false,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
    });

    await this.invalidateUserNotesCache(userId);
    return note;
  }

  async updateNote(userId: string, id: string, dto: UpdateNoteDto) {
    const note = await this.prisma.note.findUnique({
      where: { id },
    });

    if (!note || note.isDeleted) {
      throw new NotFoundException('Note not found');
    }
    if (note.userId !== userId) {
      throw new ForbiddenException('You do not own this note');
    }

    if (dto.categoryId && dto.categoryId !== note.categoryId) {
      const cat = await this.prisma.noteCategory.findUnique({
        where: { id: dto.categoryId },
      });
      if (!cat || cat.userId !== userId) {
        throw new BadRequestException('Invalid category specified');
      }
    }

    const data: Prisma.NoteUpdateInput = {};

    if (dto.title !== undefined) {
      data.title = dto.title.trim();
    }

    if (dto.content !== undefined) {
      data.content = ContentSanitizer.sanitizeHtml(dto.content);
      data.plainTextPreview = ContentSanitizer.createPlainTextPreview(data.content as string, 240);
    }

    if (dto.categoryId !== undefined) {
      data.category = dto.categoryId ? { connect: { id: dto.categoryId } } : { disconnect: true };
    }

    if (dto.tags !== undefined) {
      data.tags = ContentSanitizer.normalizeTags(dto.tags);
    }

    if (dto.isPinned !== undefined) {
      data.isPinned = dto.isPinned;
    }

    if (dto.isArchived !== undefined) {
      data.isArchived = dto.isArchived;
    }

    const updated = await this.prisma.note.update({
      where: { id },
      data,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
    });

    await this.invalidateUserNotesCache(userId);
    return updated;
  }

  async deleteNote(userId: string, id: string) {
    const note = await this.prisma.note.findUnique({
      where: { id },
    });

    if (!note || note.isDeleted) {
      throw new NotFoundException('Note not found');
    }
    if (note.userId !== userId) {
      throw new ForbiddenException('You do not own this note');
    }

    // Soft delete
    await this.prisma.note.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    await this.invalidateUserNotesCache(userId);
    return { success: true, message: 'Note deleted' };
  }

  async restoreNote(userId: string, id: string) {
    const note = await this.prisma.note.findUnique({
      where: { id },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }
    if (note.userId !== userId) {
      throw new ForbiddenException('You do not own this note');
    }

    const restored = await this.prisma.note.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });

    await this.invalidateUserNotesCache(userId);
    return restored;
  }

  // ===========================================================================
  // COUNTERS & OVERVIEW (CACHED)
  // ===========================================================================

  async getNotesOverviewCount(userId: string) {
    const cacheKey = `user:${userId}:notes:overview`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const [totalNotes, activeNotes, archivedNotes, categoriesCount] = await Promise.all([
      this.prisma.note.count({
        where: { userId, isDeleted: false },
      }),
      this.prisma.note.count({
        where: { userId, isDeleted: false, isArchived: false },
      }),
      this.prisma.note.count({
        where: { userId, isDeleted: false, isArchived: true },
      }),
      this.prisma.noteCategory.count({
        where: { userId, isArchived: false },
      }),
    ]);

    const result = {
      totalNotes,
      activeNotes,
      archivedNotes,
      categoriesCount,
    };

    await this.cache.set(cacheKey, result, 300); // 5 min
    return result;
  }

  private async invalidateUserNotesCache(userId: string) {
    await this.cache.del(`user:${userId}:note-categories`);
    await this.cache.del(`user:${userId}:notes:overview`);
    await this.cache.delPattern(`user:${userId}:notes:*`);
  }
}
