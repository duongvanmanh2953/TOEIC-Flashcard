import { GameModeType } from '@prisma/client';

export interface AnswerEvaluation {
  isCorrect: boolean;
  accuracy: number; // 0 to 100%
  semanticSimilarity: number; // 0 to 100%
  grammarScore?: number;
  spellingScore?: number;
  speedBonus: number;
  streakBonus: number;
  score: number;
  feedbackText: string;
  matchedAnswer?: string;
}

export interface GameQuestionPayload {
  id: string;
  prompt: string;
  direction: string;
  correctAnswer: string;
  acceptedAnswers: string[];
  explanation?: string;
  difficulty: number;
  category: string;
  audioUrl?: string;
}

export interface IGameMode {
  readonly modeType: GameModeType;
  readonly name: string;
  readonly defaultDurationSec: number;

  /**
   * Evaluate player answer against question
   * @param question Current question data
   * @param answer Submitted answer from client
   * @param responseTimeMs Server-calculated response time in ms
   * @param currentStreak Player streak before this round
   */
  evaluate(
    question: GameQuestionPayload,
    answer: string,
    responseTimeMs: number,
    currentStreak: number,
  ): Promise<AnswerEvaluation>;
}
