import { GameModeType } from '@prisma/client';
import { IGameMode, AnswerEvaluation, GameQuestionPayload } from './game-mode.interface';

/**
 * Text normalizer helper for English and Vietnamese
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\.,\?!;:"'’]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Calculate Levenshtein similarity percentage (0 - 100)
 */
export function calculateSimilarity(s1: string, s2: string): number {
  const a = normalizeText(s1);
  const b = normalizeText(s2);
  if (a === b) return 100;
  if (a.length === 0 || b.length === 0) return 0;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  const distance = matrix[b.length][a.length];
  const maxLen = Math.max(a.length, b.length);
  return Math.max(0, Math.round(((maxLen - distance) / maxLen) * 100));
}

/**
 * Common speed and streak bonus calculation
 */
function calculateSpeedBonus(responseTimeMs: number, maxRoundDurationMs: number = 15000): number {
  if (responseTimeMs <= 0) return 0;
  // If answered in under 2 seconds: max 200 pts
  if (responseTimeMs <= 2000) return 200;
  // Linear decay between 2s and max round duration
  const ratio = Math.max(0, (maxRoundDurationMs - responseTimeMs) / (maxRoundDurationMs - 2000));
  return Math.round(ratio * 200);
}

function calculateStreakBonus(currentStreak: number): number {
  if (currentStreak < 2) return 0;
  if (currentStreak >= 10) return 150;
  if (currentStreak >= 5) return 100;
  return currentStreak * 15;
}

/**
 * 1. GAME: Translation Rush (EN ↔ VI & Sentences)
 */
export class TranslationRushMode implements IGameMode {
  readonly modeType = GameModeType.TRANSLATION_RUSH;
  readonly name = 'Translation Rush';
  readonly defaultDurationSec = 15;

  async evaluate(
    question: GameQuestionPayload,
    answer: string,
    responseTimeMs: number,
    currentStreak: number,
  ): Promise<AnswerEvaluation> {
    const rawAnswer = answer?.trim() || '';
    if (!rawAnswer) {
      return {
        isCorrect: false,
        accuracy: 0,
        semanticSimilarity: 0,
        speedBonus: 0,
        streakBonus: 0,
        score: 0,
        feedbackText: 'Chưa có câu trả lời (Time expired)',
      };
    }

    const allAccepted = [question.correctAnswer, ...(question.acceptedAnswers || [])];
    let bestSimilarity = 0;
    let matchedAnswer = question.correctAnswer;

    for (const target of allAccepted) {
      const sim = calculateSimilarity(rawAnswer, target);
      if (sim > bestSimilarity) {
        bestSimilarity = sim;
        matchedAnswer = target;
      }
    }

    // High accuracy if exact or similarity >= 85%
    const isCorrect = bestSimilarity >= 80;
    const accuracy = bestSimilarity;
    const semanticSimilarity = bestSimilarity >= 90 ? 100 : bestSimilarity;

    let score = 0;
    let speedBonus = 0;
    let streakBonus = 0;

    if (isCorrect) {
      // Balanced formula: accuracy base (up to 700) + speed bonus (up to 200) + streak bonus (up to 150)
      const baseScore = Math.round((accuracy / 100) * 650);
      speedBonus = calculateSpeedBonus(responseTimeMs);
      streakBonus = calculateStreakBonus(currentStreak);
      score = baseScore + speedBonus + streakBonus;
    } else if (bestSimilarity >= 60) {
      // Partial credit for close answers
      score = Math.round((bestSimilarity / 100) * 200);
    }

    const feedbackText = isCorrect
      ? accuracy >= 95
        ? 'Chính xác hoàn hảo! Phản xạ xuất sắc.'
        : `Đúng nghĩa! (${matchedAnswer})`
      : `Chưa chính xác. Đáp án chuẩn: "${question.correctAnswer}"`;

    return {
      isCorrect,
      accuracy,
      semanticSimilarity,
      speedBonus,
      streakBonus,
      score,
      feedbackText,
      matchedAnswer,
    };
  }
}

/**
 * 2. GAME: Word Blitz (Synonyms, Antonyms, Rapid Definitions)
 */
export class WordBlitzMode implements IGameMode {
  readonly modeType = GameModeType.WORD_BLITZ;
  readonly name = 'Word Blitz';
  readonly defaultDurationSec = 12;

