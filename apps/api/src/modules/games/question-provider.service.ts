import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QuestionSourceType, GameModeType } from '@prisma/client';
import { GameQuestionPayload } from './game-mode.interface';

@Injectable()
export class QuestionProviderService {
  private readonly logger = new Logger(QuestionProviderService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Unified adapter to fetch questions from any learning source
   */
  async getQuestionsForRoom(
    sourceType: QuestionSourceType,
    sourceId: string | null | undefined,
    count: number = 10,
    gameMode: GameModeType = GameModeType.TRANSLATION_RUSH,
    languageId: string = 'en',
  ): Promise<GameQuestionPayload[]> {
    try {
      switch (sourceType) {
        case QuestionSourceType.VOCABULARY_DECK:
          return await this.fetchFromVocabulary(sourceId, count, languageId);

        case QuestionSourceType.QUESTION_BANK:
          return await this.fetchFromExamBank(sourceId, count);

        case QuestionSourceType.GRAMMAR_EXERCISES:
          return await this.fetchFromGrammarExercises(sourceId, count);

        case QuestionSourceType.KNOWLEDGE_BASE:
          return await this.fetchFromKnowledgeBase(sourceId, count);

        case QuestionSourceType.SYSTEM_PRESET:
        default:
          return await this.fetchFromSystemPreset(gameMode, count);
      }
    } catch (err: any) {
      this.logger.warn(`Failed to fetch from ${sourceType}, falling back to preset: ${err.message}`);
      return await this.fetchFromSystemPreset(gameMode, count);
    }
  }

  /**
   * 1. Vocabulary adapter
   */
  private async fetchFromVocabulary(deckId: string | null | undefined, count: number, languageId: string): Promise<GameQuestionPayload[]> {
    let whereClause: any = { languageId };
    if (deckId) {
      whereClause = {
        ...whereClause,
        topicItems: {
          some: { topicId: deckId },
        },
      };
    }

    const vocabs = await this.prisma.vocabulary.findMany({
      where: whereClause,
      take: count * 2,
      include: {
        meanings: { take: 1 },
      },
    });

    const shuffled = vocabs.sort(() => 0.5 - Math.random()).slice(0, count);

    return shuffled.map((v) => {
      const meaning = v.meanings?.[0]?.meaning || v.shortDefinition || v.definition;
      return {
        id: v.id,
        prompt: `Dịch sang tiếng Anh từ: "${meaning}"`,
        direction: 'VI_EN',
        correctAnswer: v.word.toLowerCase().trim(),
        acceptedAnswers: [v.word.toLowerCase().trim(), v.normalizedWord.toLowerCase().trim()],
        explanation: `${v.word} (${v.partOfSpeech || 'từ vựng'}): ${meaning}`,
        difficulty: v.difficulty || 3.0,
        category: 'Vocabulary',
        audioUrl: v.audioUrl || undefined,
      };
    });
  }

  /**
   * 2. Question Bank (ExamQuestion) adapter
   */
  private async fetchFromExamBank(examId: string | null | undefined, count: number): Promise<GameQuestionPayload[]> {
    const whereClause: any = examId ? { examId } : {};
    const examQuestions = await this.prisma.examQuestion.findMany({
      where: whereClause,
      take: count * 2,
      include: {
        options: true,
      },
    });

    const shuffled = examQuestions.sort(() => 0.5 - Math.random()).slice(0, count);

    return shuffled.map((q) => {
      let correctText = '';
      if (typeof q.correctAnswer === 'string') {
        correctText = q.correctAnswer;
      } else if (Array.isArray(q.correctAnswer) && q.correctAnswer.length > 0) {
        correctText = String(q.correctAnswer[0]);
      } else {
        const correctOpt = q.options.find((o) => o.isCorrect);
        correctText = correctOpt ? correctOpt.optionText : 'A';
      }

      // If correctText is just 'A', 'B', 'C', 'D', find the text of that option
      const matchingOpt = q.options.find(
        (o) => o.optionKey.toUpperCase() === correctText.toUpperCase(),
      );
      const fullAnswer = matchingOpt ? matchingOpt.optionText : correctText;

      return {
        id: q.id,
        prompt: q.questionText,
        direction: 'EXAM_MCQ',
        correctAnswer: fullAnswer.toLowerCase().trim(),
        acceptedAnswers: [
          fullAnswer.toLowerCase().trim(),
          correctText.toLowerCase().trim(),
          ...q.acceptedAnswers.map((a) => a.toLowerCase().trim()),
        ],
        explanation: q.explanation || q.sourceExplanation || undefined,
        difficulty: q.difficulty === 'HARD' ? 4.5 : q.difficulty === 'EASY' ? 2.0 : 3.0,
        category: q.category || 'Exam',
        audioUrl: q.audioUrl || undefined,
      };
    });
  }

  /**
   * 3. Grammar Exercises adapter
   */
  private async fetchFromGrammarExercises(topicId: string | null | undefined, count: number): Promise<GameQuestionPayload[]> {
    const whereClause: any = topicId ? { topicId } : {};
    const exercises = await this.prisma.grammarExercise.findMany({
      where: whereClause,
      take: count * 2,
      include: {
        topic: true,
      },
    });

    if (exercises.length === 0) {
      return await this.fetchFromSystemPreset(GameModeType.FIX_SENTENCE, count);
    }

    const shuffled = exercises.sort(() => 0.5 - Math.random()).slice(0, count);

    return shuffled.map((ex) => ({
      id: ex.id,
      prompt: ex.questionText,
      direction: 'GRAMMAR_FILL',
      correctAnswer: ex.correctAnswer.toLowerCase().trim(),
      acceptedAnswers: [
        ex.correctAnswer.toLowerCase().trim(),
        ...ex.acceptedAnswers.map((a) => a.toLowerCase().trim()),
      ],
      explanation: ex.explanation || `Chủ đề ngữ pháp: ${ex.topic?.title || 'Tổng quát'}`,
      difficulty: ex.difficulty || 3.0,
      category: 'Grammar',
    }));
  }

  /**
   * 4. Knowledge Base adapter
   */
  private async fetchFromKnowledgeBase(resourceId: string | null | undefined, count: number): Promise<GameQuestionPayload[]> {
    const whereClause: any = resourceId ? { id: resourceId } : { status: 'PUBLISHED' };
    const resources = await this.prisma.learningResource.findMany({
      where: whereClause,
      take: count,
    });

    if (resources.length === 0) {
      return await this.fetchFromSystemPreset(GameModeType.TRANSLATION_RUSH, count);
    }

    return resources.map((r) => ({
      id: r.id,
      prompt: `[${r.title}] ${r.description || 'Tìm từ khóa chính xác:'}`,
      direction: 'KNOWLEDGE_CONCEPT',
      correctAnswer: r.title.toLowerCase().trim(),
      acceptedAnswers: [r.title.toLowerCase().trim()],
      explanation: r.description || undefined,
      difficulty: 3.0,
      category: r.category || 'Knowledge',
    }));
  }

  /**
   * 5. Preset fallback adapter (GameQuestion)
   */
  private async fetchFromSystemPreset(gameMode: GameModeType, count: number): Promise<GameQuestionPayload[]> {
    const questions = await this.prisma.gameQuestion.findMany({
      where: {
        status: 'PUBLISHED',
      },
      take: count * 2,
    });

    if (questions.length === 0) {
      // Return guaranteed hardcoded high-quality seed questions if db is fresh
      return [
        {
          id: 'preset-1',
          prompt: 'Dịch: "Hợp đồng này cần được gia hạn trước thứ Sáu."',
          direction: 'VI_EN',
          correctAnswer: 'this contract needs to be renewed before friday',
          acceptedAnswers: [
            'this contract needs to be renewed before friday',
            'this contract must be renewed before friday',
          ],
          explanation: 'Renew: gia hạn hợp đồng/thẻ.',
          difficulty: 3.0,
          category: 'Business English',
        },
        {
          id: 'preset-2',
          prompt: 'Điền từ thiếu: "The marketing director submitted the budget ______ yesterday."',
          direction: 'EN_VI',
          correctAnswer: 'proposal',
          acceptedAnswers: ['proposal', 'report'],
          explanation: 'Budget proposal: bản đề xuất ngân sách.',
          difficulty: 3.0,
          category: 'Workplace',
        },
        {
          id: 'preset-3',
          prompt: 'Từ đồng nghĩa với "SUBSTANTIAL" là gì?',
          direction: 'SYNONYM',
          correctAnswer: 'significant',
          acceptedAnswers: ['significant', 'considerable', 'large'],
          explanation: 'Substantial = Significant = Đáng kể, quan trọng.',
          difficulty: 3.5,
          category: 'TOEIC Vocabulary',
        },
      ];
    }

    const shuffled = questions.sort(() => 0.5 - Math.random()).slice(0, count);

    return shuffled.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      direction: q.direction,
      correctAnswer: q.correctAnswer.toLowerCase().trim(),
      acceptedAnswers: [
        q.correctAnswer.toLowerCase().trim(),
        ...q.acceptedAnswers.map((a) => a.toLowerCase().trim()),
      ],
      explanation: q.explanation || undefined,
      difficulty: q.difficulty,
      category: q.category,
      audioUrl: q.audioUrl || undefined,
    }));
  }
}

