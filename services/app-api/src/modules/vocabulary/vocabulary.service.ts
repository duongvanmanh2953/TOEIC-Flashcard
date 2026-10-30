import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryVocabDto } from './dto/query-vocab.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class VocabularyService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryVocabDto, userId?: string) {
    const { page, limit, search, cefrLevel, topic, partOfSpeech, sortBy, sortOrder, languageId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.VocabularyWhereInput = {};

    if (languageId) {
      where.languageId = languageId;
    }

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

    const effectiveCefr = cefrLevel || query.cefr;
    if (effectiveCefr) {
      where.cefrLevel = effectiveCefr;
    }

    if (partOfSpeech) {
      where.partOfSpeech = { contains: partOfSpeech, mode: 'insensitive' };
    }

    if (topic) {
      where.topicItems = {
        some: {
          topic: {
            OR: [
              { slug: topic.toLowerCase() },
              { name: { contains: topic, mode: 'insensitive' } },
              { id: topic },
            ],
          },
        },
      };
    }

    if (query.languageId && query.languageId !== 'ALL') {
      (where as any).languageId = query.languageId;
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

  // =========================================================================
  // ADMIN OPERATIONS
  // =========================================================================

  async createVocabulary(dto: any, adminId?: string) {
    const word = dto.word.trim();
    const normalizedWord = word.toLowerCase();

    const created = await this.prisma.vocabulary.create({
      data: {
        word,
        normalizedWord,
        partOfSpeech: dto.partOfSpeech || 'n.',
        cefrLevel: dto.cefrLevel || 'B1',
        difficulty: dto.difficulty ? parseFloat(dto.difficulty) : 3.0,
        frequencyRank: dto.frequencyRank ? parseInt(dto.frequencyRank, 10) : undefined,
        definition: dto.definition || word,
        shortDefinition: dto.shortDefinition,
        pronunciation: dto.pronunciation || dto.phonetic,
        phonetic: dto.phonetic,
        audioUrl: dto.audioUrl,
        imageUrl: dto.imageUrl,
        meanings: dto.meaning
          ? {
              create: [
                {
                  meaning: dto.meaning,
                  definition: dto.definition,
                  domain: dto.topic || 'General',
                },
              ],
            }
          : undefined,
        examples: dto.exampleSentence
          ? {
              create: [
                {
                  sentence: dto.exampleSentence,
                  translation: dto.exampleTranslation,
                  sourceType: 'TOEIC',
                },
              ],
            }
          : undefined,
      },
      include: {
        meanings: true,
        examples: true,
      },
    });

    if (adminId) {
      await this.prisma.auditLog.create({
        data: {
          actorId: adminId,
          action: 'VOCABULARY_CREATE',
          targetType: 'VOCABULARY',
          targetId: created.id,
          metadata: { word: created.word, cefrLevel: created.cefrLevel },
        },
      });
    }

    return created;
  }

  async updateVocabulary(id: string, dto: any, adminId?: string) {
    const vocab = await this.prisma.vocabulary.findUnique({ where: { id } });
    if (!vocab) throw new NotFoundException('Vocabulary not found');

    const updated = await this.prisma.vocabulary.update({
      where: { id },
      data: {
        word: dto.word !== undefined ? dto.word.trim() : undefined,
        normalizedWord: dto.word !== undefined ? dto.word.trim().toLowerCase() : undefined,
        partOfSpeech: dto.partOfSpeech,
        cefrLevel: dto.cefrLevel,
        difficulty: dto.difficulty !== undefined ? parseFloat(dto.difficulty) : undefined,
        frequencyRank: dto.frequencyRank !== undefined ? parseInt(dto.frequencyRank, 10) : undefined,
        definition: dto.definition,
        shortDefinition: dto.shortDefinition,
        pronunciation: dto.pronunciation,
        phonetic: dto.phonetic,
        audioUrl: dto.audioUrl,
        imageUrl: dto.imageUrl,
      },
      include: {
        meanings: true,
        examples: true,
      },
    });

    if (adminId) {
      await this.prisma.auditLog.create({
        data: {
          actorId: adminId,
          action: 'VOCABULARY_UPDATE',
          targetType: 'VOCABULARY',
          targetId: id,
          metadata: { word: updated.word, payload: dto },
        },
      });
    }

    return updated;
  }

  async deleteVocabulary(id: string, adminId?: string) {
    const vocab = await this.prisma.vocabulary.findUnique({ where: { id } });
    if (!vocab) throw new NotFoundException('Vocabulary not found');

    const deleted = await this.prisma.vocabulary.delete({ where: { id } });

    if (adminId) {
      await this.prisma.auditLog.create({
        data: {
          actorId: adminId,
          action: 'VOCABULARY_DELETE',
          targetType: 'VOCABULARY',
          targetId: id,
          metadata: { word: vocab.word },
        },
      });
    }

    return deleted;
  }

  async clearAll(languageId?: string, adminId?: string) {
    const where = languageId && languageId !== 'ALL' ? { languageId } : {};
    const res = await this.prisma.vocabulary.deleteMany({ where });
    if (adminId) {
      await this.prisma.auditLog.create({
        data: {
          actorId: adminId,
          action: 'VOCABULARY_CLEAR_ALL',
          targetType: 'VOCABULARY',
          targetId: 'ALL',
          metadata: { count: res.count, languageId: languageId || 'ALL' },
        },
      });
    }
    return { success: true, count: res.count, message: `Đã xóa thành công ${res.count} từ vựng hệ thống.` };
  }

  async bulkAction(ids: string[], action: string, value: any, adminId?: string) {
    if (!ids.length) return { count: 0 };

    let count = 0;
    if (action === 'DELETE') {
      const res = await this.prisma.vocabulary.deleteMany({
        where: { id: { in: ids } },
      });
      count = res.count;
    } else if (action === 'CEFR') {
      const res = await this.prisma.vocabulary.updateMany({
        where: { id: { in: ids } },
        data: { cefrLevel: value },
      });
      count = res.count;
    } else if (action === 'DIFFICULTY') {
      const res = await this.prisma.vocabulary.updateMany({
        where: { id: { in: ids } },
        data: { difficulty: parseFloat(value) },
      });
      count = res.count;
    }

    if (adminId) {
      await this.prisma.auditLog.create({
        data: {
          actorId: adminId,
          action: `VOCABULARY_BULK_${action}`,
          targetType: 'VOCABULARY',
          targetId: 'MULTIPLE',
          metadata: { count, ids, value },
        },
      });
    }

    return { success: true, count };
  }

  async importBatch(items: any[], adminId?: string) {
    if (!Array.isArray(items) || !items.length) {
      return { total: 0, imported: 0, skipped: 0 };
    }

    let imported = 0;
    let skipped = 0;

    for (const item of items) {
      if (!item.word || typeof item.word !== 'string') {
        skipped++;
        continue;
      }

      const word = item.word.trim();
      const normalizedWord = word.toLowerCase();

      const existing = await this.prisma.vocabulary.findUnique({
        where: { word },
      });

      if (existing) {
        skipped++;
        continue;
      }

      try {
        await this.prisma.vocabulary.create({
          data: {
            word,
            normalizedWord,
            partOfSpeech: item.partOfSpeech || 'n.',
            cefrLevel: item.cefrLevel || 'B1',
            difficulty: item.difficulty ? parseFloat(item.difficulty) : 3.0,
            definition: item.definition || word,
            shortDefinition: item.shortDefinition,
            phonetic: item.phonetic,
            audioUrl: item.audioUrl,
            meanings: item.meaning
              ? {
                  create: [
                    {
                      meaning: item.meaning,
                      definition: item.definition,
                    },
                  ],
                }
              : undefined,
            examples: item.example
              ? {
                  create: [
                    {
                      sentence: item.example,
                      translation: item.exampleTranslation,
                    },
                  ],
                }
              : undefined,
          },
        });
        imported++;
      } catch {
        skipped++;
      }
    }

    if (adminId) {
      await this.prisma.auditLog.create({
        data: {
          actorId: adminId,
          action: 'VOCABULARY_IMPORT_BATCH',
          targetType: 'VOCABULARY',
          targetId: 'BATCH',
          metadata: { total: items.length, imported, skipped },
        },
      });
    }

    return {
      total: items.length,
      imported,
      skipped,
    };
  }
}
