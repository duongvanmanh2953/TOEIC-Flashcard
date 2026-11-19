/**
 * VocabFlow Arena - Scoring Engine
 * 
 * Formula:
 *   FinalPoints = (BasePoints + SpeedBonus + StreakBonus) * RoundMultiplier
 * 
 * Invariants:
 * - Backend authoritative
 * - Idempotent calculations
 * - Deterministic tier-based speed bonuses
 * - Tie-breaker: Points -> Streak -> Submission Timestamp -> Accuracy
 */

export interface ScoreCalculationParams {
  isCorrect: boolean;
  responseTimeMs: number;
  currentStreak: number;
  roundMultiplier?: number;
  basePoints?: number;
  maxTimeAllowedMs?: number;
}

export interface ScoreCalculationResult {
  isCorrect: boolean;
  basePoints: number;
  speedBonus: number;
  streakBonus: number;
  roundMultiplier: number;
  totalEarned: number;
  newStreak: number;
  speedTier: 'INSTANT' | 'FAST' | 'SOLID' | 'NORMAL' | 'LATE' | 'NONE';
  streakTier: 'NONE' | 'DOUBLE' | 'TRIPLE' | 'ELITE' | 'LEGENDARY';
}

export class ArenaScoringEngine {
  public static readonly DEFAULT_BASE_POINTS = 700;
  public static readonly MAX_SPEED_BONUS = 300;
  public static readonly MAX_STREAK_BONUS = 200;

  /**
   * Determine Speed Bonus by strict tier rather than millisecond jitter
   */
  public static calculateSpeedBonus(
    responseTimeMs: number,
    maxTimeAllowedMs: number = 15000,
  ): { bonus: number; tier: ScoreCalculationResult['speedTier'] } {
    if (responseTimeMs <= 0) {
      return { bonus: 300, tier: 'INSTANT' };
    }

    // Relative fraction of time used
    const ratio = Math.min(1.0, responseTimeMs / maxTimeAllowedMs);

    if (ratio <= 0.15 || responseTimeMs <= 2000) {
      return { bonus: 300, tier: 'INSTANT' };
    } else if (ratio <= 0.35 || responseTimeMs <= 4500) {
      return { bonus: 220, tier: 'FAST' };
    } else if (ratio <= 0.60 || responseTimeMs <= 8000) {
      return { bonus: 140, tier: 'SOLID' };
    } else if (ratio <= 0.85 || responseTimeMs <= 12000) {
      return { bonus: 80, tier: 'NORMAL' };
    } else {
      return { bonus: 40, tier: 'LATE' };
    }
  }

  /**
   * Calculate Streak Bonus
   */
  public static calculateStreakBonus(streak: number): {
    bonus: number;
    tier: ScoreCalculationResult['streakTier'];
  } {
    if (streak >= 7) {
      return { bonus: 200, tier: 'LEGENDARY' };
    } else if (streak >= 5) {
      return { bonus: 150, tier: 'ELITE' };
    } else if (streak >= 3) {
      return { bonus: 100, tier: 'TRIPLE' };
    } else if (streak >= 2) {
      return { bonus: 50, tier: 'DOUBLE' };
    }
    return { bonus: 0, tier: 'NONE' };
  }

  /**
   * Calculate final points with full idempotency
   */
  public static calculateScore(params: ScoreCalculationParams): ScoreCalculationResult {
    const {
      isCorrect,
      responseTimeMs,
      currentStreak,
      roundMultiplier = 1.0,
      basePoints = ArenaScoringEngine.DEFAULT_BASE_POINTS,
      maxTimeAllowedMs = 15000,
    } = params;

    if (!isCorrect) {
      return {
        isCorrect: false,
        basePoints: 0,
        speedBonus: 0,
        streakBonus: 0,
        roundMultiplier,
        totalEarned: 0,
        newStreak: 0,
        speedTier: 'NONE',
        streakTier: 'NONE',
      };
    }

    const newStreak = currentStreak + 1;
    const { bonus: speedBonus, tier: speedTier } = this.calculateSpeedBonus(responseTimeMs, maxTimeAllowedMs);
    const { bonus: streakBonus, tier: streakTier } = this.calculateStreakBonus(newStreak);

    const safeMultiplier = Math.max(1.0, roundMultiplier);
    const unscaledTotal = basePoints + speedBonus + streakBonus;
    const totalEarned = Math.round(unscaledTotal * safeMultiplier);

    return {
      isCorrect: true,
      basePoints,
      speedBonus,
      streakBonus,
      roundMultiplier: safeMultiplier,
      totalEarned,
      newStreak,
      speedTier,
      streakTier,
    };
  }

  /**
   * Esports Tie-Breaker Comparator
   * 1. Total Score (DESC)
   * 2. Highest / Current Streak (DESC)
   * 3. Earliest Submission Timestamp (ASC)
   * 4. Total Correct Answers (DESC)
   */
  public static sortLeaderboard<T extends {
    score: number;
    streak?: number;
    lastAnswerTimestamp?: number;
    correctCount?: number;
  }>(players: T[]): T[] {
    return [...players].sort((a, b) => {
      // 1. Score
      if (b.score !== a.score) return b.score - a.score;
      // 2. Streak
      const streakA = a.streak || 0;
      const streakB = b.streak || 0;
      if (streakB !== streakA) return streakB - streakA;
      // 3. Earliest timestamp (faster overall)
      const timeA = a.lastAnswerTimestamp || Number.MAX_SAFE_INTEGER;
      const timeB = b.lastAnswerTimestamp || Number.MAX_SAFE_INTEGER;
      if (timeA !== timeB) return timeA - timeB;
      // 4. Correct Count
      const correctA = a.correctCount || 0;
      const correctB = b.correctCount || 0;
      return correctB - correctA;
    });
  }
}

// Re-export audio utility for convenience
export { playVictoryFanfare } from '../utils/feedbackSound';

