import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdaptiveEngineService } from './adaptive-engine.service';
import { StartSessionDto } from './dto/start-session.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { ExerciseType, SessionType } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private adaptiveEngine: AdaptiveEngineService,
  ) {}

  async createSmartSession(userId: string, dto: StartSessionDto) {
    const limit = dto.limit || 10;
    const now = new Date();

    // 1. Fetch Due Words (up to 40%)
    const dueCount = Math.max(1, Math.round(limit * 0.4));
    const dueUserVocabs = await this.prisma.userVocabulary.findMany({
      where: {
        userId,
        nextReviewAt: { lte: now },
      },
      include: { vocabulary: { include: { meanings: true, examples: true } } },
      take: dueCount,
      orderBy: { nextReviewAt: 'asc' },
    });

    // 2. Fetch Weak Words (up to 30%)
    const weakCount = Math.max(1, Math.round(limit * 0.3));
    const excludedIds = dueUserVocabs.map((uv) => uv.vocabularyId);
    const weakUserVocabs = await this.prisma.userVocabulary.findMany({
      where: {
        userId,
        vocabularyId: { notIn: excludedIds },
        OR: [{ masteryScore: { lt: 50 } }, { isHard: true }],
      },
      include: { vocabulary: { include: { meanings: true, examples: true } } },
      take: weakCount,
      orderBy: { masteryScore: 'asc' },
    });

    // 3. Fetch New Words not yet in UserVocabulary (remaining slots)
    excludedIds.push(...weakUserVocabs.map((uv) => uv.vocabularyId));

    const neededSlots = limit - (dueUserVocabs.length + weakUserVocabs.length);
    const newVocabs =
      neededSlots > 0
        ? await this.prisma.vocabulary.findMany({
            where: {
              userVocabularies: {
                none: { userId },
              },
              ...(excludedIds.length > 0 ? { id: { notIn: excludedIds } } : {}),
            },
            include: { meanings: true, examples: true },
            take: neededSlots,
            orderBy: { frequencyRank: 'asc' },
          })
        : [];

    // Combine candidate vocabulary items
    const allCandidates = [
      ...dueUserVocabs.map((uv) => ({ vocab: uv.vocabulary, origin: 'DUE' })),
      ...weakUserVocabs.map((uv) => ({ vocab: uv.vocabulary, origin: 'WEAK' })),
      ...newVocabs.map((v) => ({ vocab: v, origin: 'NEW' })),
    ];

    // Fallback if user has reviewed all and no new words found
    if (allCandidates.length === 0) {
      const fallback = await this.prisma.vocabulary.findMany({
        take: limit,
        include: { meanings: true, examples: true },
        orderBy: { word: 'asc' },
      });
      allCandidates.push(...fallback.map((v) => ({ vocab: v, origin: 'REVIEW' })));
    }

    // Fetch distractor vocabulary for multiple-choice options
    const distractors = await this.prisma.vocabulary.findMany({
      take: 40,
      select: { word: true, shortDefinition: true },
    });

    // Create a StudySession record
    const session = await this.prisma.studySession.create({
      data: {
        userId,
        type: dto.type || SessionType.SMART_REVIEW,
      },
    });

    // Generate exercises
    const exercises = allCandidates.map(({ vocab, origin }, index) => {
      const meaning = vocab.meanings[0]?.meaning || vocab.shortDefinition || vocab.definition;
      const example = vocab.examples[0]?.sentence || null;

      // Decide exercise type based on progression
      let exerciseType: ExerciseType = ExerciseType.MULTIPLE_CHOICE;
      if (index % 3 === 1 && example && example.toLowerCase().includes(vocab.word.toLowerCase())) {
        exerciseType = ExerciseType.FILL_IN_BLANK;
      } else if (index % 3 === 2) {
        exerciseType = ExerciseType.TYPE_THE_WORD;
      }

      // Generate 4 multiple choice options
      const otherOptions = distractors
        .filter((d) => d.word.toLowerCase() !== vocab.word.toLowerCase())
        .slice(0, 3)
        .map((d) => d.shortDefinition || d.word);
      
      const options = [meaning, ...otherOptions].sort(() => Math.random() - 0.5);

      // Mask example for fill in the blank
      let maskedSentence = example;
      if (maskedSentence) {
        const regex = new RegExp(`\\b${vocab.word}\\b`, 'gi');
        maskedSentence = maskedSentence.replace(regex, '______');
      }

      return {
        id: `ex-${session.id}-${index + 1}`,
        vocabularyId: vocab.id,
        word: vocab.word,
        pronunciation: vocab.pronunciation,
        audioUrl: vocab.audioUrl,
        imageUrl: vocab.imageUrl,
        cefrLevel: vocab.cefrLevel,
        partOfSpeech: vocab.partOfSpeech,
        exerciseType,
        question:
          exerciseType === ExerciseType.MULTIPLE_CHOICE
            ? `What is the meaning of "${vocab.word}"?`
            : exerciseType === ExerciseType.FILL_IN_BLANK
            ? 'Complete the sentence with the correct vocabulary word:'
            : `Type the word for: "${meaning}"`,
        sentence: exerciseType === ExerciseType.FILL_IN_BLANK ? maskedSentence : example,
        translation: vocab.examples[0]?.translation || null,
        options: exerciseType === ExerciseType.MULTIPLE_CHOICE ? options : undefined,
        correctAnswer: exerciseType === ExerciseType.MULTIPLE_CHOICE ? meaning : vocab.word,
        hint: `Starts with "${vocab.word[0].toUpperCase()}", ${vocab.partOfSpeech || 'word'} (${meaning})`,
        origin,
      };
    });

    return {
      session: {
        id: session.id,
        type: session.type,
        startedAt: session.startedAt,
        totalItems: exercises.length,
      },
      items: exercises,
    };
  }

  async submitAnswer(sessionId: string, dto: SubmitAnswerDto, userId: string) {
    const session = await this.prisma.studySession.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.userId !== userId) {
      throw new NotFoundException('Study session not found');
    }

    const vocab = await this.prisma.vocabulary.findUnique({
      where: { id: dto.vocabularyId },
      include: { meanings: true, examples: true },
    });
    if (!vocab) {
      throw new NotFoundException('Vocabulary not found');
    }

    // Evaluate answer correctness (exact or close match)
    const cleanUser = dto.answer.trim().toLowerCase();
    const cleanTarget = vocab.word.trim().toLowerCase();
    const meaningTarget = (vocab.meanings[0]?.meaning || vocab.shortDefinition || '').trim().toLowerCase();

    const isCorrect =
      !dto.skipped &&
      (cleanUser === cleanTarget ||
        cleanUser === meaningTarget ||
        meaningTarget.includes(cleanUser) ||
        cleanUser.includes(cleanTarget));

    // Pre-fetch UserVocabulary, XP, and Streak records in parallel OUTSIDE the transaction
    const [userVocab, currentXPRecord, streakRecord] = await Promise.all([
      this.prisma.userVocabulary.findUnique({
        where: {
          userId_vocabularyId: { userId, vocabularyId: dto.vocabularyId },
        },
      }),
      this.prisma.userXP.findUnique({ where: { userId } }),
      this.prisma.userStreak.findUnique({ where: { userId } }),
    ]);

    const currentStability = userVocab?.stability || 1.0;
    const currentDifficulty = userVocab?.difficultyEstimate || vocab.difficulty || 3.0;
    const currentMastery = userVocab?.masteryScore || 0.0;
    const repetitionCount = (userVocab?.repetitionCount || 0) + 1;

    // Run Adaptive Spaced Repetition Engine
    const evalResult = this.adaptiveEngine.evaluateReview({
      correct: isCorrect,
      responseTimeMs: dto.responseTimeMs,
      confidence: dto.confidence,
      hintUsed: dto.hintUsed || false,
      currentStability,
      currentDifficulty,
      currentMastery,
      repetitionCount,
    });

    // Pre-calculate XP and Streak outside of transaction lock
    const newTotalXP = (currentXPRecord?.totalXP || 0) + evalResult.xpEarned;
    const newLevel = Math.floor(Math.sqrt(newTotalXP / 50)) + 1;

    let currentStreak = streakRecord?.currentStreak || 0;
    let longestStreak = streakRecord?.longestStreak || 0;
    const today = new Date().toDateString();
    const lastStudy = streakRecord?.lastStudyDate ? new Date(streakRecord.lastStudyDate).toDateString() : null;
    const shouldUpdateStreak = lastStudy !== today;
    if (shouldUpdateStreak) {
      currentStreak += 1;
      if (currentStreak > longestStreak) longestStreak = currentStreak;
    }

    const currentRecall = userVocab?.activeRecallScore || 0.0;
    const currentProd = userVocab?.productionScore || 0.0;
    const currentSlip = userVocab?.slipRisk || 0.0;

    const newRecall = Math.min(1.0, Math.max(0.0, currentRecall + (isCorrect ? 0.2 : -0.15)));
    const newProd = isCorrect && dto.answer && dto.answer.length > 2 ? Math.min(1.0, currentProd + 0.25) : currentProd;
    const newSlip = !isCorrect ? Math.min(1.0, currentSlip + 0.4) : Math.max(0.0, currentSlip - 0.3);

    // Fast Write-Only Transaction: minimizes connection hold time
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Upsert UserVocabulary
      const updatedVocab = await tx.userVocabulary.upsert({
        where: {
          userId_vocabularyId: { userId, vocabularyId: dto.vocabularyId },
        },
        update: {
          status: evalResult.status,
          masteryScore: evalResult.newMasteryScore,
          stability: evalResult.newStability,
          retrievability: evalResult.retrievability,
          difficultyEstimate: evalResult.newDifficulty,
          repetitionCount,
          correctCount: isCorrect ? (userVocab?.correctCount || 0) + 1 : userVocab?.correctCount || 0,
          incorrectCount: !isCorrect ? (userVocab?.incorrectCount || 0) + 1 : (userVocab?.incorrectCount || 0),
          lastReviewedAt: new Date(),
          nextReviewAt: evalResult.nextReviewDate,
          confidence: dto.confidence,
          streak: isCorrect ? (userVocab?.streak || 0) + 1 : 0,
          activeRecallScore: newRecall,
          productionScore: newProd,
          slipRisk: newSlip,
        },
        create: {
          userId,
          vocabularyId: dto.vocabularyId,
          status: evalResult.status,
          masteryScore: evalResult.newMasteryScore,
          stability: evalResult.newStability,
          retrievability: evalResult.retrievability,
          difficultyEstimate: evalResult.newDifficulty,
          repetitionCount: 1,
          correctCount: isCorrect ? 1 : 0,
          incorrectCount: isCorrect ? 0 : 1,
          lastReviewedAt: new Date(),
          nextReviewAt: evalResult.nextReviewDate,
          confidence: dto.confidence,
          streak: isCorrect ? 1 : 0,
          activeRecallScore: isCorrect ? 0.3 : 0.0,
          productionScore: 0.0,
          slipRisk: isCorrect ? 0.0 : 0.5,
        },
      });

      // 2. Log ReviewEvent
      await tx.reviewEvent.create({
        data: {
          userId,
          vocabularyId: dto.vocabularyId,
          sessionId,
          answer: dto.answer,
          correct: isCorrect,
          responseTimeMs: dto.responseTimeMs,
          confidence: dto.confidence,
          hintUsed: dto.hintUsed || false,
          skipped: dto.skipped || false,
        },
      });

      // 3. Update XP & Level
      await tx.userXP.upsert({
        where: { userId },
        update: { totalXP: newTotalXP, currentLevel: newLevel },
        create: { userId, totalXP: newTotalXP, currentLevel: newLevel },
      });

      // 4. Update Streak (if study date changed)
      if (shouldUpdateStreak) {
        await tx.userStreak.upsert({
          where: { userId },
          update: { currentStreak, longestStreak, lastStudyDate: new Date() },
          create: { userId, currentStreak: 1, longestStreak: 1, lastStudyDate: new Date() },
        });
      }

      return {
        isCorrect,
        xpEarned: evalResult.xpEarned,
        masteryScore: evalResult.newMasteryScore,
        nextReviewAt: evalResult.nextReviewDate,
        status: evalResult.status,
        updatedVocab,
      };
    });

    return {
      success: true,
      correct: result.isCorrect,
      feedback: {
        word: vocab.word,
        pronunciation: vocab.pronunciation,
        meaning: vocab.meanings[0]?.meaning || vocab.shortDefinition,
        definition: vocab.definition,
        example: vocab.examples[0]?.sentence || null,
        translation: vocab.examples[0]?.translation || null,
      },
      evaluation: {
        xpEarned: result.xpEarned,
        masteryScore: result.masteryScore,
        nextReviewAt: result.nextReviewAt,
        status: result.status,
      },
    };
  }

  async completeSession(sessionId: string, userId: string) {
    const session = await this.prisma.studySession.findUnique({
      where: { id: sessionId },
      include: {
        reviewEvents: {
          include: { vocabulary: true },
        },
      },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundException('Session not found');
    }

    const totalQuestions = session.reviewEvents.length;
    const correctCount = session.reviewEvents.filter((e) => e.correct).length;
    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const xpEarned = correctCount * 12;

    const completed = await this.prisma.studySession.update({
      where: { id: sessionId },
      data: {
        completedAt: new Date(),
        score: accuracy,
        xpEarned,
      },
    });

    return {
      sessionId: completed.id,
      completedAt: completed.completedAt,
      accuracy,
      totalQuestions,
      correctCount,
      xpEarned,
    };
  }

  /**
   * Memory Rescue: Quét các từ vựng có nguy cơ quên cao (slipRisk >= 0.4 hoặc quá hạn mà điểm tự tin thấp)
   */
  async getMemoryRescueSummary(userId: string) {
    const now = new Date();
    const slippingWords = await this.prisma.userVocabulary.findMany({
      where: {
        userId,
        OR: [
          { slipRisk: { gte: 0.4 } },
          { nextReviewAt: { lte: now }, confidence: { lte: 2 } },
          { incorrectCount: { gt: 1 }, masteryScore: { lt: 45 } },
        ],
      },
      include: {
        vocabulary: {
          select: {
            id: true,
            word: true,
            partOfSpeech: true,
            shortDefinition: true,
            cefrLevel: true,
            pronunciation: true,
          },
        },
      },
      orderBy: [{ slipRisk: 'desc' }, { masteryScore: 'asc' }],
      take: 8,
    });

    return {
      slippingCount: slippingWords.length,
      words: slippingWords.map((uv) => ({
        id: uv.vocabulary.id,
        word: uv.vocabulary.word,
        meaning: uv.vocabulary.shortDefinition,
        partOfSpeech: uv.vocabulary.partOfSpeech,
        cefrLevel: uv.vocabulary.cefrLevel,
        pronunciation: uv.vocabulary.pronunciation,
        masteryScore: uv.masteryScore,
        slipRisk: Math.round(uv.slipRisk * 100),
      })),
      urgency: slippingWords.length >= 5 ? 'HIGH' : slippingWords.length > 0 ? 'MEDIUM' : 'LOW',
    };
  }

  /**
   * Tạo phiên giải cứu trí nhớ cấp tốc (Memory Rescue Session)
   */
  async createMemoryRescueSession(userId: string) {
    const summary = await this.getMemoryRescueSummary(userId);
    if (summary.slippingCount === 0) {
      // Fallback nếu không có từ nguy cơ
      return this.createSmartSession(userId, { limit: 5 });
    }

    const targetVocabIds = summary.words.map((w) => w.id);
    const vocabs = await this.prisma.vocabulary.findMany({
      where: { id: { in: targetVocabIds } },
      include: { meanings: true, examples: true },
    });

    const distractors = await this.prisma.vocabulary.findMany({
      take: 20,
      select: { word: true, shortDefinition: true },
    });

    const session = await this.prisma.studySession.create({
      data: {
        userId,
        type: SessionType.SMART_REVIEW,
      },
    });

    const exercises = vocabs.map((vocab, index) => {
      const meaning = vocab.meanings[0]?.meaning || vocab.shortDefinition;
      const otherMeanings = distractors
        .filter((d) => d.word !== vocab.word)
        .slice(0, 3)
        .map((d) => d.shortDefinition);

      const options = [meaning, ...otherMeanings].sort(() => Math.random() - 0.5);

      return {
        id: `rescue-ex-${index + 1}`,
        vocabularyId: vocab.id,
        word: vocab.word,
        pronunciation: vocab.pronunciation,
        partOfSpeech: vocab.partOfSpeech,
        cefrLevel: vocab.cefrLevel,
        type: ExerciseType.MEANING_SELECTION,
        prompt: `Nghĩa chính xác nhất của từ "${vocab.word}" là gì?`,
        options,
        correctAnswer: meaning,
        exampleSentence: vocab.examples[0]?.sentence || null,
        exampleTranslation: vocab.examples[0]?.translation || null,
        isRescueTarget: true,
      };
    });

    return {
      sessionId: session.id,
      type: 'MEMORY_RESCUE',
      totalWords: exercises.length,
      exercises,
    };
  }
}
