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
 * Universal option & text matching helper supporting A/B/C/D choices, numbers 1-4,
 * exact target script (Kanji/Kana, Hangul, Hanzi, Thai) and Vietnamese meanings.
 */
export function matchPlayerAnswer(
  rawAnswer: string,
  question: GameQuestionPayload,
): { isMatch: boolean; similarity: number; matchedAnswer: string } {
  const clean = rawAnswer?.trim() || '';
  if (!clean) return { isMatch: false, similarity: 0, matchedAnswer: '' };

  const letters = ['A', 'B', 'C', 'D'];
  const upper = clean.toUpperCase();

  // 1. Multiple-choice option letter/index matching
  if (typeof question.correctOptionIndex === 'number' && question.correctOptionIndex >= 0 && question.correctOptionIndex < 4) {
    const correctLetter = letters[question.correctOptionIndex];
    // Check if player sent "A", "B", "C", "D" (or "A.", "A)", "đáp án A")
    const letterMatch = upper.match(/^[ABCD]$/) || upper.match(/^([ABCD])[\.\:\)\s]/) || upper.match(/(?:ĐÁP ÁN|CHỌN|CÂU)\s*([ABCD])/);
    if (letterMatch) {
      const chosenLetter = letterMatch[1] || letterMatch[0];
      if (chosenLetter === correctLetter) {
        return { isMatch: true, similarity: 100, matchedAnswer: correctLetter };
      } else {
        return { isMatch: false, similarity: 0, matchedAnswer: chosenLetter };
      }
    }

    // Check if player sent number 1, 2, 3, 4
    const numberMatch = clean.match(/^[1234]$/);
    if (numberMatch) {
      const chosenIndex = parseInt(numberMatch[0], 10) - 1;
      if (chosenIndex === question.correctOptionIndex) {
        return { isMatch: true, similarity: 100, matchedAnswer: correctLetter };
      } else {
        return { isMatch: false, similarity: 0, matchedAnswer: letters[chosenIndex] || '' };
      }
    }
  }

  // 2. Direct match with target word or phonetic
  if (question.targetWord && normalizeText(clean) === normalizeText(question.targetWord)) {
    return { isMatch: true, similarity: 100, matchedAnswer: question.targetWord };
  }
  if (question.phonetic && normalizeText(clean) === normalizeText(question.phonetic)) {
    return { isMatch: true, similarity: 100, matchedAnswer: question.phonetic };
  }

  // 3. Match against accepted answers and correct answer
  const allAccepted = [question.correctAnswer, ...(question.acceptedAnswers || [])].filter(Boolean);
  let bestSimilarity = 0;
  let matchedAnswer = question.correctAnswer || '';

  for (const target of allAccepted) {
    const sim = calculateSimilarity(clean, target);
    if (sim > bestSimilarity) {
      bestSimilarity = sim;
      matchedAnswer = target;
    }
  }

  // 4. Also check against text of the correct option if options are present
  if (question.options && typeof question.correctOptionIndex === 'number') {
    const correctOptionText = question.options[question.correctOptionIndex];
    if (correctOptionText) {
      const optionContent = correctOptionText.replace(/^[ABCD][\.\:]\s*/i, '');
      const optSim = calculateSimilarity(clean, optionContent);
      if (optSim > bestSimilarity) {
        bestSimilarity = optSim;
        matchedAnswer = optionContent;
      }
    }
  }

  return {
    isMatch: bestSimilarity >= 80,
    similarity: bestSimilarity,
    matchedAnswer,
  };
}

/**
 * Common speed and streak bonus calculation
 */
export function calculateSpeedBonus(
  responseTimeMs: number,
  maxRoundDurationMs: number = 15000,
): number {
  if (responseTimeMs <= 0) return 300;
  if (responseTimeMs <= 2000) return 300;
  if (responseTimeMs <= 4500) return 220;
  if (responseTimeMs <= 8000) return 140;
  if (responseTimeMs <= 12000) return 80;
  return 40;
}

