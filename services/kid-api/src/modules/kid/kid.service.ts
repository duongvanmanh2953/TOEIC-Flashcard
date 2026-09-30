import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface KidProgressDto {
  unlockedWorlds?: string[];
  unlockedLessons?: string[];
  lessonScores?: Record<string, any>;
  completedLessons?: Record<string, any>;
  totalStars?: number;
  totalXp?: number;
  xp?: number;
  level?: number;
  streakDays?: number;
  lastActiveDate?: string;
  badges?: string[];
  weakWords?: string[];
}

@Injectable()
export class KidService {
  private readonly logger = new Logger(KidService.name);

  // In-memory / cache fallback for guest learners
  private guestProgressStore = new Map<string, KidProgressDto>();

  constructor(private readonly prisma: PrismaService) {}

  async getProgress(childId: string = 'guest'): Promise<KidProgressDto> {
    const existing = this.guestProgressStore.get(childId);
    if (existing) {
      return existing;
    }

    const defaultState: KidProgressDto = {
      unlockedWorlds: ['world-1-jungle', 'world-1'],
      unlockedLessons: ['lesson-1-hello', 'lesson-1'],
      lessonScores: {},
      completedLessons: {},
      totalStars: 0,
      totalXp: 0,
      xp: 0,
      level: 1,
      streakDays: 1,
      lastActiveDate: new Date().toISOString().slice(0, 10),
      badges: ['explorer-starter'],
      weakWords: [],
    };

    this.guestProgressStore.set(childId, defaultState);
    return defaultState;
  }

  async updateProgress(childId: string = 'guest', dto: KidProgressDto): Promise<KidProgressDto> {
    const current = await this.getProgress(childId);
    const updated: KidProgressDto = {
      ...current,
      ...dto,
      totalStars: (dto.totalStars !== undefined ? dto.totalStars : current.totalStars),
      totalXp: (dto.totalXp !== undefined ? dto.totalXp : current.totalXp),
      lastActiveDate: new Date().toISOString().slice(0, 10),
    };

    this.guestProgressStore.set(childId, updated);
    this.logger.log(`Child progress updated for [${childId}]: totalStars=${updated.totalStars}`);
    return updated;
  }

  getCurriculumOverview() {
    return {
      worlds: [
        {
          id: 'world-1-jungle',
          titleVi: 'Rừng Xanh Từ Vựng',
          titleEn: 'Vocabulary Jungle',
          theme: 'nature',
          totalLessons: 10,
        },
        {
          id: 'world-2-ocean',
          titleVi: 'Đại Dương Luyện Nghe',
          titleEn: 'Listening Ocean',
          theme: 'ocean',
          totalLessons: 10,
        },
        {
          id: 'world-3-space',
          titleVi: 'Vũ Trụ Phản Xạ',
          titleEn: 'Reflex Galaxy',
          theme: 'space',
          totalLessons: 10,
        },
      ],
    };
  }
}
