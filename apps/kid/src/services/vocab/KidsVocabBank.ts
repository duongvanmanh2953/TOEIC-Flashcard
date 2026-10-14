/**
 * KidsVocabBank.ts
 * Central Vocabulary Bank Service for Kids English Learning Games
 * 
 * Provides API for all mini-games to:
 * - Get random words by topic/category
 * - Get words by difficulty level (1=Easy, 2=Medium, 3=Hard)
 * - Get words by learning stage (sprout/plant/tree)
 * - Generate game rounds with correct answers + distractors
 * - Map words to their real 3D kawaii images
 * 
 * Zero external dependencies - works 100% offline
 */

import { COMPREHENSIVE_VOCABULARY, VocabularyItem } from '../../data/vocabulary/vocabularyData';

// =========================================================================
// IMAGE PATH AUTO-RESOLVER
// Maps vocabulary words to their 3D kawaii images in /kid/ public assets
// =========================================================================
const WORD_IMAGE_MAP: Record<string, string> = {
  // Animals (21 3D PNGs in /kid/animals/)
  cat: '/kid/animals/cat.png',
  dog: '/kid/animals/dog.png',
  rabbit: '/kid/animals/rabbit.png',
  lion: '/kid/animals/lion.png',
  elephant: '/kid/animals/elephant.png',
  bear: '/kid/animals/bear.png',
  monkey: '/kid/animals/monkey.png',
  frog: '/kid/animals/frog.png',
  bird: '/kid/animals/bird.png',
  duck: '/kid/animals/bird.png',
  fish: '/kid/animals/dolphin.png',
  turtle: '/kid/animals/turtle.png',
  butterfly: '/kid/animals/butterfly.png',
  horse: '/kid/animals/zebra.png',
  pig: '/kid/animals/panda.png',
  fox: '/kid/animals/fox.png',
  owl: '/kid/animals/owl.png',
  panda: '/kid/animals/panda.png',
  tiger: '/kid/animals/tiger.png',
  penguin: '/kid/animals/penguin.png',
  giraffe: '/kid/animals/giraffe.png',
  zebra: '/kid/animals/zebra.png',
  dolphin: '/kid/animals/dolphin.png',
  whale: '/kid/animals/whale.png',
  bee: '/kid/animals/bee.png',

  // Food & Fruits (Generated 3D kawaii JPGs)
  apple: '/kid/food/apple.jpg',
  banana: '/kid/food/banana.jpg',
  pizza: '/kid/food/pizza.jpg',
  burger: '/kid/food/burger.jpg',
  hamburger: '/kid/food/burger.jpg',
  milk: '/kid/food/milk.jpg',
  bread: '/kid/food/bread.jpg',
  carrot: '/kid/food/carrot.jpg',
  strawberry: '/kid/food/apple.jpg',
  cookie: '/kid/food/bread.jpg',

  // Transport (Generated 3D kawaii JPGs)
  car: '/kid/transport/car.jpg',
  bus: '/kid/transport/bus.jpg',
  train: '/kid/transport/train.jpg',
  rocket: '/kid/transport/rocket.jpg',
  airplane: '/kid/transport/rocket.jpg',
  boat: '/kid/transport/train.jpg',
  bicycle: '/kid/transport/car.jpg',

  // School
  book: '/kid/school/book.jpg',
  pencil: '/kid/school/book.jpg',

  // Rewards / Mascot
  star: '/kid/rewards/star.png',
  trophy: '/kid/rewards/trophy.png',
  crown: '/kid/rewards/crown.png',
};

/**
 * Resolve image path for a vocabulary word
 */
export function resolveWordImage(word: string): string | undefined {
  const normalized = word.toLowerCase().trim();
  return WORD_IMAGE_MAP[normalized];
}

// =========================================================================
// CATEGORY DEFINITIONS with Vietnamese labels
// =========================================================================
export interface VocabCategory {
  id: string;
  nameEn: string;
  nameVi: string;
  emoji: string;
  color: string;
}

