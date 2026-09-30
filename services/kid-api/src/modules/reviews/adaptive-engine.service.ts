import { Injectable } from '@nestjs/common';
import { VocabStatus } from '@prisma/client';

export interface EvaluationInput {
  correct: boolean;
  responseTimeMs: number;
  confidence: number; // 1 to 5
  hintUsed: boolean;
  currentStability: number; // in days
  currentDifficulty: number; // 1.0 to 10.0
  currentMastery: number; // 0 to 100
  repetitionCount: number;
}

export interface EvaluationResult {
  newStability: number; // days until next review
  newDifficulty: number;
  newMasteryScore: number;
  retrievability: number;
  status: VocabStatus;
  nextReviewDate: Date;
  xpEarned: number;
}

@Injectable()
export class AdaptiveEngineService {
  /**
   * Adaptive Spaced Repetition Algorithm
   * Integrates response time, confidence, hint penalty, and spaced interval calculation.
   */
  evaluateReview(input: EvaluationInput): EvaluationResult {
    const {
      correct,
      responseTimeMs,
      confidence,
      hintUsed,
      currentStability,
      currentDifficulty,
      currentMastery,
      repetitionCount,
    } = input;

    // 1. Calculate Performance Quality Factor (Q: 0.0 to 1.0)
    let quality = correct ? 0.7 : 0.1;

    // Speed bonus/penalty (< 2000ms is swift, > 7000ms is hesitant)
    if (correct) {
      if (responseTimeMs < 2500) quality += 0.15;
      else if (responseTimeMs > 6000) quality -= 0.1;

      // Confidence factor (1-5)
      quality += (confidence - 3) * 0.05;

      // Hint penalty
      if (hintUsed) quality -= 0.25;
    }

    quality = Math.max(0.05, Math.min(1.0, quality));

    // 2. Adjust Difficulty (D: 1.0 to 10.0)
    // If quality is low, difficulty rises; if quality is high, difficulty slightly decreases
    let newDifficulty = currentDifficulty + (0.5 - quality) * 0.8;
    newDifficulty = Math.max(1.0, Math.min(10.0, Number(newDifficulty.toFixed(2))));

    // 3. Adjust Stability (S in days)
    let newStability = currentStability;
    if (correct && !hintUsed) {
      // Successful recall increases stability exponentially modulated by difficulty
      const growthFactor = 1.6 + (10 - newDifficulty) * 0.1 + confidence * 0.1;
      newStability = currentStability * growthFactor;
    } else if (correct && hintUsed) {
      // Partial recall
      newStability = Math.max(1.0, currentStability * 1.1);
    } else {
      // Memory lapse / lapse failure
      newStability = Math.max(0.5, currentStability * 0.3); // Severe drop
    }

    newStability = Math.max(0.5, Number(newStability.toFixed(2)));

    // 4. Calculate Retrievability (Probability of recall at current moment)
    const retrievability = Math.max(0.1, Math.min(1.0, Number(Math.exp(-1.0 / newStability).toFixed(3))));

    // 5. Calculate Mastery Score (0 to 100)
    let masteryDelta = 0;
    if (correct) {
      masteryDelta = 8 + (confidence >= 4 ? 4 : 0) - (hintUsed ? 5 : 0) + (responseTimeMs < 3000 ? 3 : 0);
    } else {
      masteryDelta = -15;
    }

    let newMasteryScore = Math.max(0, Math.min(100, Math.round(currentMastery + masteryDelta)));

    // 6. Determine Vocab Status
    let status: VocabStatus = VocabStatus.LEARNING;
    if (newMasteryScore >= 95 && repetitionCount >= 4) {
      status = VocabStatus.MASTERED;
    } else if (newMasteryScore >= 80) {
      status = VocabStatus.STRONG;
    } else if (newMasteryScore >= 60) {
      status = VocabStatus.REVIEW;
    } else if (newMasteryScore >= 40) {
      status = VocabStatus.FAMILIAR;
    } else if (newMasteryScore > 0) {
      status = VocabStatus.LEARNING;
    } else {
      status = VocabStatus.NEW;
    }

    // 7. Calculate Next Review Date
    // If incorrect or hint used, review within 6 to 12 hours
    let hoursToAdd = 0;
    if (!correct) {
      hoursToAdd = 6;
    } else if (hintUsed) {
      hoursToAdd = 14;
    } else {
      hoursToAdd = Math.round(newStability * 24);
    }

    const nextReviewDate = new Date(Date.now() + hoursToAdd * 3600 * 1000);

    // 8. Calculate XP Earned
    let xpEarned = 0;
    if (correct) {
      xpEarned = 10;
      if (confidence >= 4) xpEarned += 3;
      if (responseTimeMs < 3000) xpEarned += 2;
      if (hintUsed) xpEarned = Math.max(3, xpEarned - 5);
    } else {
      xpEarned = 2; // Encouragement XP
    }

    return {
      newStability,
      newDifficulty,
      newMasteryScore,
      retrievability,
      status,
      nextReviewDate,
      xpEarned,
    };
  }
}
