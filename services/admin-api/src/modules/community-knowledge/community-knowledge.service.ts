import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisCacheService } from '../../common/cache/redis-cache.service';
import { ContentSanitizer } from '../../common/utils/sanitizer.util';
import {
  CreateCommunityPostDto,
  UpdateCommunityPostDto,
  CommunityPostQueryDto,
  CommunitySortBy,
  ReactionDto,
  CreateCommentDto,
  UpdateCommentDto,
  CommentQueryDto,
  RejectPostDto,
  CreateTopicDto,
  UpdateTopicDto,
} from './dto/community-post.dto';
import {
  Prisma,
  CommunityPostStatus,
  CommunityReactionType,
  CommunityCommentStatus,
  Role,
} from '@prisma/client';

@Injectable()
export class CommunityKnowledgeService {
  private readonly logger = new Logger(CommunityKnowledgeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
  ) {}

  // ===========================================================================
  // TOPICS
  // ===========================================================================

  async getTopics() {
    const cacheKey = 'community:topics:list';
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const topics = await this.prisma.communityTopic.findMany({
      where: { isActive: true },
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: {
            posts: {
              where: {
                status: CommunityPostStatus.APPROVED,
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    const result = topics.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      description: t.description,
      icon: t.icon,
      color: t.color,
      position: t.position,
      postCount: t._count.posts,
    }));

    await this.cache.set(cacheKey, result, 600); // 10 minutes
    return result;
  }

  async createTopic(dto: CreateTopicDto) {
    const topic = await this.prisma.communityTopic.create({
      data: {
        name: dto.name.trim(),
        slug: dto.slug.toLowerCase().trim(),
        description: dto.description?.trim(),
        icon: dto.icon || 'BookOpen',
        color: dto.color || '#4f46e5',
        position: dto.position ?? 0,
      },
    });

    await this.cache.del('community:topics:list');
    return topic;
  }

  async updateTopic(id: string, dto: UpdateTopicDto) {
    const updated = await this.prisma.communityTopic.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        description: dto.description?.trim(),
        icon: dto.icon,
        color: dto.color,
        position: dto.position,
        isActive: dto.isActive,
      },
    });

