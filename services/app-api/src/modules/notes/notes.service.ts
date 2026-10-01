import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
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
import { Prisma, Role, SubscriptionTier } from '@prisma/client';

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
        sourceType: true,
        sourceId: true,
        sourceTitle: true,
        sourceUrl: true,
        questionId: true,
        selectedText: true,
        context: true,
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

  // ===========================================================================
  // NOTE LIMIT RESOLUTION & USAGE
  // ===========================================================================

  async getNoteLimit(userId: string): Promise<number> {
    const cacheKey = `user:${userId}:note-limit`;
    const cached = await this.cache.get<number>(cacheKey);
    if (cached !== null && cached !== undefined) return cached;

    // 1. Check user role: Admin / SuperAdmin / Premium user = unlimited (-1)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (
      user?.role === Role.ADMIN ||
      user?.role === Role.SUPER_ADMIN ||
      user?.role === Role.PREMIUM_USER
    ) {
      await this.cache.set(cacheKey, -1, 300);
      return -1;
    }

    // 2. Check active subscription plan
    const activeSub = await this.prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });

    if (activeSub?.plan) {
      if (activeSub.plan.tier === SubscriptionTier.PRO) {
        await this.cache.set(cacheKey, -1, 300);
        return -1;
      }
      const planLimits = activeSub.plan.limits as Record<string, any> | null;
      if (planLimits?.notes !== undefined && !isNaN(Number(planLimits.notes))) {
        const val = Number(planLimits.notes);
        await this.cache.set(cacheKey, val, 300);
        return val;
      }
    }

    // 3. Fallback to SystemConfig FREE_NOTES_LIMIT (or default 20)
    try {
      const config = await this.prisma.systemConfig.findUnique({
        where: { key: 'FREE_NOTES_LIMIT' },
      });
      if (config && !isNaN(Number(config.value))) {
        const val = Number(config.value);
        await this.cache.set(cacheKey, val, 300);
        return val;
      }
    } catch {
      // Ignored
    }

    await this.cache.set(cacheKey, 20, 300);
    return 20;
  }

  async getNotesUsage(userId: string) {
    const limit = await this.getNoteLimit(userId);
    const used = await this.prisma.note.count({
      where: { userId, isDeleted: false },
    });
    const unlimited = limit === -1;
    const remaining = unlimited ? 999999 : Math.max(0, limit - used);

    return {
      feature: 'notes',
      used,
      limit,
      remaining,
      unlimited,
    };
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

    // 1. Prevent duplicate note from the same source & text (Prompt XV)
    if (dto.sourceType && dto.sourceId && dto.selectedText) {
      const existing = await this.prisma.note.findFirst({
        where: {
          userId,
          isDeleted: false,
          sourceType: dto.sourceType,
          sourceId: dto.sourceId,
          selectedText: dto.selectedText.trim(),
        },
      });

      if (existing) {
        throw new ConflictException({
          statusCode: 409,
          code: 'NOTE_ALREADY_EXISTS',
          message: 'Đoạn trích này đã tồn tại trong ghi chú của bạn',
          noteId: existing.id,
          note: existing,
        });
      }
    }

    const limit = await this.getNoteLimit(userId);
    const sanitizedContent = ContentSanitizer.sanitizeHtml(dto.content || '');
    const plainTextPreview = ContentSanitizer.createPlainTextPreview(sanitizedContent, 240);
    const normalizedTags = ContentSanitizer.normalizeTags(dto.tags);

    // 2. Concurrency / Race Condition Protection using database transaction (Prompt XXII)
    const note = await this.prisma.$transaction(async (tx) => {
      if (limit !== -1) {
        const count = await tx.note.count({
          where: { userId, isDeleted: false },
        });

        if (count >= limit) {
          throw new ConflictException({
            statusCode: 409,
            code: 'NOTE_LIMIT_REACHED',
            limit,
            used: count,
            message: `Bạn đã đạt giới hạn ghi chú tối đa (${count}/${limit}). Vui lòng nâng cấp gói để lưu thêm ghi chú.`,
          });
        }
      }

      return tx.note.create({
        data: {
          userId,
          title: dto.title.trim(),
          content: sanitizedContent,
          plainTextPreview,
          categoryId: dto.categoryId || null,
          tags: normalizedTags,
          isPinned: dto.isPinned ?? false,
          sourceType: dto.sourceType || null,
          sourceId: dto.sourceId || null,
          sourceTitle: dto.sourceTitle || null,
          sourceUrl: dto.sourceUrl || null,
          questionId: dto.questionId || null,
          selectedText: dto.selectedText ? dto.selectedText.trim() : null,
          context: dto.context ? dto.context.trim() : null,
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

  public async invalidateUserNotesCache(userId: string) {
    await this.cache.del(`user:${userId}:note-categories`);
    await this.cache.del(`user:${userId}:notes:overview`);
    await this.cache.del(`user:${userId}:note-limit`);
    await this.cache.delPattern(`user:${userId}:notes:*`);
  }
}
