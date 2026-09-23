import { Injectable } from '@nestjs/common';
import { EvaluatedQuestionResult } from './exam-scoring.service';

export interface DimensionAccuracy {
  total: number;
  correct: number;
  accuracy: number; // 0 to 100
}

export interface ExamAttemptAnalytics {
  overallAccuracy: number;
  totalTimeSpentSeconds: number;
  averageTimePerQuestionSeconds: number;
  categoryBreakdown: Record<string, DimensionAccuracy>;
  grammarBreakdown: Record<string, DimensionAccuracy>;
  skillBreakdown: Record<string, DimensionAccuracy>;
  partOfSpeechBreakdown: Record<string, DimensionAccuracy>;
  difficultyBreakdown: Record<string, DimensionAccuracy>;
  weakAreas: Array<{
    dimension: 'grammar' | 'category' | 'skill' | 'partOfSpeech';
    name: string;
    total: number;
    correct: number;
    accuracy: number;
    recommendation: string;
  }>;
}

@Injectable()
export class ExamAnalyticsService {
  computeAnalytics(
    evaluatedAnswers: EvaluatedQuestionResult[],
    totalDurationSeconds: number,
  ): ExamAttemptAnalytics {
    const totalQuestions = evaluatedAnswers.length;
    let totalCorrect = 0;
    let totalTimeSpent = totalDurationSeconds;

    const categoryStats: Record<string, { total: number; correct: number }> = {};
    const grammarStats: Record<string, { total: number; correct: number }> = {};
    const skillStats: Record<string, { total: number; correct: number }> = {};
    const posStats: Record<string, { total: number; correct: number }> = {};
    const diffStats: Record<string, { total: number; correct: number }> = {};

    for (const ans of evaluatedAnswers) {
      if (ans.isCorrect) totalCorrect++;

      // Category
      if (ans.category) {
        if (!categoryStats[ans.category]) categoryStats[ans.category] = { total: 0, correct: 0 };
        categoryStats[ans.category].total++;
        if (ans.isCorrect) categoryStats[ans.category].correct++;
      }

      // Grammar
      if (ans.grammarType) {
        if (!grammarStats[ans.grammarType]) grammarStats[ans.grammarType] = { total: 0, correct: 0 };
        grammarStats[ans.grammarType].total++;
        if (ans.isCorrect) grammarStats[ans.grammarType].correct++;
      }

      // Skill
      if (ans.skill) {
        if (!skillStats[ans.skill]) skillStats[ans.skill] = { total: 0, correct: 0 };
        skillStats[ans.skill].total++;
        if (ans.isCorrect) skillStats[ans.skill].correct++;
      }

      // Part of Speech
      if (ans.partOfSpeech) {
        if (!posStats[ans.partOfSpeech]) posStats[ans.partOfSpeech] = { total: 0, correct: 0 };
        posStats[ans.partOfSpeech].total++;
        if (ans.isCorrect) posStats[ans.partOfSpeech].correct++;
      }

      // Difficulty
      if (ans.difficulty) {
        if (!diffStats[ans.difficulty]) diffStats[ans.difficulty] = { total: 0, correct: 0 };
        diffStats[ans.difficulty].total++;
        if (ans.isCorrect) diffStats[ans.difficulty].correct++;
      }
    }

    const calcAcc = (dict: Record<string, { total: number; correct: number }>): Record<string, DimensionAccuracy> => {
      const res: Record<string, DimensionAccuracy> = {};
      for (const [k, v] of Object.entries(dict)) {
        res[k] = {
          total: v.total,
          correct: v.correct,
          accuracy: v.total > 0 ? Math.round((v.correct / v.total) * 1000) / 10 : 0,
        };
      }
      return res;
    };

    const categoryBreakdown = calcAcc(categoryStats);
    const grammarBreakdown = calcAcc(grammarStats);
    const skillBreakdown = calcAcc(skillStats);
    const partOfSpeechBreakdown = calcAcc(posStats);
    const difficultyBreakdown = calcAcc(diffStats);

    const weakAreas: ExamAttemptAnalytics['weakAreas'] = [];

    // Collect weak grammar types (< 65% accuracy, min 2 questions)
    for (const [g, stat] of Object.entries(grammarBreakdown)) {
      if (stat.accuracy < 65) {
        weakAreas.push({
          dimension: 'grammar',
          name: g,
          total: stat.total,
          correct: stat.correct,
          accuracy: stat.accuracy,
          recommendation: `Cần ôn luyện thêm chủ điểm ngữ pháp "${g}" (đúng ${stat.correct}/${stat.total} câu).`,
        });
      }
    }

    // Collect weak skills (< 65%)
    for (const [s, stat] of Object.entries(skillBreakdown)) {
      if (stat.accuracy < 65) {
        weakAreas.push({
          dimension: 'skill',
          name: s,
          total: stat.total,
          correct: stat.correct,
          accuracy: stat.accuracy,
          recommendation: `Cần cải thiện kỹ năng "${s}" (đúng ${stat.correct}/${stat.total} câu).`,
        });
      }
    }

    // Collect weak parts of speech (< 65%)
    for (const [p, stat] of Object.entries(partOfSpeechBreakdown)) {
      if (stat.accuracy < 65) {
        weakAreas.push({
          dimension: 'partOfSpeech',
          name: p,
          total: stat.total,
          correct: stat.correct,
          accuracy: stat.accuracy,
          recommendation: `Xem lại cách dùng từ loại "${p}" trong các câu trắc nghiệm.`,
        });
      }
    }

    // Sort weak areas by accuracy ascending
    weakAreas.sort((a, b) => a.accuracy - b.accuracy);

    const overallAccuracy =
      totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 1000) / 10 : 0;
    const averageTimePerQuestionSeconds =
      totalQuestions > 0 ? Math.round((totalTimeSpent / totalQuestions) * 10) / 10 : 0;

    return {
      overallAccuracy,
      totalTimeSpentSeconds: totalTimeSpent,
      averageTimePerQuestionSeconds,
      categoryBreakdown,
      grammarBreakdown,
      skillBreakdown,
      partOfSpeechBreakdown,
      difficultyBreakdown,
      weakAreas: weakAreas.slice(0, 5),
    };
  }
}