export function calculateStreakBonus(currentStreak: number): number {
  if (currentStreak >= 7) return 200;
  if (currentStreak >= 5) return 150;
  if (currentStreak >= 3) return 100;
  if (currentStreak >= 2) return 50;
  return 0;
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

    const matchResult = matchPlayerAnswer(rawAnswer, question);
    const isCorrect = matchResult.isMatch;
    const accuracy = matchResult.similarity;
    const semanticSimilarity = accuracy >= 90 ? 100 : accuracy;
    const matchedAnswer = matchResult.matchedAnswer || question.correctAnswer;

    let score = 0;
    let speedBonus = 0;
    let streakBonus = 0;

    if (isCorrect) {
      // Balanced formula: accuracy base (up to 650) + speed bonus (up to 200) + streak bonus (up to 150)
      const baseScore = Math.round((accuracy / 100) * 650);
      speedBonus = calculateSpeedBonus(responseTimeMs);
      streakBonus = calculateStreakBonus(currentStreak);
      score = baseScore + speedBonus + streakBonus;
    } else if (accuracy >= 60) {
      // Partial credit for close answers
      score = Math.round((accuracy / 100) * 200);
    }

    const feedbackText = isCorrect
      ? accuracy >= 95
        ? 'Chính xác hoàn hảo! Phản xạ xuất sắc.'
        : `Đúng nghĩa! (${matchedAnswer})`
      : `Chưa chính xác. Đáp án chuẩn: "${question.options?.[question.correctOptionIndex || 0] || question.correctAnswer}"`;

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
 * 7. GAME: Classic Quiz (Esports Standard 4-choice)
 */
export class ClassicQuizMode implements IGameMode {
  readonly modeType = GameModeType.CLASSIC_QUIZ;
  readonly name = 'Classic Quiz';
  readonly defaultDurationSec = 15;

  async evaluate(
    question: GameQuestionPayload,
    answer: string,
    responseTimeMs: number,
    currentStreak: number,
  ): Promise<AnswerEvaluation> {
    const match = matchPlayerAnswer(answer, question);
    const speedBonus = match.isMatch ? calculateSpeedBonus(responseTimeMs, 15000) : 0;
    const streakBonus = match.isMatch ? calculateStreakBonus(currentStreak) : 0;
    const score = match.isMatch ? 700 + speedBonus + streakBonus : 0;

    return {
      isCorrect: match.isMatch,
      accuracy: match.isMatch ? 100 : 0,
      semanticSimilarity: match.similarity,
      speedBonus,
      streakBonus,
      score,
      feedbackText: match.isMatch
        ? 'Chính xác! Phản xạ xuất sắc!'
        : `Đáp án đúng là ${question.correctAnswer}. ${question.explanation || ''}`,
      matchedAnswer: match.matchedAnswer,
    };
  }
}

/**
 * 8. GAME: Survival Arena (3 Hearts / Lives Elimination)
 */
export class SurvivalMode implements IGameMode {
  readonly modeType = GameModeType.SURVIVAL;
  readonly name = 'Survival Arena';
  readonly defaultDurationSec = 12;

  async evaluate(
    question: GameQuestionPayload,
    answer: string,
    responseTimeMs: number,
    currentStreak: number,
  ): Promise<AnswerEvaluation> {
    const match = matchPlayerAnswer(answer, question);
    const speedBonus = match.isMatch ? calculateSpeedBonus(responseTimeMs, 12000) : 0;
    const streakBonus = match.isMatch ? calculateStreakBonus(currentStreak) : 0;
    // Survival bonus multiplier 1.25x
    const score = match.isMatch ? Math.round((700 + speedBonus + streakBonus) * 1.25) : 0;

    return {
      isCorrect: match.isMatch,
      accuracy: match.isMatch ? 100 : 0,
      semanticSimilarity: match.similarity,
      speedBonus,
      streakBonus,
      score,
      feedbackText: match.isMatch
        ? 'Bảo toàn mạng sống thành công!'
        : `Sai một câu mất 1 mạng! Đáp án đúng: ${question.correctAnswer}`,
      matchedAnswer: match.matchedAnswer,
    };
  }
}

/**
 * 9. GAME: 1vs1 Duel (Head-to-head match)
 */
export class DuelMode implements IGameMode {
  readonly modeType = GameModeType.DUEL;
  readonly name = '1vs1 Duel';
  readonly defaultDurationSec = 12;

  async evaluate(
    question: GameQuestionPayload,
    answer: string,
    responseTimeMs: number,
    currentStreak: number,
  ): Promise<AnswerEvaluation> {
    const match = matchPlayerAnswer(answer, question);
    const speedBonus = match.isMatch ? calculateSpeedBonus(responseTimeMs, 12000) : 0;
    const streakBonus = match.isMatch ? calculateStreakBonus(currentStreak) : 0;
    const score = match.isMatch ? Math.round((700 + speedBonus + streakBonus) * 1.2) : 0;

    return {
      isCorrect: match.isMatch,
      accuracy: match.isMatch ? 100 : 0,
      semanticSimilarity: match.similarity,
      speedBonus,
      streakBonus,
      score,
      feedbackText: match.isMatch
        ? 'Ra đòn chuẩn xác!'
        : `Lỡ đòn! Đáp án chuẩn: ${question.correctAnswer}`,
      matchedAnswer: match.matchedAnswer,
    };
  }
}

/**
 * 10. GAME: Team Battle (Red vs Blue Faction War)
 */
export class TeamBattleMode implements IGameMode {
  readonly modeType = GameModeType.TEAM_BATTLE;
  readonly name = 'Team Battle';
  readonly defaultDurationSec = 15;

  async evaluate(
    question: GameQuestionPayload,
    answer: string,
    responseTimeMs: number,
    currentStreak: number,
  ): Promise<AnswerEvaluation> {
    const match = matchPlayerAnswer(answer, question);
    const speedBonus = match.isMatch ? calculateSpeedBonus(responseTimeMs, 15000) : 0;
    const streakBonus = match.isMatch ? calculateStreakBonus(currentStreak) : 0;
    const score = match.isMatch ? Math.round((700 + speedBonus + streakBonus) * 1.1) : 0;

    return {
      isCorrect: match.isMatch,
      accuracy: match.isMatch ? 100 : 0,
      semanticSimilarity: match.similarity,
      speedBonus,
      streakBonus,
      score,
      feedbackText: match.isMatch
        ? 'Ghi điểm vẻ vang cho đội!'
        : `Đáp án đúng là: ${question.correctAnswer}`,
      matchedAnswer: match.matchedAnswer,
    };
  }
}

/**
 * 11. GAME: Word Rush (Scrambled & Typing Challenge)
 */
export class WordRushMode implements IGameMode {
  readonly modeType = GameModeType.WORD_RUSH;
  readonly name = 'Word Rush';
  readonly defaultDurationSec = 20;

  async evaluate(
    question: GameQuestionPayload,
    answer: string,
    responseTimeMs: number,
    currentStreak: number,
  ): Promise<AnswerEvaluation> {
    const match = matchPlayerAnswer(answer, question);
    const speedBonus = match.isMatch ? calculateSpeedBonus(responseTimeMs, 20000) : 0;
    const streakBonus = match.isMatch ? calculateStreakBonus(currentStreak) : 0;
    const score = match.isMatch ? Math.round((700 + speedBonus + streakBonus) * 1.3) : 0;

    return {
      isCorrect: match.isMatch,
      accuracy: match.isMatch ? 100 : 0,
      semanticSimilarity: match.similarity,
      speedBonus,
      streakBonus,
      score,
      feedbackText: match.isMatch
        ? 'Giải mã từ vựng thần tốc!'
        : `Từ đúng: ${question.targetWord || question.correctAnswer}`,
      matchedAnswer: match.matchedAnswer,
    };
  }
}

/**
 * 12. GAME: Boss Round (Double Points x2)
 */
export class BossRoundMode implements IGameMode {
  readonly modeType = GameModeType.BOSS_ROUND;
  readonly name = 'Boss Round';
  readonly defaultDurationSec = 25;

  async evaluate(
    question: GameQuestionPayload,
    answer: string,
    responseTimeMs: number,
    currentStreak: number,
  ): Promise<AnswerEvaluation> {
    const match = matchPlayerAnswer(answer, question);
    const speedBonus = match.isMatch ? calculateSpeedBonus(responseTimeMs, 25000) : 0;
    const streakBonus = match.isMatch ? calculateStreakBonus(currentStreak) : 0;
    const score = match.isMatch ? Math.round((700 + speedBonus + streakBonus) * 2.0) : 0;

    return {
      isCorrect: match.isMatch,
      accuracy: match.isMatch ? 100 : 0,
      semanticSimilarity: match.similarity,
      speedBonus,
      streakBonus,
      score,
      feedbackText: match.isMatch
        ? 'HẠ GỤC TRÙM THÀNH CÔNG! Nhận x2 điểm thưởng!'
        : `Trùm quá mạnh! Đáp án chính xác: ${question.correctAnswer}`,
      matchedAnswer: match.matchedAnswer,
    };
  }
}

/**
 * 13. GAME: Final Showdown (Championship Round x3 Points)
 */
export class FinalShowdownMode implements IGameMode {
  readonly modeType = GameModeType.FINAL_SHOWDOWN;
  readonly name = 'Final Showdown';
  readonly defaultDurationSec = 20;

  async evaluate(
    question: GameQuestionPayload,
    answer: string,
    responseTimeMs: number,
    currentStreak: number,
  ): Promise<AnswerEvaluation> {
    const match = matchPlayerAnswer(answer, question);
    const speedBonus = match.isMatch ? calculateSpeedBonus(responseTimeMs, 20000) : 0;
    const streakBonus = match.isMatch ? calculateStreakBonus(currentStreak) : 0;
    const score = match.isMatch ? Math.round((700 + speedBonus + streakBonus) * 3.0) : 0;

    return {
      isCorrect: match.isMatch,
      accuracy: match.isMatch ? 100 : 0,
      semanticSimilarity: match.similarity,
      speedBonus,
      streakBonus,
      score,
      feedbackText: match.isMatch
        ? 'ĐÒN QUYẾT ĐỊNH XUẤT THẦN! x3 Điểm Vương Giả!'
        : `Hụt cơ hội quyết định! Đáp án: ${question.correctAnswer}`,
      matchedAnswer: match.matchedAnswer,
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
  [GameModeType.CLASSIC_QUIZ]: new ClassicQuizMode(),
  [GameModeType.SURVIVAL]: new SurvivalMode(),
  [GameModeType.DUEL]: new DuelMode(),
  [GameModeType.TEAM_BATTLE]: new TeamBattleMode(),
  [GameModeType.WORD_RUSH]: new WordRushMode(),
  [GameModeType.BOSS_ROUND]: new BossRoundMode(),
  [GameModeType.FINAL_SHOWDOWN]: new FinalShowdownMode(),
};