  async evaluate(
    question: GameQuestionPayload,
    answer: string,
    responseTimeMs: number,
    currentStreak: number,
  ): Promise<AnswerEvaluation> {
    const rawAnswer = answer?.trim() || '';
    if (!rawAnswer) {
      return {
        isCorrect: false,
        accuracy: 0,
        semanticSimilarity: 0,
        speedBonus: 0,
        streakBonus: 0,
        score: 0,
        feedbackText: 'Hết giờ!',
      };
    }

    const allAccepted = [question.correctAnswer, ...(question.acceptedAnswers || [])];
    let bestSimilarity = 0;
    let matched = question.correctAnswer;

    for (const target of allAccepted) {
      const sim = calculateSimilarity(rawAnswer, target);
      if (sim > bestSimilarity) {
        bestSimilarity = sim;
        matched = target;
      }
    }

    const isCorrect = bestSimilarity >= 82;
    const speedBonus = isCorrect ? calculateSpeedBonus(responseTimeMs, 12000) : 0;
    const streakBonus = isCorrect ? calculateStreakBonus(currentStreak) : 0;
    const score = isCorrect ? 600 + speedBonus + streakBonus : 0;

    return {
      isCorrect,
      accuracy: bestSimilarity,
      semanticSimilarity: bestSimilarity,
      speedBonus,
      streakBonus,
      score,
      feedbackText: isCorrect ? `Tuyệt vời! (${matched})` : `Gợi ý: ${question.correctAnswer}`,
      matchedAnswer: matched,
    };
  }
}

/**
 * 3. GAME: Sentence Sprint (Create full sentence from keyword)
 */
export class SentenceSprintMode implements IGameMode {
  readonly modeType = GameModeType.SENTENCE_SPRINT;
  readonly name = 'Sentence Sprint';
  readonly defaultDurationSec = 20;

  async evaluate(
    question: GameQuestionPayload,
    answer: string,
    responseTimeMs: number,
    currentStreak: number,
  ): Promise<AnswerEvaluation> {
    const raw = answer?.trim() || '';
    const words = raw.split(/\s+/).filter(Boolean);
    const keyword = normalizeText(question.prompt);

    // Rule 1: Must contain keyword
    const containsKeyword = normalizeText(raw).includes(keyword);
    // Rule 2: Length sanity (> 3 words)
    const hasEnoughWords = words.length >= 4;

    let isCorrect = containsKeyword && hasEnoughWords;
    let accuracy = isCorrect ? 90 : 30;

    // Check if closely matches any reference answers
    const allAccepted = [question.correctAnswer, ...(question.acceptedAnswers || [])];
    for (const ref of allAccepted) {
      const sim = calculateSimilarity(raw, ref);
      if (sim >= 75) {
        accuracy = Math.max(accuracy, sim);
        isCorrect = true;
      }
    }

    const speedBonus = isCorrect ? calculateSpeedBonus(responseTimeMs, 20000) : 0;
    const streakBonus = isCorrect ? calculateStreakBonus(currentStreak) : 0;
    const score = isCorrect ? Math.round((accuracy / 100) * 700) + speedBonus + streakBonus : 50;

    const feedbackText = isCorrect
      ? 'Câu ngữ pháp tốt, đạt chuẩn ngữ cảnh!'
      : !containsKeyword
      ? `Câu cần chứa từ khóa "${question.prompt}".`
      : 'Câu quá ngắn, cần viết câu hoàn chỉnh có chủ ngữ - vị ngữ.';

    return {
      isCorrect,
      accuracy,
      semanticSimilarity: accuracy,
      speedBonus,
      streakBonus,
      score,
      feedbackText,
      matchedAnswer: question.correctAnswer,
    };
  }
}

/**
 * 4. GAME: Missing Word (Cloze Context Test)
 */
export class MissingWordMode implements IGameMode {
  readonly modeType = GameModeType.MISSING_WORD;
  readonly name = 'Missing Word Cloze';
  readonly defaultDurationSec = 12;

  async evaluate(
    question: GameQuestionPayload,
    answer: string,
    responseTimeMs: number,
    currentStreak: number,
  ): Promise<AnswerEvaluation> {
    const rawAnswer = normalizeText(answer || '');
    const allAccepted = [question.correctAnswer, ...(question.acceptedAnswers || [])].map(normalizeText);

    const isCorrect = allAccepted.includes(rawAnswer);
    const speedBonus = isCorrect ? calculateSpeedBonus(responseTimeMs, 12000) : 0;
    const streakBonus = isCorrect ? calculateStreakBonus(currentStreak) : 0;
    const score = isCorrect ? 600 + speedBonus + streakBonus : 0;

    return {
      isCorrect,
      accuracy: isCorrect ? 100 : 0,
      semanticSimilarity: isCorrect ? 100 : 0,
      speedBonus,
      streakBonus,
      score,
      feedbackText: isCorrect ? 'Điền từ chính xác!' : `Từ đúng là: "${question.correctAnswer}"`,
      matchedAnswer: question.correctAnswer,
    };
  }
}