    await this.cache.del('community:topics:list');
    return updated;
  }

  async deleteTopic(id: string) {
    await this.prisma.communityTopic.delete({
      where: { id },
    });

    await this.cache.del('community:topics:list');
    return { success: true };
  }

  // ===========================================================================
  // COMMUNITY FEED & CURSOR-BASED PAGINATION
  // ===========================================================================

  async getFeed(query: CommunityPostQueryDto, currentUserId?: string) {
    const limit = query.limit || 20;

    const where: Prisma.CommunityPostWhereInput = {
      status: CommunityPostStatus.APPROVED,
      deletedAt: null,
    };

    if (query.topicId) {
      where.topicId = query.topicId;
    }

    if (query.tag) {
      where.tags = { has: query.tag.toLowerCase().trim() };
    }

    if (query.language) {
      where.language = query.language;
    }

    if (query.authorId) {
      where.authorId = query.authorId;
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { summary: { contains: term, mode: 'insensitive' } },
        { tags: { has: term.toLowerCase() } },
      ];
    }

    // Determine ordering
    let orderBy: Prisma.CommunityPostOrderByWithRelationInput[] = [];
    switch (query.sortBy) {
      case CommunitySortBy.POPULAR:
        orderBy = [{ likeCount: 'desc' }, { createdAt: 'desc' }];
        break;
      case CommunitySortBy.TRENDING:
        orderBy = [{ commentCount: 'desc' }, { likeCount: 'desc' }, { createdAt: 'desc' }];
        break;
      case CommunitySortBy.MOST_DISCUSSED:
        orderBy = [{ commentCount: 'desc' }, { createdAt: 'desc' }];
        break;
      case CommunitySortBy.MOST_SAVED:
        orderBy = [{ saveCount: 'desc' }, { createdAt: 'desc' }];
        break;
      case CommunitySortBy.OLDEST:
        orderBy = [{ createdAt: 'asc' }];
        break;
      case CommunitySortBy.LATEST:
      default:
        orderBy = [{ createdAt: 'desc' }];
        break;
    }

    const posts = await this.prisma.communityPost.findMany({
      where,
      orderBy,
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      select: {
        id: true,
        title: true,
        summary: true,
        tags: true,
        language: true,
        status: true,
        likeCount: true,
        dislikeCount: true,
        commentCount: true,
        shareCount: true,
        saveCount: true,
        viewCount: true,
        qualityScore: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
            role: true,
          },
        },
        topic: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
            icon: true,
          },
        },
      },
    });

    let nextCursor: string | null = null;
    let hasMore = false;

    if (posts.length > limit) {
      hasMore = true;
      const nextItem = posts.pop();
      nextCursor = nextItem ? nextItem.id : null;
    }

    // Attach current user's reaction & save status in batch if logged in
    let userReactionsMap = new Map<string, string>();
    let userSavesSet = new Set<string>();

    if (currentUserId && posts.length > 0) {
      const postIds = posts.map((p) => p.id);
      const [reactions, saves] = await Promise.all([
        this.prisma.communityPostReaction.findMany({
          where: {
            userId: currentUserId,
            postId: { in: postIds },
          },
          select: { postId: true, type: true },
        }),
        this.prisma.communityPostSave.findMany({
          where: {
            userId: currentUserId,
            postId: { in: postIds },
          },
          select: { postId: true },
        }),
      ]);

      reactions.forEach((r) => userReactionsMap.set(r.postId, r.type));
      saves.forEach((s) => userSavesSet.add(s.postId));
    }

    const enrichedItems = posts.map((p) => ({
      ...p,
      userReaction: userReactionsMap.get(p.id) || null,
      isSaved: userSavesSet.has(p.id),
    }));

    return {
      items: enrichedItems,
      nextCursor,
      hasMore,
      limit,
    };
  }

  // ===========================================================================
  // POST DETAIL (FULL CONTENT & INCREMENT VIEWS)
  // ===========================================================================

  async getPostById(id: string, currentUserId?: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
            role: true,
          },
        },
        topic: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
            icon: true,
          },
        },
      },
    });

    if (!post || post.deletedAt) {
      throw new NotFoundException('Knowledge post not found');
    }

    // Check visibility if not approved
    if (post.status !== CommunityPostStatus.APPROVED) {
      if (!currentUserId || (post.authorId !== currentUserId)) {
        // Allow admin/moderators to view pending/rejected
        const user = currentUserId
          ? await this.prisma.user.findUnique({ where: { id: currentUserId }, select: { role: true } })
          : null;
        if (!user || !([Role.ADMIN, Role.SUPER_ADMIN, Role.MODERATOR] as Role[]).includes(user.role)) {
          throw new ForbiddenException('This post is pending review or not public');
        }
      }
    }

    // Increment viewCount asynchronously
    this.prisma.communityPost
      .update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      })
      .catch((err) => this.logger.warn(`Could not increment view count for post ${id}: ${err.message}`));

    let userReaction: string | null = null;
    let isSaved = false;

    if (currentUserId) {
      const [reaction, save] = await Promise.all([
        this.prisma.communityPostReaction.findUnique({
          where: { userId_postId: { userId: currentUserId, postId: id } },
          select: { type: true },
        }),
        this.prisma.communityPostSave.findUnique({
          where: { userId_postId: { userId: currentUserId, postId: id } },
          select: { id: true },
        }),
      ]);

      if (reaction) userReaction = reaction.type;
      if (save) isSaved = true;
    }

    return {
      ...post,
      userReaction,
      isSaved,
    };
  }

  // ===========================================================================
  // CREATE / EDIT / DELETE POSTS
  // ===========================================================================

  async createPost(authorId: string, dto: CreateCommunityPostDto) {
    if (dto.topicId) {
      const topic = await this.prisma.communityTopic.findUnique({
        where: { id: dto.topicId },
      });
      if (!topic) {
        throw new BadRequestException('Invalid topic specified');
      }
    }

    const sanitizedContent = ContentSanitizer.sanitizeHtml(dto.content);
    const summary = ContentSanitizer.createPlainTextPreview(sanitizedContent, 240);
    const normalizedTags = ContentSanitizer.normalizeTags(dto.tags);

    const status = dto.isDraft
      ? CommunityPostStatus.DRAFT
      : CommunityPostStatus.PENDING_REVIEW;

    const post = await this.prisma.communityPost.create({
      data: {
        authorId,
        title: dto.title.trim(),
        content: sanitizedContent,
        summary,
        topicId: dto.topicId || null,
        tags: normalizedTags,
        language: dto.language || 'en',
        status,
        isTrainingEligible: true,
        qualityScore: 1.0,
      },
      include: {
        topic: true,
        author: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    await this.cache.del('admin:community:pending-count');
    return post;
  }

  async updatePost(authorId: string, id: string, dto: UpdateCommunityPostDto) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id },
    });

    if (!post || post.deletedAt) {
      throw new NotFoundException('Knowledge post not found');
    }
    if (post.authorId !== authorId) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    const data: Prisma.CommunityPostUpdateInput = {};

    if (dto.title !== undefined) {
      data.title = dto.title.trim();
    }

    if (dto.content !== undefined) {
      const cleanContent = ContentSanitizer.sanitizeHtml(dto.content);
      data.content = cleanContent;
      data.summary = ContentSanitizer.createPlainTextPreview(cleanContent, 240);
    }

    if (dto.topicId !== undefined) {
      data.topic = dto.topicId ? { connect: { id: dto.topicId } } : { disconnect: true };
    }

    if (dto.tags !== undefined) {
      data.tags = ContentSanitizer.normalizeTags(dto.tags);
    }

    if (dto.language !== undefined) {
      data.language = dto.language;
    }

    // CRITICAL SPEC REQUIREMENT:
    // When editing an already APPROVED post, reset its status to PENDING_REVIEW
    // so new changes must be re-moderated by admins before showing on the public feed!
    if (post.status === CommunityPostStatus.APPROVED) {
      data.status = CommunityPostStatus.PENDING_REVIEW;
      data.rejectionReason = null;
    }

    const updated = await this.prisma.communityPost.update({
      where: { id },
      data,
      include: {
        topic: true,
        author: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    await this.invalidatePostCache(id);
    await this.cache.del('admin:community:pending-count');
    return updated;
  }

  async submitDraft(authorId: string, id: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id },
    });

    if (!post || post.deletedAt) {
      throw new NotFoundException('Knowledge post not found');
    }
    if (post.authorId !== authorId) {
      throw new ForbiddenException('You can only submit your own posts');
    }
    if (post.status === CommunityPostStatus.APPROVED) {
      return post;
    }

    const updated = await this.prisma.communityPost.update({
      where: { id },
      data: {
        status: CommunityPostStatus.PENDING_REVIEW,
        rejectionReason: null,
      },
    });

    await this.cache.del('admin:community:pending-count');
    return updated;
  }

  async deletePost(authorId: string, id: string, isAdmin = false) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id },
    });

    if (!post || post.deletedAt) {
      throw new NotFoundException('Knowledge post not found');
    }
    if (!isAdmin && post.authorId !== authorId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.prisma.communityPost.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: CommunityPostStatus.DELETED,
      },
    });

    await this.invalidatePostCache(id);
    await this.cache.del('admin:community:pending-count');
    await this.cache.del('community:topics:list');
    return { success: true, message: 'Post deleted' };
  }

  // ===========================================================================
  // ATOMIC REACTIONS (LIKE / DISLIKE / NONE)
  // ===========================================================================

  async handleReaction(userId: string, postId: string, dto: ReactionDto) {
    const targetType = dto.type; // 'LIKE' | 'DISLIKE' | 'NONE'

    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      select: { id: true, status: true, deletedAt: true },
    });

    if (!post || post.deletedAt || post.status !== CommunityPostStatus.APPROVED) {
      throw new NotFoundException('Post not found or not available for interaction');
    }

    return await this.prisma.$transaction(async (tx) => {
      const existing = await tx.communityPostReaction.findUnique({
        where: { userId_postId: { userId, postId } },
      });

      let likeDelta = 0;
      let dislikeDelta = 0;

      if (targetType === 'NONE') {
        if (existing) {
          await tx.communityPostReaction.delete({
            where: { id: existing.id },
          });
          if (existing.type === CommunityReactionType.LIKE) likeDelta = -1;
          if (existing.type === CommunityReactionType.DISLIKE) dislikeDelta = -1;
        }
      } else {
        const nextType =
          targetType === 'LIKE'
            ? CommunityReactionType.LIKE
            : CommunityReactionType.DISLIKE;

        if (!existing) {
          await tx.communityPostReaction.create({
            data: { userId, postId, type: nextType },
          });
          if (nextType === CommunityReactionType.LIKE) likeDelta = 1;
          if (nextType === CommunityReactionType.DISLIKE) dislikeDelta = 1;
        } else if (existing.type !== nextType) {
          await tx.communityPostReaction.update({
            where: { id: existing.id },
            data: { type: nextType },
          });
          if (nextType === CommunityReactionType.LIKE) {
            likeDelta = 1;
            dislikeDelta = -1;
          } else {
            likeDelta = -1;
            dislikeDelta = 1;
          }
        }
      }

      if (likeDelta !== 0 || dislikeDelta !== 0) {
        await tx.communityPost.update({
          where: { id: postId },
          data: {
            likeCount: { increment: likeDelta },
            dislikeCount: { increment: dislikeDelta },
          },
        });
      }

      const updatedPost = await tx.communityPost.findUnique({
        where: { id: postId },
        select: { likeCount: true, dislikeCount: true },
      });

      return {
        success: true,
        userReaction: targetType === 'NONE' ? null : targetType,
        likeCount: Math.max(0, updatedPost?.likeCount ?? 0),
        dislikeCount: Math.max(0, updatedPost?.dislikeCount ?? 0),
      };
    });
  }

  // ===========================================================================
  // SAVES / BOOKMARKS
  // ===========================================================================

  async toggleSavePost(userId: string, postId: string, save: boolean) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      select: { id: true, saveCount: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return await this.prisma.$transaction(async (tx) => {
      const existing = await tx.communityPostSave.findUnique({
        where: { userId_postId: { userId, postId } },
      });

      if (save && !existing) {
        await tx.communityPostSave.create({
          data: { userId, postId },
        });
        await tx.communityPost.update({
          where: { id: postId },
          data: { saveCount: { increment: 1 } },
        });
      } else if (!save && existing) {
        await tx.communityPostSave.delete({
          where: { id: existing.id },
        });
        await tx.communityPost.update({
          where: { id: postId },
          data: { saveCount: { decrement: 1 } },
        });
      }

      const current = await tx.communityPost.findUnique({
        where: { id: postId },
        select: { saveCount: true },
      });

      return {
        isSaved: save,
        saveCount: Math.max(0, current?.saveCount ?? 0),
      };
    });
  }

  // ===========================================================================
  // SHARES
  // ===========================================================================

  async trackShare(postId: string, userId?: string, platform: string = 'LINK') {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    await this.prisma.$transaction([
      this.prisma.communityPostShare.create({
        data: {
          postId,
          userId: userId || null,
          platform,
        },
      }),
      this.prisma.communityPost.update({
        where: { id: postId },
        data: { shareCount: { increment: 1 } },
      }),
    ]);

    return { success: true };
  }

  // ===========================================================================
  // COMMENTS & MULTI-LEVEL NESTING
  // ===========================================================================

  async getComments(postId: string, query: CommentQueryDto, currentUserId?: string) {
    const limit = query.limit || 20;
    const parentId = query.parentId || null;

    const comments = await this.prisma.communityComment.findMany({
      where: {
        postId: postId ? postId : undefined,
        parentId,
        status: CommunityCommentStatus.ACTIVE,
        deletedAt: null,
      },
      orderBy: [{ createdAt: 'asc' }],
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    let nextCursor: string | null = null;
    let hasMore = false;

    if (comments.length > limit) {
      hasMore = true;
      const nextItem = comments.pop();
      nextCursor = nextItem ? nextItem.id : null;
    }

    let userCommentReactionsMap = new Map<string, string>();
    if (currentUserId && comments.length > 0) {
      const commentIds = comments.map((c) => c.id);
      const reactions = await this.prisma.communityCommentReaction.findMany({
        where: {
          userId: currentUserId,
          commentId: { in: commentIds },
        },
        select: { commentId: true, type: true },
      });
      reactions.forEach((r) => userCommentReactionsMap.set(r.commentId, r.type));
    }

    const enriched = comments.map((c) => ({
      id: c.id,
      postId: c.postId,
      parentId: c.parentId,
      content: c.content,
      likeCount: c.likeCount,
      replyCount: c.replyCount,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      author: c.user,
      userReaction: userCommentReactionsMap.get(c.id) || null,
    }));

    return {
      items: enriched,
      nextCursor,
      hasMore,
      limit,
    };
  }

  async createComment(userId: string, postId: string, dto: CreateCommentDto) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
      select: { id: true, status: true, deletedAt: true },
    });

    if (!post || post.deletedAt || post.status !== CommunityPostStatus.APPROVED) {
      throw new NotFoundException('Post not available for commenting');
    }

    if (dto.parentId) {
      const parent = await this.prisma.communityComment.findUnique({
        where: { id: dto.parentId },
        select: { id: true, postId: true, status: true },
      });
      if (!parent || parent.postId !== postId || parent.status !== CommunityCommentStatus.ACTIVE) {
        throw new BadRequestException('Parent comment does not exist or was deleted');
      }
    }

    const sanitizedContent = ContentSanitizer.sanitizeHtml(dto.content);

    return await this.prisma.$transaction(async (tx) => {
      const comment = await tx.communityComment.create({
        data: {
          userId,
          postId,
          parentId: dto.parentId || null,
          content: sanitizedContent,
          status: CommunityCommentStatus.ACTIVE,
          isTrainingEligible: true,
        },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              avatar: true,
              role: true,
            },
          },
        },
      });

      // Increment parent replyCount if nested
      if (dto.parentId) {
        await tx.communityComment.update({
          where: { id: dto.parentId },
          data: { replyCount: { increment: 1 } },
        });
      }

      // Increment post commentCount
      await tx.communityPost.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      });

      return {
        id: comment.id,
        postId: comment.postId,
        parentId: comment.parentId,
        content: comment.content,
        likeCount: comment.likeCount,
        replyCount: comment.replyCount,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        author: comment.user,
        userReaction: null,
      };
    });
  }

  async updateComment(userId: string, commentId: string, dto: UpdateCommentDto) {
    const comment = await this.prisma.communityComment.findUnique({
      where: { id: commentId },
    });

    if (!comment || comment.deletedAt) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    const sanitizedContent = ContentSanitizer.sanitizeHtml(dto.content);

    const updated = await this.prisma.communityComment.update({
      where: { id: commentId },
      data: { content: sanitizedContent },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    return updated;
  }

  async deleteComment(userId: string, commentId: string, isAdmin = false) {
    const comment = await this.prisma.communityComment.findUnique({
      where: { id: commentId },
    });

    if (!comment || comment.deletedAt) {
      throw new NotFoundException('Comment not found');
    }
    if (!isAdmin && comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.$transaction([
      this.prisma.communityComment.update({
        where: { id: commentId },
        data: {
          deletedAt: new Date(),
          status: CommunityCommentStatus.DELETED,
        },
      }),
      this.prisma.communityPost.update({
        where: { id: comment.postId },
        data: { commentCount: { decrement: 1 } },
      }),
      ...(comment.parentId
        ? [
            this.prisma.communityComment.update({
              where: { id: comment.parentId },
              data: { replyCount: { decrement: 1 } },
            }),
          ]
        : []),
    ]);

    return { success: true };
  }

  // ===========================================================================
  // MY POSTS & SAVED POSTS
  // ===========================================================================

  async getMyPosts(userId: string, status?: CommunityPostStatus, cursor?: string, limit = 20) {
    const where: Prisma.CommunityPostWhereInput = {
      authorId: userId,
      deletedAt: null,
      ...(status ? { status } : {}),
    };

    const posts = await this.prisma.communityPost.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        topic: true,
      },
    });

    let nextCursor: string | null = null;
    let hasMore = false;

    if (posts.length > limit) {
      hasMore = true;
      const nextItem = posts.pop();
      nextCursor = nextItem ? nextItem.id : null;
    }

    return {
      items: posts,
      nextCursor,
      hasMore,
    };
  }

  async getSavedPosts(userId: string, cursor?: string, limit = 20) {
    const saves = await this.prisma.communityPostSave.findMany({
      where: {
        userId,
        post: {
          deletedAt: null,
          status: CommunityPostStatus.APPROVED,
        },
      },
      orderBy: [{ createdAt: 'desc' }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        post: {
          include: {
            author: {
              select: {
                id: true,
                displayName: true,
                avatar: true,
                role: true,
              },
            },
            topic: true,
          },
        },
      },
    });

    let nextCursor: string | null = null;
    let hasMore = false;

    if (saves.length > limit) {
      hasMore = true;
      const nextItem = saves.pop();
      nextCursor = nextItem ? nextItem.id : null;
    }

    const items = saves.map((s) => ({
      ...s.post,
      savedAt: s.createdAt,
      isSaved: true,
    }));

    return {
      items,
      nextCursor,
      hasMore,
    };
  }

  // ===========================================================================
  // ADMIN MODERATION WORKFLOW
  // ===========================================================================

  async getAdminPosts(query: {
    status?: CommunityPostStatus;
    search?: string;
    topicId?: string;
    cursor?: string;
    limit?: number;
  }) {
    const limit = query.limit || 20;

    const where: Prisma.CommunityPostWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.topicId ? { topicId: query.topicId } : {}),
    };

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { author: { displayName: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const posts = await this.prisma.communityPost.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        topic: true,
      },
    });

    let nextCursor: string | null = null;
    let hasMore = false;

    if (posts.length > limit) {
      hasMore = true;
      const nextItem = posts.pop();
      nextCursor = nextItem ? nextItem.id : null;
    }

    return {
      items: posts,
      nextCursor,
      hasMore,
    };
  }

  async getPendingReviewCount() {
    const cacheKey = 'admin:community:pending-count';
    const cached = await this.cache.get(cacheKey);
    if (cached !== null && cached !== undefined) return cached;

    const count = await this.prisma.communityPost.count({
      where: {
        status: CommunityPostStatus.PENDING_REVIEW,
        deletedAt: null,
      },
    });

    const result = { pendingCount: count };
    await this.cache.set(cacheKey, result, 120); // 2 minutes
    return result;
  }

  async approvePost(adminId: string, id: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const updated = await this.prisma.communityPost.update({
      where: { id },
      data: {
        status: CommunityPostStatus.APPROVED,
        moderatedById: adminId,
        moderatedAt: new Date(),
        rejectionReason: null,
      },
    });

    await this.cache.del('admin:community:pending-count');
    await this.cache.del('community:topics:list');
    await this.invalidatePostCache(id);
    return updated;
  }

  async rejectPost(adminId: string, id: string, dto: RejectPostDto) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const updated = await this.prisma.communityPost.update({
      where: { id },
      data: {
        status: CommunityPostStatus.REJECTED,
        rejectionReason: dto.reason.trim(),
        moderatedById: adminId,
        moderatedAt: new Date(),
      },
    });

    await this.cache.del('admin:community:pending-count');
    await this.cache.del('community:topics:list');
    await this.invalidatePostCache(id);
    return updated;
  }

  async archivePost(adminId: string, id: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const updated = await this.prisma.communityPost.update({
      where: { id },
      data: {
        status: CommunityPostStatus.ARCHIVED,
        moderatedById: adminId,
        moderatedAt: new Date(),
      },
    });

    await this.cache.del('admin:community:pending-count');
    await this.cache.del('community:topics:list');
    await this.invalidatePostCache(id);
    return updated;
  }

  private async invalidatePostCache(postId: string) {
    await this.cache.del(`community:post:${postId}`);
  }
}
