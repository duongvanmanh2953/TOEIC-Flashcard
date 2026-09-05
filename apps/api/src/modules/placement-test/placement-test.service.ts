import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CefrLevel } from '@prisma/client';

export interface TestAnswerItem {
  questionId: string;
  cefrLevel: CefrLevel;
  selectedOption: string;
  correctAnswer: string;
  category: string;
}

@Injectable()
export class PlacementTestService {
  constructor(private prisma: PrismaService) {}

  getPlacementQuestions() {
    return [
      {
        id: 'pt-1',
        cefrLevel: CefrLevel.A2,
        category: 'Basic Vocabulary',
        question: 'Choose the correct meaning of "salary":',
        options: ['Tiền lương nhận định kỳ', 'Tiền thưởng dự án', 'Giảm giá mua sắm', 'Hóa đơn tiền điện'],
        correctAnswer: 'Tiền lương nhận định kỳ',
      },
      {
        id: 'pt-2',
        cefrLevel: CefrLevel.A2,
        category: 'Everyday Words',
        question: 'Complete: "The company plans to ______ new staff next month."',
        options: ['hire', 'borrow', 'lend', 'spend'],
        correctAnswer: 'hire',
      },
      {
        id: 'pt-3',
        cefrLevel: CefrLevel.B1,
        category: 'Workplace Collocations',
        question: 'Which word best collocates with "decision"?',
        options: ['make', 'do', 'create', 'build'],
        correctAnswer: 'make',
      },
      {
        id: 'pt-4',
        cefrLevel: CefrLevel.B1,
        category: 'Contextual Usage',
        question: 'What does "benefit" mean in a job package?',
        options: ['Lợi ích/chế độ đãi ngộ', 'Hình phạt', 'Thời gian làm thêm', 'Hợp đồng lao động'],
        correctAnswer: 'Lợi ích/chế độ đãi ngộ',
      },
      {
        id: 'pt-5',
        cefrLevel: CefrLevel.B1,
        category: 'Phrasal Verbs',
        question: 'What is the meaning of "call off"?',
        options: ['Hủy bỏ', 'Gọi điện', 'Tiếp tục', 'Trì hoãn'],
        correctAnswer: 'Hủy bỏ',
      },
      {
        id: 'pt-6',
        cefrLevel: CefrLevel.B2,
        category: 'Business English',
        question: 'Select the synonym for "negotiate":',
        options: ['bargain / discuss terms', 'demand fiercely', 'give up easily', 'sign quickly'],
        correctAnswer: 'bargain / discuss terms',
      },
      {
        id: 'pt-7',
        cefrLevel: CefrLevel.B2,
        category: 'Academic & Professional',
        question: 'Complete: "Prices are likely to ______ due to seasonal market demand."',
        options: ['fluctuate', 'stagnate', 'demolish', 'hesitate'],
        correctAnswer: 'fluctuate',
      },
      {
        id: 'pt-8',
        cefrLevel: CefrLevel.B2,
        category: 'Confusing Words',
        question: 'Choose the correct word: "The tax changes will severely ______ small enterprises."',
        options: ['affect', 'effect', 'affection', 'effective'],
        correctAnswer: 'affect',
      },
      {
        id: 'pt-9',
        cefrLevel: CefrLevel.C1,
        category: 'Advanced Collocations',
        question: 'What is the meaning of "apprehensive"?',
        options: ['Anxious or fearful about the future', 'Comprehensive and thorough', 'Extremely confident', 'Quick to misunderstand'],
        correctAnswer: 'Anxious or fearful about the future',
      },
      {
        id: 'pt-10',
        cefrLevel: CefrLevel.C1,
        category: 'High-Level Professional',
        question: 'Complete: "The contract is ______ strict confidentiality requirements."',
        options: ['subject to', 'relying of', 'object at', 'attached on'],
        correctAnswer: 'subject to',
      },
    ];
  }

  async evaluatePlacementTest(userId: string, answers: TestAnswerItem[]) {
    let scoreA2 = 0, totalA2 = 0;
    let scoreB1 = 0, totalB1 = 0;
    let scoreB2 = 0, totalB2 = 0;
    let scoreC1 = 0, totalC1 = 0;

    const categoryStats: Record<string, { correct: number; total: number }> = {};

    for (const a of answers) {
      const isCorrect = a.selectedOption === a.correctAnswer;
      if (!categoryStats[a.category]) {
        categoryStats[a.category] = { correct: 0, total: 0 };
      }
      categoryStats[a.category].total += 1;
      if (isCorrect) categoryStats[a.category].correct += 1;

      if (a.cefrLevel === CefrLevel.A2) {
        totalA2++;
        if (isCorrect) scoreA2++;
      } else if (a.cefrLevel === CefrLevel.B1) {
        totalB1++;
        if (isCorrect) scoreB1++;
      } else if (a.cefrLevel === CefrLevel.B2) {
        totalB2++;
        if (isCorrect) scoreB2++;
      } else if (a.cefrLevel === CefrLevel.C1) {
        totalC1++;
        if (isCorrect) scoreC1++;
      }
    }

    // Determine estimated CEFR
    let estimatedLevel: CefrLevel = CefrLevel.A2;
    let estimatedVocabSize = 1800;

    if (scoreC1 >= 1 && scoreB2 >= 2 && scoreB1 >= 2) {
      estimatedLevel = CefrLevel.C1;
      estimatedVocabSize = 6500;
    } else if (scoreB2 >= 2 && scoreB1 >= 2) {
      estimatedLevel = CefrLevel.B2;
      estimatedVocabSize = 4800;
    } else if (scoreB1 >= 2) {
      estimatedLevel = CefrLevel.B1;
      estimatedVocabSize = 3200;
    }

    // Identify strong & weak areas
    const strongAreas: string[] = [];
    const weakAreas: string[] = [];

    for (const [cat, data] of Object.entries(categoryStats)) {
      const rate = data.total > 0 ? data.correct / data.total : 0;
      if (rate >= 0.7) strongAreas.push(cat);
      else weakAreas.push(cat);
    }

    // Update UserProfile
    await this.prisma.userProfile.upsert({
      where: { userId },
      update: {
        englishLevel: estimatedLevel,
        targetLevel: estimatedLevel === CefrLevel.C1 ? CefrLevel.C2 : CefrLevel.C1,
        dailyGoal: estimatedLevel === CefrLevel.B2 ? 25 : 20,
      },
      create: {
        userId,
        englishLevel: estimatedLevel,
        targetLevel: CefrLevel.C1,
        dailyGoal: 20,
      },
    });

    return {
      estimatedLevel,
      estimatedVocabSize,
      strongAreas: strongAreas.length ? strongAreas : ['Basic Vocabulary'],
      weakAreas: weakAreas.length ? weakAreas : ['Phrasal Verbs', 'Advanced Collocations'],
      recommendedDailyGoal: estimatedLevel === CefrLevel.B2 ? 25 : 20,
      learningPathSummary: `Based on your placement result, we personalized your curriculum for CEFR ${estimatedLevel}. Your review engine will prioritize ${weakAreas.join(', ') || 'collocations'} and active retrieval.`,
    };
  }
}
