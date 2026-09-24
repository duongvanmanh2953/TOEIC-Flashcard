import { Injectable, NotFoundException, BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisCacheService } from '../../common/cache/redis-cache.service';
import {
  CreateDeckDto,
  CreateWordItemDto,
  SyncCloudDto,
  UpdateDeckDto,
  UpdateWordItemDto,
  BulkDeleteDto,
} from './dto/create-deck.dto';
import { CefrLevel, ModerationStatus, VocabStatus, GrantStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class CommunityService {
  constructor(
    private prisma: PrismaService,
    private cacheService: RedisCacheService,
  ) {}

  async getPublicDecks(search?: string, category?: string, cefrLevel?: CefrLevel, userId?: string) {
    const where: any = {
      isPublic: true,
      status: ModerationStatus.APPROVED,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (cefrLevel) {
      where.cefrLevel = cefrLevel;
    }

    const decks = await this.prisma.communityDeck.findMany({
      where,
      include: {
        author: {
          select: { id: true, displayName: true, avatar: true },
        },
        words: {
          take: 5,
        },
        _count: {
          select: { words: true, clones: true, comments: true },
        },
      },
      orderBy: [{ cloneCount: 'desc' }, { likeCount: 'desc' }, { createdAt: 'desc' }],
    });

    const userLikes = userId
      ? await this.prisma.deckLike.findMany({
          where: { userId, deckId: { in: decks.map((d) => d.id) } },
          select: { deckId: true },
        })
      : [];
    const userDislikes = userId
      ? await this.prisma.deckDislike.findMany({
          where: { userId, deckId: { in: decks.map((d) => d.id) } },
          select: { deckId: true },
        })
      : [];
    const userClones = userId
      ? await this.prisma.deckClone.findMany({
          where: { userId, deckId: { in: decks.map((d) => d.id) } },
          select: { deckId: true },
        })
      : [];
    const likedSet = new Set(userLikes.map((l) => l.deckId));
    const dislikedSet = new Set(userDislikes.map((d) => d.deckId));
    const clonedSet = new Set(userClones.map((c) => c.deckId));

    // Never expose passwordHash to public clients
    return decks.map(({ passwordHash, ...rest }) => ({
      ...rest,
      hasPassword: rest.isProtected,
      isOwner: userId ? rest.userId === userId : false,
      isCloned: clonedSet.has(rest.id),
      userLiked: likedSet.has(rest.id),
      userDisliked: dislikedSet.has(rest.id),
    }));
  }

  async getDeckDetails(id: string, requesterId?: string) {
    const cleanId = String(id).replace(/^cloned_/, '');
    const deck = await this.prisma.communityDeck.findUnique({
      where: { id: cleanId },
      include: {
        author: {
          select: { id: true, displayName: true, avatar: true },
        },
        words: true,
        _count: {
          select: { words: true, clones: true },
        },
      },
    });

    if (!deck) {
      throw new NotFoundException('Community Deck not found');
    }

    let isCloned = false;
    let isOwner = false;
    let isAdmin = false;
    let userLiked = false;
    let userDisliked = false;
    let hasAccessGrant = false;

    if (requesterId) {
      isOwner = deck.userId === requesterId;
      const [cloneCount, likeRecord, dislikeRecord, userRecord, grant] = await Promise.all([
        this.prisma.deckClone.count({ where: { deckId: cleanId, userId: requesterId } }),
        this.prisma.deckLike.findUnique({
          where: { userId_deckId: { userId: requesterId, deckId: cleanId } },
        }),
        this.prisma.deckDislike.findUnique({
          where: { userId_deckId: { userId: requesterId, deckId: cleanId } },
        }),
        this.prisma.user.findUnique({
          where: { id: requesterId },
          select: { role: true },
        }),
        deck.isProtected
          ? this.prisma.bankAccessGrant.findFirst({
              where: {
                bankId: cleanId,
                userId: requesterId,
                status: 'ACTIVE',
                revokedAt: null,
              },
            })
          : Promise.resolve(null),
      ]);
      isCloned = cloneCount > 0;
      userLiked = Boolean(likeRecord);
      userDisliked = Boolean(dislikeRecord);
      isAdmin = userRecord?.role === 'ADMIN' || userRecord?.role === 'SUPER_ADMIN';
      if (grant && (!grant.expiresAt || grant.expiresAt > new Date())) {
        hasAccessGrant = true;
      }
    }

    // SECURITY: If deck is password protected and requester is not author/admin and has no grant,
    // NEVER expose full words in getDeckDetails! Only return up to 10 sample preview words.
    const isLocked = Boolean(deck.isProtected && !isOwner && !isAdmin && !hasAccessGrant);
    const wordsToReturn = isLocked ? deck.words.slice(0, 10) : deck.words;

    const { passwordHash, ...safeDeck } = deck;
    return {
      ...safeDeck,
      words: wordsToReturn,
      isLocked,
      requiresPassword: isLocked,
      hasPassword: deck.isProtected,
      isOwner,
      isCloned,
      userLiked,
      userDisliked,
      hasAccessGrant,
    };
  }

  async unlockDeck(id: string, password?: string, userId?: string) {
    const cleanId = String(id).replace(/^cloned_/, '');
    const deck = await this.prisma.communityDeck.findUnique({
      where: { id: cleanId },
      include: {
        author: {
          select: { id: true, displayName: true, avatar: true },
        },
        words: true,
        _count: {
          select: { words: true, clones: true },
        },
      },
    });

    if (!deck) {
      throw new NotFoundException('Community Deck not found');
    }

    if (deck.isProtected) {
      const isOwner = userId && deck.userId === userId;
      if (!isOwner) {
        let isAuthorized = false;

        // 1. If user is logged in, check if they already have an active access grant
        if (userId) {
          const grant = await this.prisma.bankAccessGrant.findFirst({
            where: {
              bankId: cleanId,
              userId,
              status: 'ACTIVE',
              revokedAt: null,
            },
          });
          if (grant && (!grant.expiresAt || grant.expiresAt > new Date())) {
            isAuthorized = true;
          }
        }

        // 2. If access key string is provided, verify strictly against personal BankAccessGrant
        if (!isAuthorized && password?.trim()) {
          const trimmed = password.trim();

          // Find the grant matching this tokenHash for this bank
          const tokenHash = crypto.createHash('sha256').update(trimmed).digest('hex');
          const keyGrant = await this.prisma.bankAccessGrant.findFirst({
            where: {
              tokenHash,
              bankId: cleanId,
              status: GrantStatus.ACTIVE,
              revokedAt: null,
            },
          });

          if (!keyGrant) {
            throw new ForbiddenException('Access Key không hợp lệ hoặc đã bị thu hồi. Mật khẩu của chủ kho không được dùng để cấp quyền cho tài khoản khác.');
          }

          if (keyGrant.userId !== userId) {
            throw new ForbiddenException('ACCESS_KEY_NOT_ASSIGNED_TO_USER: Access Key này được cấp riêng cho người dùng khác, bạn không có quyền sử dụng mã này');
          }

          if (keyGrant.expiresAt && keyGrant.expiresAt < new Date()) {
            throw new ForbiddenException('Access Key này đã hết hạn sử dụng');
          }

          isAuthorized = true;
          await this.prisma.bankAccessGrant.update({
            where: { id: keyGrant.id },
            data: { lastUsedAt: new Date() },
          });
        }

        if (!isAuthorized) {
          throw new ForbiddenException('Kho từ vựng này được bảo vệ. Bạn cần nhập Access Key được cấp riêng cho tài khoản của bạn để mở khóa.');
        }
      }
    }

    const { passwordHash, ...safeDeck } = deck;
    return {
      success: true,
      message: 'Mở khóa kho từ thành công!',
      deck: {
        ...safeDeck,
        isLocked: false,
        requiresPassword: false,
        hasPassword: deck.isProtected,
      },
    };
  }

  async getMyDecks(userId: string) {
    // 1. Decks created by this user
    const createdDecks = await this.prisma.communityDeck.findMany({
      where: { userId },
      include: {
        author: {
          select: { id: true, displayName: true, avatar: true },
        },
        words: true,
        _count: {
          select: { words: true, clones: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Decks cloned by this user from community
    const clonedRecords = await this.prisma.deckClone.findMany({
      where: { userId },
      include: {
        deck: {
          include: {
            author: {
              select: { id: true, displayName: true, avatar: true },
            },
            words: true,
            _count: {
              select: { words: true, clones: true },
            },
          },
        },
      },
      orderBy: { clonedAt: 'desc' },
    });

    const clonedDecks = clonedRecords
      .map((r) => r.deck)
      .filter((d) => Boolean(d) && d.userId !== userId)
      .map((d) => ({
        ...d,
        isCloned: true,
        isReadOnly: true, // CLONED DECKS CANNOT BE MODIFIED BY CLONER
      }));

    const allDecks = [
      ...createdDecks.map((d) => ({ ...d, isCloned: false, isReadOnly: false })),
      ...clonedDecks,
    ];

    // Never expose passwordHash
    return allDecks.map(({ passwordHash, ...rest }) => ({
      ...rest,
      hasPassword: rest.isProtected,
    }));
  }

  async createDeck(userId: string, dto: CreateDeckDto) {
    if (!dto.words || dto.words.length === 0) {
      throw new BadRequestException('Deck must contain at least 1 word');
    }

    // Check user role: If admin, auto-approve; if learner, set to PENDING
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const status = user?.role === 'ADMIN' ? ModerationStatus.APPROVED : ModerationStatus.PENDING;

    // Secure password hashing
    const isProtected = Boolean(dto.password && dto.password.trim().length > 0);
    const passwordHash = isProtected ? await bcrypt.hash(dto.password!.trim(), 10) : null;

    // Check if user already submitted a deck with this exact title that is currently PENDING
    const existingPending = await this.prisma.communityDeck.findFirst({
      where: {
        userId,
        title: dto.title.trim(),
        status: ModerationStatus.PENDING,
      },
    });

    if (existingPending) {
      // Idempotently update the existing pending submission rather than creating duplicate rows
      await this.prisma.communityWord.deleteMany({ where: { deckId: existingPending.id } });
      const updated = await this.prisma.communityDeck.update({
        where: { id: existingPending.id },
        data: {
          description: dto.description,
          category: dto.category || 'General',
          cefrLevel: dto.cefrLevel || CefrLevel.B2,
          isPublic: dto.isPublic !== undefined ? dto.isPublic : true,
          isProtected,
          passwordHash,
          words: {
            create: dto.words.map((w) => ({
              word: w.word.trim().toLowerCase(),
              phonetic: w.phonetic,
              partOfSpeech: w.partOfSpeech,
              meaning: w.meaning,
              definition: w.definition,
              example: w.example,
              exampleTranslation: w.exampleTranslation,
            })),
          },
        },
        include: {
          author: { select: { id: true, displayName: true, avatar: true } },
          words: true,
          _count: { select: { words: true, clones: true } },
        },
      });
      await this.cacheService.invalidateDeck(existingPending.id);
      return updated;
    }

    const created = await this.prisma.communityDeck.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        category: dto.category || 'General',
        cefrLevel: dto.cefrLevel || CefrLevel.B2,
        isPublic: dto.isPublic !== undefined ? dto.isPublic : true,
        isProtected,
        passwordHash,
        status,
        words: {
          create: dto.words.map((w) => ({
            word: w.word.trim().toLowerCase(),
            phonetic: w.phonetic,
            partOfSpeech: w.partOfSpeech,
            meaning: w.meaning,
            definition: w.definition,
            example: w.example,
            exampleTranslation: w.exampleTranslation,
          })),
        },
      },
      include: {
        words: true,
      },
    });

    const { passwordHash: _removed, ...safeDeck } = created;
    return {
      ...safeDeck,
      hasPassword: safeDeck.isProtected,
    };
  }

  async cloneDeck(userId: string, deckId: string, password?: string) {
    const deck = await this.prisma.communityDeck.findUnique({
      where: { id: deckId },
      include: { words: true },
    });

    if (!deck) {
      throw new NotFoundException('Deck not found');
    }

    // Rule 1: Owner cannot clone their own deck
    if (deck.userId === userId) {
      throw new BadRequestException('Bạn là tác giả của kho từ này, không cần sao chép!');
    }

    // Rule 2: Check if user already cloned this deck
    const existingClone = await this.prisma.deckClone.findUnique({
      where: { userId_deckId: { userId, deckId } },
    });
    if (existingClone) {
      return {
        success: true,
        alreadyCloned: true,
        message: `Kho từ vựng "${deck.title}" đã có trong kho cá nhân của bạn.`,
        totalWordsInDeck: deck.words.length,
        newWordsAdded: 0,
      };
    }

    // Verify password if deck is protected and user is not author
    if (deck.isProtected && deck.userId !== userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
        if (!password || !deck.passwordHash) {
          throw new UnauthorizedException('Kho từ này có mật khẩu bảo vệ. Vui lòng nhập mật khẩu để sao chép.');
        }
        const isMatch = await bcrypt.compare(password, deck.passwordHash);
        if (!isMatch) {
          throw new UnauthorizedException('Mật khẩu mở khóa kho từ không chính xác!');
        }
      }
    }

    // Clone words into Vocabulary and UserVocabulary
    let addedCount = 0;
    for (const item of deck.words) {
      const cleanWord = item.word.trim().toLowerCase();

      // Ensure word exists in Vocabulary table
      const vocab = await this.prisma.vocabulary.upsert({
        where: { word: cleanWord },
        update: {
          definition: item.definition || item.meaning,
          shortDefinition: item.meaning,
        },
        create: {
          word: cleanWord,
          normalizedWord: cleanWord.replace(/[^a-z]/g, ''),
          phonetic: item.phonetic,
          pronunciation: item.phonetic,
          partOfSpeech: item.partOfSpeech || 'n.',
          definition: item.definition || item.meaning,
          shortDefinition: item.meaning,
          cefrLevel: deck.cefrLevel,
        },
      });

      // Add to User's vocabulary bank for Spaced Repetition review
      const existing = await this.prisma.userVocabulary.findUnique({
        where: {
          userId_vocabularyId: { userId, vocabularyId: vocab.id },
        },
      });

      if (!existing) {
        await this.prisma.userVocabulary.create({
          data: {
            userId,
            vocabularyId: vocab.id,
            status: VocabStatus.NEW,
            masteryScore: 0.0,
            stability: 1.0,
            retrievability: 1.0,
            nextReviewAt: new Date(), // Ready for review immediately
          },
        });
        addedCount++;
      }
    }

    // Record clone tracking
    await this.prisma.deckClone.upsert({
      where: { userId_deckId: { userId, deckId } },
      update: {},
      create: { userId, deckId },
    });

    // Increment clone count on deck
    await this.prisma.communityDeck.update({
      where: { id: deckId },
      data: { cloneCount: { increment: 1 } },
    });

    return {
      success: true,
      message: `Đã clone thành công ${addedCount} từ vựng mới từ bộ "${deck.title}" vào kho ôn tập cá nhân của bạn!`,
      totalWordsInDeck: deck.words.length,
      newWordsAdded: addedCount,
    };
  }

  async quickAddWord(userId: string, dto: CreateWordItemDto) {
    const cleanWord = dto.word.trim().toLowerCase();

    const vocab = await this.prisma.vocabulary.upsert({
      where: { word: cleanWord },
      update: {
        shortDefinition: dto.meaning,
        definition: dto.definition || dto.meaning,
      },
      create: {
        word: cleanWord,
        normalizedWord: cleanWord.replace(/[^a-z]/g, ''),
        phonetic: dto.phonetic,
        pronunciation: dto.phonetic,
        partOfSpeech: dto.partOfSpeech || 'n.',
        definition: dto.definition || dto.meaning,
        shortDefinition: dto.meaning,
        cefrLevel: CefrLevel.B1,
      },
    });

    if (dto.meaning) {
      const existingMeaning = await this.prisma.vocabularyMeaning.findFirst({
        where: { vocabularyId: vocab.id, meaning: dto.meaning },
      });
      if (!existingMeaning) {
        await this.prisma.vocabularyMeaning.create({
          data: { vocabularyId: vocab.id, meaning: dto.meaning },
        });
      }
    }

    if (dto.example) {
      const existingEx = await this.prisma.exampleSentence.findFirst({
        where: { vocabularyId: vocab.id, sentence: dto.example },
      });
      if (!existingEx) {
        await this.prisma.exampleSentence.create({
          data: {
            vocabularyId: vocab.id,
            sentence: dto.example,
            translation: dto.exampleTranslation,
          },
        });
      }
    }

    if (dto.topic && dto.topic.trim()) {
      const topicName = dto.topic.trim();
      const normalizeSlug = (str: string) => {
        const clean = str
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd')
          .replace(/Đ/g, 'd')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        return clean || `topic-${Buffer.from(str).toString('hex').substring(0, 12)}`;
      };
      const slug = normalizeSlug(topicName);
      try {
        const topic = await this.prisma.vocabularyTopic.upsert({
          where: { name: topicName },
          update: { name: topicName, slug },
          create: { name: topicName, slug },
        });

        await this.prisma.vocabularyTopicItem.upsert({
          where: {
            topicId_vocabularyId: {
              topicId: topic.id,
              vocabularyId: vocab.id,
            },
          },
          update: {},
          create: {
            topicId: topic.id,
            vocabularyId: vocab.id,
          },
        });
      } catch (topicErr) {
        console.warn('Topic upsert notice:', topicErr);
      }
    }

    const userVocab = await this.prisma.userVocabulary.upsert({
      where: {
        userId_vocabularyId: { userId, vocabularyId: vocab.id },
      },
      update: {
        status: VocabStatus.LEARNING,
        nextReviewAt: new Date(),
      },
      create: {
        userId,
        vocabularyId: vocab.id,
        status: VocabStatus.NEW,
        nextReviewAt: new Date(),
      },
      include: {
        vocabulary: {
          include: {
            topicItems: {
              include: { topic: true },
            },
          },
        },
      },
    });

    const topicName = (userVocab as any).vocabulary?.topicItems?.[0]?.topic?.name || dto.topic || 'General';
    return {
      ...userVocab,
      topic: topicName,
      vocabulary: {
        ...userVocab.vocabulary,
        topic: topicName,
      },
    };
  }

  async batchAddWords(userId: string, words: CreateWordItemDto[]) {
    if (!words || !Array.isArray(words)) {
      throw new BadRequestException('Words array is required');
    }

    const validWords = words.filter((w) => w && w.word && w.meaning);
    let addedCount = 0;

    // Execute in sub-batches of 25 for high performance without DB connection pool exhaustion
    const SUB_BATCH_SIZE = 25;
    for (let i = 0; i < validWords.length; i += SUB_BATCH_SIZE) {
      const chunk = validWords.slice(i, i + SUB_BATCH_SIZE);
      const results = await Promise.allSettled(
        chunk.map((item) => this.quickAddWord(userId, item))
      );
      addedCount += results.filter((r) => r.status === 'fulfilled').length;
    }

    return {
      success: true,
      message: `Đã nhập thành công ${addedCount} từ vựng vào kho cá nhân của bạn!`,
      importedCount: addedCount,
    };
  }

  async getMyWords(userId: string, filter?: string) {
    const where: any = { userId };

    if (filter === 'FAVORITES') {
      where.isFavorite = true;
    } else if (filter === 'MASTERED') {
      where.status = VocabStatus.MASTERED;
    } else if (filter === 'LEARNING') {
      where.status = { in: [VocabStatus.NEW, VocabStatus.LEARNING, VocabStatus.REVIEW] };
    }

    const list = await this.prisma.userVocabulary.findMany({
      where,
      include: {
        vocabulary: {
          include: {
            meanings: true,
            examples: { take: 1 },
            topicItems: {
              include: { topic: true },
            },
          },
        },
      },
      orderBy: { lastReviewedAt: 'desc' },
    });

    return list.map((item: any) => {
      const topicName = item.vocabulary?.topicItems?.[0]?.topic?.name || 'General';
      return {
        ...item,
        topic: topicName,
        vocabulary: {
          ...item.vocabulary,
          topic: topicName,
        },
      };
    });
  }

  async clearAllMyWords(userId: string) {
    // 1. Delete user vocabularies
    const vocabResult = await this.prisma.userVocabulary.deleteMany({
      where: { userId },
    });

    // 2. Delete user personal community decks
    const deckResult = await this.prisma.communityDeck.deleteMany({
      where: { userId },
    });

    await this.cacheService.invalidateUserVocab(userId);

    return {
      success: true,
      message: `Đã xóa thành công ${vocabResult.count} từ vựng và ${deckResult.count} kho từ vựng cá nhân trên cơ sở dữ liệu!`,
      deletedVocabCount: vocabResult.count,
      deletedDeckCount: deckResult.count,
    };
  }

  async updateDeck(userId: string, deckId: string, dto: UpdateDeckDto) {
    const deck = await this.prisma.communityDeck.findUnique({ where: { id: deckId } });
    if (!deck) throw new NotFoundException('Không tìm thấy kho từ vựng');
    
    // Verify owner or admin
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    if (deck.userId !== userId && !isAdmin) {
      throw new ForbiddenException('Bạn không có quyền sửa kho từ vựng này');
    }

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.description !== undefined) data.description = dto.description?.trim();
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.cefrLevel !== undefined) data.cefrLevel = dto.cefrLevel;
    if (dto.isPublic !== undefined) data.isPublic = dto.isPublic;
    
    // Status management: Admin can set any status. Owner can re-submit (PENDING) or withdraw to private
    if (dto.status !== undefined) {
      if (isAdmin) {
        data.status = dto.status;
      } else if (dto.status === ModerationStatus.PENDING) {
        data.status = ModerationStatus.PENDING;
      }
    }
    
    // If owner changes deck to private, it no longer needs moderation
    if (dto.isPublic === false && !isAdmin) {
      // Keep as pending/private or approved
    }

    if (dto.password !== undefined) {
      if (dto.password.trim().length > 0) {
        data.isProtected = true;
        data.passwordHash = await bcrypt.hash(dto.password.trim(), 10);
      } else {
        data.isProtected = false;
        data.passwordHash = null;
      }
    }

    const updated = await this.prisma.communityDeck.update({
      where: { id: deckId },
      data,
      include: { words: true, _count: { select: { words: true } } },
    });

    await this.cacheService.invalidateDeck(deckId);
    const { passwordHash, ...safeDeck } = updated;
    return { ...safeDeck, hasPassword: safeDeck.isProtected };
  }

  async deleteDeck(userId: string, deckId: string) {
    const deck = await this.prisma.communityDeck.findUnique({ where: { id: deckId } });
    if (!deck) throw new NotFoundException('Không tìm thấy kho từ vựng');
    
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    // If not owner, check if user cloned it and remove clone record
    if (deck.userId !== userId && !isAdmin) {
      const clone = await this.prisma.deckClone.findUnique({
        where: { userId_deckId: { userId, deckId } },
      });
      if (clone) {
        await this.prisma.deckClone.delete({
          where: { userId_deckId: { userId, deckId } },
        });
        await this.cacheService.invalidateDeck(deckId);
        return { success: true, message: 'Đã xóa kho từ khỏi danh sách của bạn' };
      }
      throw new ForbiddenException('Bạn không có quyền xóa kho từ vựng này');
    }

    // Owner or Admin can delete the deck directly at any time (even if PENDING)
    await this.prisma.communityDeck.delete({ where: { id: deckId } });
    await this.cacheService.invalidateDeck(deckId);
    return { success: true, message: 'Đã xóa kho từ vựng thành công' };
  }

  async bulkDeleteDecks(userId: string, deckIds: string[]) {
    if (!deckIds || deckIds.length === 0) return { success: true, deletedCount: 0 };

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== 'ADMIN') {
      const pendingCount = await this.prisma.communityDeck.count({
        where: { id: { in: deckIds }, userId, status: ModerationStatus.PENDING },
      });
      if (pendingCount > 0) {
        throw new BadRequestException(`Có ${pendingCount} kho từ vựng đang chờ kiểm duyệt (PENDING_REVIEW), không thể xóa.`);
      }
    }
    
    // 1. Delete owned decks
    const res = await this.prisma.communityDeck.deleteMany({
      where: { id: { in: deckIds }, userId },
    });
    
    // 2. Remove any cloned deck references
    const cloneRes = await this.prisma.deckClone.deleteMany({
      where: { deckId: { in: deckIds }, userId },
    });

    for (const id of deckIds) {
      await this.cacheService.invalidateDeck(id);
    }
    const totalDeleted = res.count + cloneRes.count;
    return { success: true, message: `Đã xóa thành công ${totalDeleted} kho từ vựng`, deletedCount: totalDeleted };
  }

  async addWordToDeck(userId: string, deckId: string, dto: CreateWordItemDto) {
    const deck = await this.prisma.communityDeck.findUnique({ where: { id: deckId } });
    if (!deck) throw new NotFoundException('Không tìm thấy kho từ vựng');
    if (deck.userId !== userId) throw new ForbiddenException('Bạn không có quyền thêm từ vào kho này');

    const cleanW = dto.word.trim().toLowerCase();
    const created = await this.prisma.communityWord.create({
      data: {
        deckId,
        word: cleanW,
        phonetic: dto.phonetic,
        partOfSpeech: dto.partOfSpeech,
        meaning: dto.meaning.trim(),
        definition: dto.definition,
        example: dto.example,
        exampleTranslation: dto.exampleTranslation,
      },
    });

    await this.cacheService.invalidateDeck(deckId);
    return created;
  }

  async updateWordInDeck(userId: string, deckId: string, wordId: string, dto: UpdateWordItemDto) {
    const deck = await this.prisma.communityDeck.findUnique({ where: { id: deckId } });
    if (!deck) throw new NotFoundException('Không tìm thấy kho từ vựng');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    if (deck.userId !== userId && !isAdmin) throw new ForbiddenException('Bạn không có quyền sửa từ trong kho này');

    const data: any = {};
    if (dto.word !== undefined) data.word = dto.word.trim().toLowerCase();
    if (dto.phonetic !== undefined) data.phonetic = dto.phonetic;
    if (dto.partOfSpeech !== undefined) data.partOfSpeech = dto.partOfSpeech;
    if (dto.meaning !== undefined) data.meaning = dto.meaning.trim();
    if (dto.definition !== undefined) data.definition = dto.definition;
    if (dto.example !== undefined) data.example = dto.example;
    if (dto.exampleTranslation !== undefined) data.exampleTranslation = dto.exampleTranslation;

    const updated = await this.prisma.communityWord.update({
      where: { id: wordId },
      data,
    });

    await this.cacheService.invalidateDeck(deckId);
    return updated;
  }

  async deleteWordFromDeck(userId: string, deckId: string, wordId: string) {
    const deck = await this.prisma.communityDeck.findUnique({ where: { id: deckId } });
    if (!deck) throw new NotFoundException('Không tìm thấy kho từ vựng');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    if (deck.userId !== userId && !isAdmin) throw new ForbiddenException('Bạn không có quyền xóa từ trong kho này');

    await this.prisma.communityWord.delete({ where: { id: wordId } });
    await this.cacheService.invalidateDeck(deckId);
    return { success: true, message: 'Đã xóa từ khỏi kho thành công' };
  }

  async bulkDeleteWordsFromDeck(userId: string, deckId: string, wordIds: string[]) {
    const deck = await this.prisma.communityDeck.findUnique({ where: { id: deckId } });
    if (!deck) throw new NotFoundException('Không tìm thấy kho từ vựng');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    if (deck.userId !== userId && !isAdmin) throw new ForbiddenException('Bạn không có quyền xóa từ trong kho này');

    const res = await this.prisma.communityWord.deleteMany({
      where: { id: { in: wordIds }, deckId },
    });
    await this.cacheService.invalidateDeck(deckId);
    return { success: true, message: `Đã xóa thành công ${res.count} từ khỏi kho`, deletedCount: res.count };
  }

  async toggleWordFavorite(userId: string, id: string) {
    let userVocab = await this.prisma.userVocabulary.findUnique({ where: { id } });
    if (!userVocab) {
      userVocab = await this.prisma.userVocabulary.findFirst({
        where: { userId, vocabularyId: id },
      });
    }

    if (!userVocab) {
      throw new NotFoundException('Không tìm thấy bản ghi từ vựng');
    }

    const updated = await this.prisma.userVocabulary.update({
      where: { id: userVocab.id },
      data: { isFavorite: !userVocab.isFavorite },
    });

    await this.cacheService.invalidateUserVocab(userId);
    return { isFavorite: updated.isFavorite };
  }

  async deleteUserWord(userId: string, userVocabId: string) {
    const item = await this.prisma.userVocabulary.findFirst({
      where: { id: userVocabId, userId },
    });
    if (!item) throw new NotFoundException('Không tìm thấy từ vựng trong kho của bạn');

    await this.prisma.userVocabulary.delete({ where: { id: userVocabId } });
    await this.cacheService.invalidateUserVocab(userId);
    return { success: true, message: 'Đã xóa từ vựng thành công' };
  }

  async bulkDeleteUserWords(userId: string, ids: string[]) {
    const res = await this.prisma.userVocabulary.deleteMany({
      where: { id: { in: ids }, userId },
    });
    await this.cacheService.invalidateUserVocab(userId);
    return { success: true, message: `Đã xóa thành công ${res.count} từ vựng`, deletedCount: res.count };
  }

  async syncCloud(userId: string, dto: SyncCloudDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscriptions: { include: { plan: true } } },
    });

    const hasActiveSubscription = user?.subscriptions?.some(
      (s) =>
        s.status === 'ACTIVE' &&
        (s.plan?.tier === 'PLUS' || s.plan?.tier === 'PRO' || (s.plan?.tier as string) === 'ENTERPRISE')
    );

    const isVip =
      user &&
      (user.role === 'ADMIN' ||
        user.role === 'SUPER_ADMIN' ||
        user.role === 'PREMIUM_USER' ||
        (user as any).tier === 'PLUS' ||
        (user as any).tier === 'PRO' ||
        (user as any).tier === 'ENTERPRISE' ||
        hasActiveSubscription);

    if (!isVip) {
      throw new ForbiddenException(
        'Tính năng Lưu trữ & Đồng bộ Đám mây Không giới hạn dành riêng cho gói Trả phí (Plus/Pro). Dữ liệu hiện tại của bạn vẫn được lưu an toàn trên máy (IndexedDB).'
      );
    }

    let syncedWordsCount = 0;
    if (dto?.words && Array.isArray(dto.words) && dto.words.length > 0) {
      const res = await this.batchAddWords(userId, dto.words);
      syncedWordsCount = res.importedCount;
    }

    await this.cacheService.invalidateUserVocab(userId);

    return {
      success: true,
      message: `Đồng bộ Đám mây thành công cho tài khoản ${user.displayName || user.email}!`,
      syncedWordsCount,
      syncedAt: new Date(),
    };
  }

  async toggleLikeDeck(userId: string, deckId: string) {
    const deck = await this.prisma.communityDeck.findUnique({ where: { id: deckId } });
    if (!deck) throw new NotFoundException('Kho từ vựng không tồn tại');

    const existingLike = await this.prisma.deckLike.findUnique({
      where: { userId_deckId: { userId, deckId } },
    });

    if (existingLike) {
      await this.prisma.deckLike.delete({ where: { id: existingLike.id } });
      const updated = await this.prisma.communityDeck.update({
        where: { id: deckId },
        data: { likeCount: { decrement: 1 } },
        select: { likeCount: true, dislikeCount: true },
      });
      return { liked: false, disliked: false, likeCount: Math.max(0, updated.likeCount), dislikeCount: updated.dislikeCount };
    } else {
      const existingDislike = await this.prisma.deckDislike.findUnique({
        where: { userId_deckId: { userId, deckId } },
      });
      if (existingDislike) {
        await this.prisma.deckDislike.delete({ where: { id: existingDislike.id } });
        await this.prisma.communityDeck.update({
          where: { id: deckId },
          data: { dislikeCount: { decrement: 1 } },
        });
      }

      await this.prisma.deckLike.create({
        data: { userId, deckId },
      });

      const updated = await this.prisma.communityDeck.update({
        where: { id: deckId },
        data: { likeCount: { increment: 1 } },
        select: { likeCount: true, dislikeCount: true },
      });

      return { liked: true, disliked: false, likeCount: updated.likeCount, dislikeCount: Math.max(0, updated.dislikeCount) };
    }
  }

  async toggleDislikeDeck(userId: string, deckId: string) {
    const deck = await this.prisma.communityDeck.findUnique({ where: { id: deckId } });
    if (!deck) throw new NotFoundException('Kho từ vựng không tồn tại');

    const existingDislike = await this.prisma.deckDislike.findUnique({
      where: { userId_deckId: { userId, deckId } },
    });

    if (existingDislike) {
      await this.prisma.deckDislike.delete({ where: { id: existingDislike.id } });
      const updated = await this.prisma.communityDeck.update({
        where: { id: deckId },
        data: { dislikeCount: { decrement: 1 } },
        select: { likeCount: true, dislikeCount: true },
      });
      return { liked: false, disliked: false, likeCount: Math.max(0, updated.likeCount), dislikeCount: updated.dislikeCount };
    } else {
      const existingLike = await this.prisma.deckLike.findUnique({
        where: { userId_deckId: { userId, deckId } },
      });
      if (existingLike) {
        await this.prisma.deckLike.delete({ where: { id: existingLike.id } });
        await this.prisma.communityDeck.update({
          where: { id: deckId },
          data: { likeCount: { decrement: 1 } },
        });
      }

      await this.prisma.deckDislike.create({
        data: { userId, deckId },
      });

      const updated = await this.prisma.communityDeck.update({
        where: { id: deckId },
        data: { dislikeCount: { increment: 1 } },
        select: { likeCount: true, dislikeCount: true },
      });

      return { liked: false, disliked: true, likeCount: Math.max(0, updated.likeCount), dislikeCount: updated.dislikeCount };
    }
  }

  async getDeckComments(deckId: string) {
    const comments = await this.prisma.deckComment.findMany({
      where: { deckId, parentId: null },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, displayName: true, avatar: true, role: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, displayName: true, avatar: true, role: true } },
            replies: {
              orderBy: { createdAt: 'asc' },
              include: {
                user: { select: { id: true, displayName: true, avatar: true, role: true } },
              },
            },
          },
        },
      },
    });

    const totalCount = await this.prisma.deckComment.count({ where: { deckId, deletedAt: null } });
    return { comments, totalCount };
  }

  async addDeckComment(userId: string, deckId: string, content: string, parentId?: string) {
    if (!content || !content.trim()) throw new BadRequestException('Nội dung bình luận không được để trống');

    const deck = await this.prisma.communityDeck.findUnique({ where: { id: deckId } });
    if (!deck) throw new NotFoundException('Kho từ vựng không tồn tại');

    if (parentId) {
      const parent = await this.prisma.deckComment.findUnique({ where: { id: parentId } });
      if (!parent) throw new NotFoundException('Bình luận gốc không tồn tại');
    }

    const comment = await this.prisma.deckComment.create({
      data: {
        userId,
        deckId,
        content: content.trim(),
        parentId: parentId || null,
      },
      include: {
        user: { select: { id: true, displayName: true, avatar: true, role: true } },
      },
    });

    await this.prisma.communityDeck.update({
      where: { id: deckId },
      data: { commentCount: { increment: 1 } },
    });

    if (parentId) {
      await this.prisma.deckComment.update({
        where: { id: parentId },
        data: { replyCount: { increment: 1 } },
      });
    }

    return comment;
  }

  async updateDeckComment(userId: string, commentId: string, content: string) {
    if (!content || !content.trim()) throw new BadRequestException('Nội dung bình luận không được để trống');

    const comment = await this.prisma.deckComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Bình luận không tồn tại');
    if (comment.userId !== userId) throw new ForbiddenException('Bạn chỉ có thể chỉnh sửa bình luận của chính mình');

    return this.prisma.deckComment.update({
      where: { id: commentId },
      data: { content: content.trim(), isEdited: true },
      include: {
        user: { select: { id: true, displayName: true, avatar: true, role: true } },
      },
    });
  }

  async deleteDeckComment(userId: string, commentId: string, userRole?: string) {
    const comment = await this.prisma.deckComment.findUnique({
      where: { id: commentId },
      include: { _count: { select: { replies: true } } },
    });
    if (!comment) throw new NotFoundException('Bình luận không tồn tại');

    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    if (comment.userId !== userId && !isAdmin) {
      throw new ForbiddenException('Bạn không có quyền xóa bình luận này');
    }

    if (comment._count.replies > 0) {
      await this.prisma.deckComment.update({
        where: { id: commentId },
        data: { content: '[Bình luận đã bị xóa]', deletedAt: new Date() },
      });
    } else {
      await this.prisma.deckComment.delete({ where: { id: commentId } });
    }

    await this.prisma.communityDeck.update({
      where: { id: comment.deckId },
      data: { commentCount: { decrement: 1 } },
    });

    if (comment.parentId) {
      await this.prisma.deckComment.update({
        where: { id: comment.parentId },
        data: { replyCount: { decrement: 1 } },
      });
    }

    return { success: true };
  }
}
