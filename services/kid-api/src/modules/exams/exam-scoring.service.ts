import { Injectable } from '@nestjs/common';
import { QuestionType } from '@prisma/client';

export interface EvaluatedQuestionResult {
  questionId: string;
  isCorrect: boolean;
  pointsAwarded: number;
  selectedAnswer: any;
  correctAnswer: any;
  timeSpentSeconds: number;
  category?: string;
  skill?: string;
  grammarType?: string;
  partOfSpeech?: string;
  difficulty?: string;
}

export interface ScoringResult {
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  score: number;
  totalPossibleScore: number;
  percentage: number;
  isPassed: boolean;
  evaluatedAnswers: EvaluatedQuestionResult[];
}

@Injectable()
export class ExamScoringService {
  evaluateQuestion(
    question: {
      id: string;
      questionType: QuestionType;
      correctAnswer: any;
      acceptedAnswers: string[];
      points: number;
      category?: string | null;
      skill?: string | null;
      grammarType?: string | null;
      partOfSpeech?: string | null;
      difficulty?: string | null;
    },
    userAnswer?: any,
    timeSpentSeconds: number = 0,
  ): EvaluatedQuestionResult {
    const points = question.points || 1.0;

    // Check if skipped
    const isSkipped =
      userAnswer === undefined ||
      userAnswer === null ||
      (typeof userAnswer === 'string' && userAnswer.trim() === '') ||
      (Array.isArray(userAnswer) && userAnswer.length === 0);

    if (isSkipped) {
      return {
        questionId: question.id,
        isCorrect: false,
        pointsAwarded: 0,
        selectedAnswer: null,
        correctAnswer: question.correctAnswer,
        timeSpentSeconds,
        category: question.category || undefined,
        skill: question.skill || undefined,
        grammarType: question.grammarType || undefined,
        partOfSpeech: question.partOfSpeech || undefined,
        difficulty: question.difficulty || undefined,
      };
    }

    let isCorrect = false;

    switch (question.questionType) {
      case QuestionType.MULTIPLE_CHOICE: {
        const correctNorm = this.normalizeAnswer(question.correctAnswer);
        const userNorm = this.normalizeAnswer(userAnswer);
        isCorrect = correctNorm === userNorm;
        break;
      }

      case QuestionType.MULTIPLE_SELECT: {
        const correctSet = this.toNormalizedSet(question.correctAnswer);
        const userSet = this.toNormalizedSet(userAnswer);
        isCorrect =
          correctSet.size === userSet.size &&
          [...correctSet].every((val) => userSet.has(val));
        break;
      }

      case QuestionType.TRUE_FALSE: {
        const c = String(question.correctAnswer).toLowerCase().trim();
        const u = String(userAnswer).toLowerCase().trim();
        isCorrect =
          (c === 'true' && (u === 'true' || u === 't' || u === '1')) ||
          (c === 'false' && (u === 'false' || u === 'f' || u === '0'));
        break;
      }

      case QuestionType.FILL_IN_BLANK:
      case QuestionType.SHORT_ANSWER: {
        const userStr = String(userAnswer).trim().toLowerCase();
        const mainCorrect = String(question.correctAnswer).trim().toLowerCase();
        const accepted = (question.acceptedAnswers || []).map((a) =>
          a.trim().toLowerCase(),
        );

        isCorrect = userStr === mainCorrect || accepted.includes(userStr);
        break;
      }

      case QuestionType.MATCHING:
      case QuestionType.ORDERING: {
        try {
          const cJson = JSON.stringify(question.correctAnswer);
          const uJson = JSON.stringify(userAnswer);
          isCorrect = cJson === uJson;
        } catch {
          isCorrect = false;
        }
        break;
      }

      default: {
        isCorrect =
          this.normalizeAnswer(question.correctAnswer) ===
          this.normalizeAnswer(userAnswer);
      }
    }

    return {
      questionId: question.id,
      isCorrect,
      pointsAwarded: isCorrect ? points : 0,
      selectedAnswer: userAnswer,
      correctAnswer: question.correctAnswer,
      timeSpentSeconds,
      category: question.category || undefined,
      skill: question.skill || undefined,
      grammarType: question.grammarType || undefined,
      partOfSpeech: question.partOfSpeech || undefined,
      difficulty: question.difficulty || undefined,
    };
  }

  calculateTotalScore(
    questions: Array<any>,
    answersMap: Map<string, { selectedAnswer: any; timeSpentSeconds: number }>,
    passingScore?: number | null,
  ): ScoringResult {
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;
    let totalScore = 0;
    let totalPossibleScore = 0;

    const evaluatedAnswers: EvaluatedQuestionResult[] = [];

    for (const q of questions) {
      const pts = q.points || 1.0;
      totalPossibleScore += pts;

      const userAns = answersMap.get(q.id);
      const evalResult = this.evaluateQuestion(
        q,
        userAns?.selectedAnswer,
        userAns?.timeSpentSeconds || 0,
      );

      evaluatedAnswers.push(evalResult);

      if (evalResult.selectedAnswer === null) {
        skippedCount++;
      } else if (evalResult.isCorrect) {
        correctCount++;
        totalScore += evalResult.pointsAwarded;
      } else {
        wrongCount++;
      }
    }

    const percentage =
      totalPossibleScore > 0
        ? Math.round((totalScore / totalPossibleScore) * 1000) / 10
        : 0;

    const isPassed =
      passingScore != null ? totalScore >= passingScore : percentage >= 50;

    return {
      totalQuestions: questions.length,
      correctCount,
      wrongCount,
      skippedCount,
      score: Math.round(totalScore * 10) / 10,
      totalPossibleScore: Math.round(totalPossibleScore * 10) / 10,
      percentage,
      isPassed,
      evaluatedAnswers,
    };
  }

  private normalizeAnswer(val: any): string {
    if (val === undefined || val === null) return '';
    if (Array.isArray(val)) {
      return val.map((v) => String(v).trim().toLowerCase()).sort().join(',');
    }
    return String(val).trim().toLowerCase();
  }

  private toNormalizedSet(val: any): Set<string> {
    const set = new Set<string>();
    if (Array.isArray(val)) {
      val.forEach((item) => set.add(String(item).trim().toLowerCase()));
    } else if (typeof val === 'string') {
      val
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
        .forEach((item) => set.add(item));
    } else if (val != null) {
      set.add(String(val).trim().toLowerCase());
    }
    return set;
  }
}
