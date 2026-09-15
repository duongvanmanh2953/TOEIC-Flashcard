import { Injectable, NotFoundException, BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDeckDto, CreateWordItemDto, SyncCloudDto } from './dto/create-deck.dto';
import { CefrLevel, ModerationStatus, VocabStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {}

  async getPublicDecks(search?: string, category?: string, cefrLevel?: CefrLevel) {
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
          select: { words: true, clones: true },
        },
      },
      orderBy: [{ cloneCount: 'desc' }, { createdAt: 'desc' }],
    });

    // Never expose passwordHash to public clients
    return decks.map(({ passwordHash, ...rest }) => ({
      ...rest,
      hasPassword: rest.isProtected,
    }));
  }

  async getDeckDetails(id: string, requesterId?: string) {
    const deck = await this.prisma.communityDeck.findUnique({
      where: { id },
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

    const { passwordHash, ...safeDeck } = deck;
    return {
      ...safeDeck,
      hasPassword: deck.isProtected,
    };
  }

  async unlockDeck(id: string, password?: string) {
    const deck = await this.prisma.communityDeck.findUnique({
      where: { id },
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
      if (!password || !deck.passwordHash) {
        throw new UnauthorizedException('Mật khẩu mở khóa không được để trống.');
      }
      const isMatch = await bcrypt.compare(password, deck.passwordHash);
      if (!isMatch) {
        throw new UnauthorizedException('Mật khẩu kho từ không chính xác!');
      }
    }

    const { passwordHash, ...safeDeck } = deck;
    return {
      success: true,
      message: 'Mở khóa kho từ thành công!',
      deck: {
        ...safeDeck,
        hasPassword: deck.isProtected,
      },
    };
  }

  async getMyDecks(userId: string) {
    const decks = await this.prisma.communityDeck.findMany({
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

    // Never expose passwordHash
    return decks.map(({ passwordHash, ...rest }) => ({
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
        vocabulary: true,
      },
    });

    return userVocab;
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

    return this.prisma.userVocabulary.findMany({
      where,
      include: {
        vocabulary: {
          include: {
            meanings: true,
            examples: { take: 1 },
          },
        },
      },
      orderBy: { lastReviewedAt: 'desc' },
    });
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

    return {
      success: true,
      message: `Đồng bộ Đám mây thành công cho tài khoản ${user.displayName || user.email}!`,
      syncedWordsCount,
      syncedAt: new Date(),
    };
  }
}