/**
 * 5. GAME: Fix The Sentence (Grammar & Collocation correction)
 */
export class FixSentenceMode implements IGameMode {
  readonly modeType = GameModeType.FIX_SENTENCE;
  readonly name = 'Fix The Sentence';
  readonly defaultDurationSec = 18;

  async evaluate(
    question: GameQuestionPayload,
    answer: string,
    responseTimeMs: number,
    currentStreak: number,
  ): Promise<AnswerEvaluation> {
    const rawAnswer = answer?.trim() || '';
    const allAccepted = [question.correctAnswer, ...(question.acceptedAnswers || [])];

    let bestSimilarity = 0;
    for (const ref of allAccepted) {
      const sim = calculateSimilarity(rawAnswer, ref);
      if (sim > bestSimilarity) bestSimilarity = sim;
    }

    const isCorrect = bestSimilarity >= 88;
    const speedBonus = isCorrect ? calculateSpeedBonus(responseTimeMs, 18000) : 0;
    const streakBonus = isCorrect ? calculateStreakBonus(currentStreak) : 0;
    const score = isCorrect ? Math.round((bestSimilarity / 100) * 700) + speedBonus + streakBonus : 0;

    return {
      isCorrect,
      accuracy: bestSimilarity,
      semanticSimilarity: bestSimilarity,
      speedBonus,
      streakBonus,
      score,
      feedbackText: isCorrect
        ? 'Sửa lỗi chính xác hoàn hảo!'
        : `Câu chuẩn: "${question.correctAnswer}" (${question.explanation || ''})`,
      matchedAnswer: question.correctAnswer,
    };
  }
}

/**
 * 6. GAME: Synonym Battle
 */
export class SynonymBattleMode implements IGameMode {
  readonly modeType = GameModeType.SYNONYM_BATTLE;
  readonly name = 'Synonym Battle';
  readonly defaultDurationSec = 15;

  async evaluate(
    question: GameQuestionPayload,
    answer: string,
    responseTimeMs: number,
    currentStreak: number,
  ): Promise<AnswerEvaluation> {
    const rawAnswer = normalizeText(answer || '');
    const allAccepted = [question.correctAnswer, ...(question.acceptedAnswers || [])].map(normalizeText);

    let isCorrect = allAccepted.includes(rawAnswer);
    let bestSim = isCorrect ? 100 : 0;

    if (!isCorrect) {
      for (const target of allAccepted) {
        const sim = calculateSimilarity(rawAnswer, target);
        if (sim >= 85) {
          isCorrect = true;
          bestSim = sim;
          break;
        }
      }
    }

    const speedBonus = isCorrect ? calculateSpeedBonus(responseTimeMs, 15000) : 0;
    const streakBonus = isCorrect ? calculateStreakBonus(currentStreak) : 0;
    const score = isCorrect ? 650 + speedBonus + streakBonus : 0;

    return {
      isCorrect,
      accuracy: bestSim,
      semanticSimilarity: bestSim,
      speedBonus,
      streakBonus,
      score,
      feedbackText: isCorrect
        ? 'Từ đồng nghĩa chuẩn xác!'
        : `Gợi ý các từ đồng nghĩa: ${[question.correctAnswer, ...(question.acceptedAnswers || [])].join(', ')}`,
      matchedAnswer: question.correctAnswer,
    };
  }
}

/**
 * Game Mode Registry
 */
export const GAME_MODE_REGISTRY: Record<GameModeType, IGameMode> = {
  [GameModeType.TRANSLATION_RUSH]: new TranslationRushMode(),
  [GameModeType.WORD_BLITZ]: new WordBlitzMode(),
  [GameModeType.SENTENCE_SPRINT]: new SentenceSprintMode(),
  [GameModeType.MISSING_WORD]: new MissingWordMode(),
  [GameModeType.FIX_SENTENCE]: new FixSentenceMode(),
  [GameModeType.SYNONYM_BATTLE]: new SynonymBattleMode(),
  [GameModeType.LISTENING_RUSH]: new TranslationRushMode(), // uses audio playback variant
  [GameModeType.GUESS_WORD]: new WordBlitzMode(),
};
