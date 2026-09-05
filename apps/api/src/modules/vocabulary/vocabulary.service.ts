import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryVocabDto } from './dto/query-vocab.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class VocabularyService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryVocabDto, userId?: string) {
    const { page, limit, search, cefrLevel, topic, partOfSpeech, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.VocabularyWhereInput = {};

    if (search) {
      const cleanSearch = search.trim().toLowerCase();
      where.OR = [
        { word: { contains: cleanSearch, mode: 'insensitive' } },
        { definition: { contains: cleanSearch, mode: 'insensitive' } },
        { shortDefinition: { contains: cleanSearch, mode: 'insensitive' } },
        {
          meanings: {
            some: {
              meaning: { contains: cleanSearch, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    if (cefrLevel) {
      where.cefrLevel = cefrLevel;
    }

    if (partOfSpeech) {
      where.partOfSpeech = { contains: partOfSpeech, mode: 'insensitive' };
    }

    if (topic) {
      where.topicItems = {
        some: {
          topic: {
            slug: topic,
          },
        },
      };
    }

    const orderBy: Prisma.VocabularyOrderByWithRelationInput = {
      [sortBy || 'word']: sortOrder || 'asc',
    };

    const [items, total] = await Promise.all([
      this.prisma.vocabulary.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          meanings: true,
          examples: { take: 2 },
          topicItems: {
            include: {
              topic: true,
            },
          },
          userVocabularies: userId
            ? {
                where: { userId },
                select: {
                  status: true,
                  masteryScore: true,
                  isFavorite: true,
                  isHard: true,
                  nextReviewAt: true,
                },
              }
            : false,
        },
      }),
      this.prisma.vocabulary.count({ where }),
    ]);

    // Format response to include flat user progress
    const formattedItems = items.map((item) => {
      const userProgress = item.userVocabularies?.[0] || null;
      const { userVocabularies, ...rest } = item;
      return {
        ...rest,
        userProgress,
      };
    });

    return {
      items: formattedItems,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(identifier: string, userId?: string) {
    const vocab = await this.prisma.vocabulary.findFirst({
      where: {
        OR: [{ id: identifier }, { word: identifier.toLowerCase() }],
      },
      include: {
        meanings: true,
        examples: true,
        topicItems: {
          include: {
            topic: true,
          },
        },
        sourceRelations: {
          include: {
            targetWord: {
              select: { id: true, word: true, shortDefinition: true, partOfSpeech: true },
            },
          },
        },
        targetRelations: {
          include: {
            sourceWord: {
              select: { id: true, word: true, shortDefinition: true, partOfSpeech: true },
            },
          },
        },
        userVocabularies: userId
          ? {
              where: { userId },
            }
          : false,
      },
    });

    if (!vocab) {
      throw new NotFoundException(`Vocabulary "${identifier}" not found`);
    }

    const userProgress = vocab.userVocabularies?.[0] || null;
    const { userVocabularies, ...rest } = vocab;

    return {
      ...rest,
      userProgress,
    };
  }

  async getTopics() {
    return this.prisma.vocabularyTopic.findMany({
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async toggleFavorite(vocabularyId: string, userId: string) {
    const existing = await this.prisma.userVocabulary.findUnique({
      where: {
        userId_vocabularyId: { userId, vocabularyId },
      },
    });

    if (!existing) {
      return this.prisma.userVocabulary.create({
        data: {
          userId,
          vocabularyId,
          isFavorite: true,
          status: 'LEARNING',
        },
      });
    }

    return this.prisma.userVocabulary.update({
      where: { id: existing.id },
      data: { isFavorite: !existing.isFavorite },
    });
  }
}