export const VOCAB_CATEGORIES: VocabCategory[] = [
  { id: 'animals', nameEn: 'Animals', nameVi: 'Động Vật', emoji: '🐾', color: '#22c55e' },
  { id: 'fruits', nameEn: 'Food & Fruits', nameVi: 'Thức Ăn & Trái Cây', emoji: '🍎', color: '#ef4444' },
  { id: 'transport', nameEn: 'Transport', nameVi: 'Phương Tiện', emoji: '🚗', color: '#3b82f6' },
  { id: 'school', nameEn: 'School', nameVi: 'Trường Học', emoji: '📚', color: '#8b5cf6' },
  { id: 'nature', nameEn: 'Nature', nameVi: 'Thiên Nhiên', emoji: '🌳', color: '#10b981' },
  { id: 'family', nameEn: 'Family', nameVi: 'Gia Đình', emoji: '👨‍👩‍👧‍👦', color: '#f59e0b' },
  { id: 'colors', nameEn: 'Colors & Shapes', nameVi: 'Màu Sắc & Hình Dạng', emoji: '🎨', color: '#ec4899' },
  { id: 'numbers', nameEn: 'Numbers', nameVi: 'Số Đếm', emoji: '🔢', color: '#06b6d4' },
  { id: 'body', nameEn: 'Body Parts', nameVi: 'Bộ Phận Cơ Thể', emoji: '🖐️', color: '#f97316' },
  { id: 'clothes', nameEn: 'Clothes', nameVi: 'Quần Áo', emoji: '👕', color: '#a855f7' },
  { id: 'house', nameEn: 'House & Room', nameVi: 'Nhà Cửa', emoji: '🏠', color: '#14b8a6' },
  { id: 'actions', nameEn: 'Actions', nameVi: 'Hành Động', emoji: '🏃', color: '#ef4444' },
  { id: 'emotions', nameEn: 'Emotions', nameVi: 'Cảm Xúc', emoji: '😊', color: '#eab308' },
  { id: 'greetings', nameEn: 'Greetings', nameVi: 'Lời Chào', emoji: '👋', color: '#6366f1' },
];

// =========================================================================
// DIFFICULTY MAPPING (stage -> numeric difficulty)
// =========================================================================
function stageToDifficulty(stage?: string): 1 | 2 | 3 {
  if (stage === 'sprout') return 1;
  if (stage === 'plant') return 2;
  return 3; // 'tree' = mastered = can handle harder contexts
}

// =========================================================================
// UTILITY: Fisher-Yates Shuffle
// =========================================================================
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// =========================================================================
// GAME ROUND TYPES for mini-games
// =========================================================================

/** A single question for listen-and-find / multiple choice games */
export interface GameQuestion {
  correctWord: VocabularyItem;
  options: VocabularyItem[];
  imagePath?: string;
}

/** A pair for matching games */
export interface MatchPair {
  word: VocabularyItem;
  matchId: string;
}

// =========================================================================
// MAIN SERVICE CLASS
// =========================================================================
class KidsVocabBank {
  private allWords: VocabularyItem[];

  constructor() {
    // Enrich vocabulary with image paths and difficulty levels
    this.allWords = COMPREHENSIVE_VOCABULARY.map((item) => ({
      ...item,
      imagePath: item.imagePath || resolveWordImage(item.word),
      difficulty: item.difficulty || stageToDifficulty(item.stage),
    }));
  }

  // -----------------------------------------------------------------------
  // BASIC GETTERS
  // -----------------------------------------------------------------------

  /** Get all vocabulary items */
  getAll(): VocabularyItem[] {
    return this.allWords;
  }

  /** Get items that have real images */
  getWithImages(): VocabularyItem[] {
    return this.allWords.filter((w) => !!w.imagePath);
  }

  /** Get all available categories */
  getCategories(): VocabCategory[] {
    return VOCAB_CATEGORIES;
  }

  /** Get total word count */
  getTotalCount(): number {
    return this.allWords.length;
  }

  // -----------------------------------------------------------------------
  // FILTERING BY CATEGORY
  // -----------------------------------------------------------------------

  /** Get words by category (topic) */
  getByCategory(category: string): VocabularyItem[] {
    return this.allWords.filter((w) => w.category === category);
  }

  /** Get words from multiple categories */
  getByCategories(categories: string[]): VocabularyItem[] {
    const catSet = new Set(categories);
    return this.allWords.filter((w) => catSet.has(w.category));
  }

  // -----------------------------------------------------------------------
  // FILTERING BY DIFFICULTY / STAGE
  // -----------------------------------------------------------------------

  /** Get words by difficulty level (1=Easy, 2=Medium, 3=Hard) */
  getByDifficulty(difficulty: 1 | 2 | 3): VocabularyItem[] {
    return this.allWords.filter((w) => (w.difficulty || 3) === difficulty);
  }

  /** Get words up to a certain difficulty (inclusive) */
  getUpToDifficulty(maxDifficulty: 1 | 2 | 3): VocabularyItem[] {
    return this.allWords.filter((w) => (w.difficulty || 3) <= maxDifficulty);
  }

  /** Get words by learning stage */
  getByStage(stage: 'sprout' | 'plant' | 'tree'): VocabularyItem[] {
    return this.allWords.filter((w) => w.stage === stage);
  }

  // -----------------------------------------------------------------------
  // RANDOM SELECTION (for games)
  // -----------------------------------------------------------------------

  /** Get N random words from the entire bank */
  getRandom(count: number): VocabularyItem[] {
    return shuffle(this.allWords).slice(0, count);
  }

  /** Get N random words from a specific category */
  getRandomByCategory(category: string, count: number): VocabularyItem[] {
    const pool = this.getByCategory(category);
    return shuffle(pool).slice(0, count);
  }

