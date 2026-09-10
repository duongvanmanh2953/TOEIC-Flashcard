/**
 * curriculumProgress.ts
 * Progression, Stars & Lock/Unlock Engine for Kids English Learning System
 * Persists child learner progress in localStorage
 */

import { KIDS_CURRICULUM, KidWorld, KidChapter, KidLesson } from './kidsCurriculum';

export interface KidDailyQuestItem {
  id: string;
  title: string;
  progress: number;
  target: number;
  rewardStars: number;
}

export interface LessonScoreRecord {
  stars: number;
  accuracy: number;
  completedAt?: string;
  attempts?: number;
}

export interface KidProgressState {
  unlockedWorlds: string[];
  unlockedLessons: string[];
  lessonScores: Record<string, LessonScoreRecord>;
  completedLessons: Record<string, { lessonId: string; stars: number; scorePercent: number; completedAt: string; attempts: number }>;
  totalStars: number;
  totalXp: number;
  xp: number;
  level: number;
  streakDays: number;
  lastActiveDate: string;
  badges: string[];
  weakWords: string[];
  dailyQuests: KidDailyQuestItem[];
  unlockedDecorations: string[];
}

const STORAGE_KEY = 'vocabflow_kids_progress_v2';

export const getInitialKidsState = (): KidProgressState => {
  const today = new Date().toISOString().slice(0, 10);
  return {
    unlockedWorlds: ['world-1-jungle', 'world-1'],
    unlockedLessons: ['lesson-1-hello', 'lesson-1'],
    lessonScores: {},
    completedLessons: {},
    totalStars: 0,
    totalXp: 0,
    xp: 0,
    level: 1,
    streakDays: 1,
    lastActiveDate: today,
    badges: ['explorer-starter'],
    weakWords: [],
    dailyQuests: [
      { id: 'q1', title: 'Complete 2 Adventures', progress: 0, target: 2, rewardStars: 5 },
      { id: 'q2', title: 'Say 3 Words Loudly', progress: 0, target: 3, rewardStars: 3 },
      { id: 'q3', title: 'Score 3 Stars on any lesson', progress: 0, target: 1, rewardStars: 4 },
    ],
    unlockedDecorations: ['palm-tree', 'lion-cub', 'sun'],
  };
};

class CurriculumProgressEngine {
  private state: KidProgressState;
  private listeners: Set<(state: KidProgressState) => void> = new Set();

  constructor() {
    this.state = this.load();
  }

  public load(): KidProgressState {
    if (typeof window === 'undefined') return getInitialKidsState();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...getInitialKidsState(), ...parsed };
      }
    } catch (_) {}
    return getInitialKidsState();
  }

  public save() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      this.listeners.forEach((fn) => fn(this.state));
    } catch (_) {}
  }

  public getState(): KidProgressState {
    return this.state;
  }

  public subscribe(listener: (state: KidProgressState) => void): () => void {
    this.listeners.add(listener);
    try {
      listener(this.state);
    } catch (_) {}
    return () => {
      this.listeners.delete(listener);
    };
  }

  public setState(newState: KidProgressState) {
    this.state = newState;
    this.save();
  }

  public reset() {
    this.state = getInitialKidsState();
    this.save();
  }

  public isLessonUnlocked(lessonId: string): boolean {
    return this.state.unlockedLessons.includes(lessonId);
  }

  public completeLesson(
    lessonId: string,
    stars: number,
    accuracy: number,
    weakWordsObserved: string[] = []
  ) {
    const existing = this.state.lessonScores[lessonId];
    const oldStars = existing?.stars || 0;
    const deltaStars = Math.max(0, stars - oldStars);
    const xpGain = stars * 25 + 25;

    // Update lessonScores
    this.state.lessonScores[lessonId] = {
      stars: Math.max(oldStars, stars),
      accuracy: Math.max(existing?.accuracy || 0, accuracy),
      completedAt: new Date().toISOString(),
      attempts: (existing?.attempts || 0) + 1,
    };

    // Update completedLessons
    this.state.completedLessons[lessonId] = {
      lessonId,
      stars: Math.max(oldStars, stars),
      scorePercent: Math.max(existing?.accuracy || 0, accuracy),
      completedAt: new Date().toISOString(),
      attempts: (existing?.attempts || 0) + 1,
    };

    this.state.totalStars += deltaStars;
    this.state.totalXp += xpGain;
    this.state.xp = this.state.totalXp;
    this.state.level = Math.floor(this.state.totalXp / 100) + 1;

    // Update weak words
    weakWordsObserved.forEach((w) => {
      if (w && !this.state.weakWords.includes(w)) {
        this.state.weakWords.push(w);
      }
    });

    // Update daily quests
    if (this.state.dailyQuests.length > 0) {
      this.state.dailyQuests[0].progress = Math.min(
        this.state.dailyQuests[0].target,
        this.state.dailyQuests[0].progress + 1
      );
      if (stars >= 3 && this.state.dailyQuests[2]) {
        this.state.dailyQuests[2].progress = this.state.dailyQuests[2].target;
      }
    }

    // Unlock next lesson
    let unlockNext = false;
    for (const world of KIDS_CURRICULUM) {
      for (const chapter of world.chapters) {
        for (const lesson of chapter.lessons) {
          if (unlockNext) {
            if (!this.state.unlockedLessons.includes(lesson.id)) {
              this.state.unlockedLessons.push(lesson.id);
            }
            if (!this.state.unlockedWorlds.includes(world.id)) {
              this.state.unlockedWorlds.push(world.id);
            }
            unlockNext = false;
            break;
          }
          if (lesson.id === lessonId) {
            unlockNext = true;
          }
        }
      }
    }

    // Check badges
    if (Object.keys(this.state.lessonScores).length >= 1 && !this.state.badges.includes('first-word')) {
      this.state.badges.push('first-word');
    }
    if (this.state.totalStars >= 10 && !this.state.badges.includes('star-collector')) {
      this.state.badges.push('star-collector');
    }

    this.save();
  }

  public getNextLesson(): { lesson: KidLesson; world: KidWorld; chapter: KidChapter } | null {
    for (const world of KIDS_CURRICULUM) {
      for (const chapter of world.chapters) {
        for (const lesson of chapter.lessons) {
          const score = this.state.lessonScores[lesson.id];
          const isUnlocked = this.state.unlockedLessons.includes(lesson.id);
          if (isUnlocked && (!score || score.stars === 0)) {
            return { lesson, world, chapter };
          }
        }
      }
    }
    // Fallback to first
    const w = KIDS_CURRICULUM[0];
    const c = w?.chapters[0];
    const l = c?.lessons[0];
    if (w && c && l) return { lesson: l, world: w, chapter: c };
    return null;
  }
}

export const curriculumProgress = new CurriculumProgressEngine();

export const getKidsProgress = (): KidProgressState => curriculumProgress.getState();
export const updateKidsProgress = (state: KidProgressState): void => curriculumProgress.setState(state);
export const resetKidsProgress = (): void => curriculumProgress.reset();
export const completeLesson = (
  lessonId: string,
  stars: number,
  accuracy: number,
  weakWords: string[] = []
): void => {
  curriculumProgress.completeLesson(lessonId, stars, accuracy, weakWords);
};
export const getNextLessonToLearn = () => curriculumProgress.getNextLesson();

export default curriculumProgress;