  /** Get N random words filtered by category + max difficulty */
  getRandomFiltered(options: {
    category?: string;
    categories?: string[];
    maxDifficulty?: 1 | 2 | 3;
    requireImage?: boolean;
    count: number;
  }): VocabularyItem[] {
    let pool = [...this.allWords];

    if (options.category) {
      pool = pool.filter((w) => w.category === options.category);
    }
    if (options.categories && options.categories.length > 0) {
      const catSet = new Set(options.categories);
      pool = pool.filter((w) => catSet.has(w.category));
    }
    if (options.maxDifficulty) {
      pool = pool.filter((w) => (w.difficulty || 3) <= options.maxDifficulty!);
    }
    if (options.requireImage) {
      pool = pool.filter((w) => !!w.imagePath);
    }

    return shuffle(pool).slice(0, options.count);
  }

  // -----------------------------------------------------------------------
  // GAME-SPECIFIC GENERATORS
  // -----------------------------------------------------------------------

  /**
   * Generate a Listen-and-Find / Multiple Choice game round
   * Returns 1 correct answer + N-1 distractors from the same category
   */
  generateListenFindRound(options?: {
    category?: string;
    maxDifficulty?: 1 | 2 | 3;
    optionCount?: number;
    requireImage?: boolean;
  }): GameQuestion | null {
    const optionCount = options?.optionCount || 3;
    const requireImage = options?.requireImage !== false;

    let pool = requireImage ? this.getWithImages() : [...this.allWords];

    if (options?.category) {
      pool = pool.filter((w) => w.category === options.category);
    }
    if (options?.maxDifficulty) {
      pool = pool.filter((w) => (w.difficulty || 3) <= options.maxDifficulty!);
    }

    if (pool.length < optionCount) return null;

    const shuffled = shuffle(pool);
    const correct = shuffled[0];
    const distractors = shuffled.slice(1, optionCount);
    const allOptions = shuffle([correct, ...distractors]);

    return {
      correctWord: correct,
      options: allOptions,
      imagePath: correct.imagePath,
    };
  }

  /**
   * Generate multiple game rounds for a full level/lesson
   */
  generateGameLevel(options?: {
    category?: string;
    maxDifficulty?: 1 | 2 | 3;
    roundCount?: number;
    optionCount?: number;
  }): GameQuestion[] {
    const roundCount = options?.roundCount || 5;
    const optionCount = options?.optionCount || 3;
    const rounds: GameQuestion[] = [];

    let pool = this.getWithImages();
    if (options?.category) {
      pool = pool.filter((w) => w.category === options.category);
    }
    if (options?.maxDifficulty) {
      pool = pool.filter((w) => (w.difficulty || 3) <= options.maxDifficulty!);
    }

    const shuffledTargets = shuffle(pool).slice(0, roundCount);

    for (const target of shuffledTargets) {
      // Get distractors from same category preferably
      let distractorPool = pool.filter((w) => w.id !== target.id);
      if (distractorPool.length < optionCount - 1) {
        distractorPool = this.getWithImages().filter((w) => w.id !== target.id);
      }

      const distractors = shuffle(distractorPool).slice(0, optionCount - 1);
      const allOptions = shuffle([target, ...distractors]);

      rounds.push({
        correctWord: target,
        options: allOptions,
        imagePath: target.imagePath,
      });
    }

    return rounds;
  }

  /**
   * Generate matching pairs for memory/matching games
   */
  generateMatchPairs(options?: {
    category?: string;
    maxDifficulty?: 1 | 2 | 3;
    pairCount?: number;
  }): MatchPair[] {
    const pairCount = options?.pairCount || 6;
    const words = this.getRandomFiltered({
      category: options?.category,
      maxDifficulty: options?.maxDifficulty,
      requireImage: true,
      count: pairCount,
    });

    return words.map((w) => ({
      word: w,
      matchId: w.id,
    }));
  }

  /**
   * Get a word by its ID
   */
  getById(id: string): VocabularyItem | undefined {
    return this.allWords.find((w) => w.id === id);
  }

  /**
   * Search words by text (for admin/filtering)
   */
  search(query: string): VocabularyItem[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return this.allWords.filter(
      (w) =>
        w.word.toLowerCase().includes(q) ||
        w.viMeaning.toLowerCase().includes(q) ||
        w.category.toLowerCase().includes(q)
    );
  }

  /**
   * Get stats about the vocabulary bank
   */
  getStats(): {
    total: number;
    withImages: number;
    byCategory: Record<string, number>;
    byDifficulty: Record<number, number>;
  } {
    const byCategory: Record<string, number> = {};
    const byDifficulty: Record<number, number> = { 1: 0, 2: 0, 3: 0 };

    for (const w of this.allWords) {
      byCategory[w.category] = (byCategory[w.category] || 0) + 1;
      const diff = w.difficulty || 3;
      byDifficulty[diff] = (byDifficulty[diff] || 0) + 1;
    }

    return {
      total: this.allWords.length,
      withImages: this.getWithImages().length,
      byCategory,
      byDifficulty,
    };
  }
}

// Singleton export
export const kidsVocabBank = new KidsVocabBank();
export default kidsVocabBank;
