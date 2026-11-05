import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdaptiveEngineService } from './adaptive-engine.service';
import { StartSessionDto } from './dto/start-session.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { BatchReviewDto } from './dto/batch-review.dto';
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

    // Combine candidate vocabulary items (safely filtered for valid vocabs)
    const allCandidates = [
      ...dueUserVocabs.filter((uv) => !!uv.vocabulary).map((uv) => ({ vocab: uv.vocabulary, origin: 'DUE' })),
      ...weakUserVocabs.filter((uv) => !!uv.vocabulary).map((uv) => ({ vocab: uv.vocabulary, origin: 'WEAK' })),
      ...newVocabs.filter((v) => !!v).map((v) => ({ vocab: v, origin: 'NEW' })),
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
      const meaning = (vocab.meanings && vocab.meanings[0]?.meaning) || vocab.shortDefinition || vocab.definition || vocab.word;
      const example = (vocab.examples && vocab.examples[0]?.sentence) || null;

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

  /**
   * Complete review session via batch submission in a single atomic transaction.
   * Handles idempotency, writes ReviewEvents, updates UserVocabulary, awards XP, and updates streak.
   */
  async completeBatchSession(userId: string, dto: BatchReviewDto) {
    if (!dto.reviews || !Array.isArray(dto.reviews) || dto.reviews.length === 0) {
      throw new BadRequestException('Danh sách từ ôn tập không được để trống.');
    }

    const now = new Date();
    const reviews = dto.reviews;
    const totalQuestions = reviews.length;
    const correctCount = reviews.filter((r) => r.isCorrect).length;
    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    // Idempotency check: if session already exists and completed, return existing result
    if (dto.sessionId) {
      const existingSession = await this.prisma.studySession.findUnique({
        where: { id: dto.sessionId },
      });
      if (existingSession && existingSession.completedAt && existingSession.userId === userId) {
        const [userXP, userStreak] = await Promise.all([
          this.prisma.userXP.findUnique({ where: { userId } }),
          this.prisma.userStreak.findUnique({ where: { userId } }),
        ]);
        return {
          sessionId: existingSession.id,
          totalXP: userXP?.totalXP || 0,
          currentLevel: userXP?.currentLevel || 1,
          currentStreak: userStreak?.currentStreak || 0,
          longestStreak: userStreak?.longestStreak || 0,
          xpGained: existingSession.xpEarned,
          accuracy: Math.round(existingSession.score || accuracy),
          totalQuestions,
          correctCount,
          completedAt: existingSession.completedAt,
        };
      }
    }

    // Pre-calculate XP:
    // +15 XP per correct recall, +5 XP per attempted recall, +20 XP session completion bonus
    const xpPerCorrect = 15;
    const xpPerAttempt = 5;
    const completionBonus = 20;
    const rawXPEarned = (correctCount * xpPerCorrect) + ((totalQuestions - correctCount) * xpPerAttempt) + completionBonus;
    const xpEarned = Math.min(rawXPEarned, 500); // anti-farm max 500 XP per session

    // Pre-fetch UserXP and UserStreak
    const [currentXPRecord, streakRecord] = await Promise.all([
      this.prisma.userXP.findUnique({ where: { userId } }),
      this.prisma.userStreak.findUnique({ where: { userId } }),
    ]);

    const newTotalXP = (currentXPRecord?.totalXP || 0) + xpEarned;
    const newLevel = Math.floor(Math.sqrt(newTotalXP / 50)) + 1;

    // Streak calculation based on calendar day
    let currentStreak = streakRecord?.currentStreak || 0;
    let longestStreak = streakRecord?.longestStreak || 0;
    const todayStr = now.toISOString().split('T')[0];
    const lastStudyStr = streakRecord?.lastStudyDate ? new Date(streakRecord.lastStudyDate).toISOString().split('T')[0] : null;

    let shouldUpdateStreak = false;
    if (!lastStudyStr) {
      currentStreak = 1;
      longestStreak = Math.max(longestStreak, 1);
      shouldUpdateStreak = true;
    } else if (lastStudyStr !== todayStr) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (lastStudyStr === yesterday) {
        currentStreak += 1;
      } else {
        currentStreak = 1;
      }
      longestStreak = Math.max(longestStreak, currentStreak);
      shouldUpdateStreak = true;
    }

    // Execute atomic transaction
    return await this.prisma.$transaction(async (tx) => {
      // 1. Create or update StudySession
      let session: any;
      if (dto.sessionId) {
        session = await tx.studySession.upsert({
          where: { id: dto.sessionId },
          update: {
            completedAt: now,
            duration: dto.durationSeconds || 60,
            score: accuracy,
            xpEarned,
          },
          create: {
            id: dto.sessionId,
            userId,
            type: dto.studyMode === 'learn' ? SessionType.QUICK_LEARN : SessionType.SMART_REVIEW,
            startedAt: new Date(now.getTime() - (dto.durationSeconds || 60) * 1000),
            completedAt: now,
            duration: dto.durationSeconds || 60,
            score: accuracy,
            xpEarned,
          },
        });
      } else {
        session = await tx.studySession.create({
          data: {
            userId,
            type: dto.studyMode === 'learn' ? SessionType.QUICK_LEARN : SessionType.SMART_REVIEW,
            startedAt: new Date(now.getTime() - (dto.durationSeconds || 60) * 1000),
            completedAt: now,
            duration: dto.durationSeconds || 60,
            score: accuracy,
            xpEarned,
          },
        });
      }

      // 2. Process each vocabulary review item
      let masteredCount = 0;
      let needsReviewCount = 0;

      for (const item of reviews) {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.vocabularyId);

        let targetVocabId = item.vocabularyId;
        if (!isUUID && item.word) {
          const found = await tx.vocabulary.findFirst({
            where: { word: { equals: item.word, mode: 'insensitive' } },
            select: { id: true },
          });
          if (found) targetVocabId = found.id;
        }

        const validVocab = isUUID || targetVocabId !== item.vocabularyId;
        if (validVocab) {
          const userVocab = await tx.userVocabulary.findUnique({
            where: { userId_vocabularyId: { userId, vocabularyId: targetVocabId } },
          });

          const prevStability = userVocab?.stability || 1.0;
          const prevDifficulty = userVocab?.difficultyEstimate || 3.0;
          const prevMastery = userVocab?.masteryScore || 0;

          let updatedStability = prevStability;
          let updatedDifficulty = prevDifficulty;
          let updatedMastery = prevMastery;
          let nextReviewDate = new Date();
          let nextStatus: any = 'LEARNING';

          if (item.rating === 'AGAIN' || !item.isCorrect) {
            updatedStability = Math.max(0.4, prevStability * 0.5);
            updatedDifficulty = Math.min(10.0, prevDifficulty + 1.0);
            updatedMastery = Math.max(0, prevMastery - 15);
            nextReviewDate = new Date(now.getTime() + 10 * 60 * 1000);
            nextStatus = 'LEARNING';
            needsReviewCount++;
          } else if (item.rating === 'HARD') {
            updatedStability = prevStability * 1.2;
            updatedDifficulty = Math.min(10.0, prevDifficulty + 0.5);
            updatedMastery = Math.min(100, prevMastery + 5);
            nextReviewDate = new Date(now.getTime() + Math.round(updatedStability) * 86400000);
            nextStatus = 'LEARNING';
          } else if (item.rating === 'GOOD') {
            updatedStability = Math.max(2.0, prevStability * 2.2);
            updatedDifficulty = Math.max(1.0, prevDifficulty - 0.2);
            updatedMastery = Math.min(100, prevMastery + 12);
            nextReviewDate = new Date(now.getTime() + Math.round(updatedStability) * 86400000);
            nextStatus = updatedMastery >= 75 ? 'REVIEW' : 'LEARNING';
            if (updatedMastery >= 75) masteredCount++;
          } else if (item.rating === 'EASY') {
            updatedStability = Math.max(4.0, prevStability * 3.5);
            updatedDifficulty = Math.max(1.0, prevDifficulty - 0.5);
            updatedMastery = Math.min(100, prevMastery + 20);
            nextReviewDate = new Date(now.getTime() + Math.round(updatedStability) * 86400000);
            nextStatus = updatedMastery >= 85 ? 'MASTERED' : 'REVIEW';
            masteredCount++;
          } else {
            if (item.isCorrect) {
              updatedStability = prevStability * 1.8;
              updatedMastery = Math.min(100, prevMastery + 10);
              nextReviewDate = new Date(now.getTime() + Math.round(updatedStability) * 86400000);
              nextStatus = updatedMastery >= 80 ? 'REVIEW' : 'LEARNING';
              masteredCount++;
            } else {
              updatedStability = Math.max(0.5, prevStability * 0.5);
              updatedMastery = Math.max(0, prevMastery - 12);
              nextReviewDate = new Date(now.getTime() + 10 * 60 * 1000);
              nextStatus = 'LEARNING';
              needsReviewCount++;
            }
          }

          const newSlip = !item.isCorrect ? Math.min(1.0, (userVocab?.slipRisk || 0) + 0.35) : Math.max(0, (userVocab?.slipRisk || 0) - 0.2);

          await tx.userVocabulary.upsert({
            where: { userId_vocabularyId: { userId, vocabularyId: targetVocabId } },
            update: {
              status: nextStatus,
              masteryScore: updatedMastery,
              stability: updatedStability,
              difficultyEstimate: updatedDifficulty,
              repetitionCount: (userVocab?.repetitionCount || 0) + 1,
              correctCount: item.isCorrect ? (userVocab?.correctCount || 0) + 1 : userVocab?.correctCount || 0,
              incorrectCount: !item.isCorrect ? (userVocab?.incorrectCount || 0) + 1 : userVocab?.incorrectCount || 0,
              lastReviewedAt: now,
              nextReviewAt: nextReviewDate,
              confidence: item.confidence || 3,
              slipRisk: newSlip,
            },
            create: {
              userId,
              vocabularyId: targetVocabId,
              status: nextStatus,
              masteryScore: updatedMastery,
              stability: updatedStability,
              difficultyEstimate: updatedDifficulty,
              repetitionCount: 1,
              correctCount: item.isCorrect ? 1 : 0,
              incorrectCount: item.isCorrect ? 0 : 1,
              lastReviewedAt: now,
              nextReviewAt: nextReviewDate,
              confidence: item.confidence || 3,
              slipRisk: newSlip,
            },
          });

          await tx.reviewEvent.create({
            data: {
              userId,
              vocabularyId: targetVocabId,
              sessionId: session.id,
              answer: item.answer || item.rating || (item.isCorrect ? 'CORRECT' : 'INCORRECT'),
              correct: item.isCorrect,
              responseTimeMs: item.responseTimeMs || 1500,
              confidence: item.confidence || 3,
              hintUsed: item.hintUsed || false,
              skipped: item.skipped || false,
            },
          });
        }
      }

      await tx.userXP.upsert({
        where: { userId },
        update: { totalXP: newTotalXP, currentLevel: newLevel },
        create: { userId, totalXP: newTotalXP, currentLevel: newLevel },
      });

      if (shouldUpdateStreak) {
        await tx.userStreak.upsert({
          where: { userId },
          update: { currentStreak, longestStreak, lastStudyDate: now },
          create: { userId, currentStreak, longestStreak, lastStudyDate: now },
        });
      }

      return {
        sessionId: session.id,
        totalXP: newTotalXP,
        currentLevel: newLevel,
        currentStreak,
        longestStreak,
        xpGained: xpEarned,
        accuracy,
        totalQuestions,
        correctCount,
        masteredCount,
        needsReviewCount,
        completedAt: session.completedAt,
      };
    });
  }

  /**
   * Lấy danh sách Từ Hay Quên (Forgotten Words) có lọc và phân trang chuẩn xác
   */
  async getForgottenWords(userId: string, query: { languageId?: string; filter?: string; sortBy?: string; page?: number; limit?: number }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;
    const now = new Date();
    const filter = (query.filter || 'ALL').toUpperCase();

    let whereClause: any = {
      userId,
      ...(query.languageId ? { vocabulary: { languageId: query.languageId } } : {}),
    };

    if (filter === 'RECENTLY_FORGOTTEN') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
      whereClause.lastReviewedAt = { gte: sevenDaysAgo };
      whereClause.incorrectCount = { gte: 1 };
    } else if (filter === 'FREQUENTLY_MISSED') {
      whereClause.incorrectCount = { gte: 2 };
    } else if (filter === 'DUE_FOR_REVIEW') {
      whereClause.nextReviewAt = { lte: now };
    } else if (filter === 'WEAK_VOCABULARY') {
      whereClause.masteryScore = { lte: 45 };
    } else {
      whereClause.OR = [
        { slipRisk: { gte: 0.35 } },
        { incorrectCount: { gte: 1 } },
        { masteryScore: { lte: 50 } },
        { nextReviewAt: { lte: now } },
      ];
    }

    let orderBy: any = [{ slipRisk: 'desc' }, { masteryScore: 'asc' }];
    if (query.sortBy === 'incorrectCount') {
      orderBy = [{ incorrectCount: 'desc' }];
    } else if (query.sortBy === 'lastReviewedAt') {
      orderBy = [{ lastReviewedAt: 'desc' }];
    } else if (query.sortBy === 'masteryScore') {
      orderBy = [{ masteryScore: 'asc' }];
    }

    const [total, items] = await Promise.all([
      this.prisma.userVocabulary.count({ where: whereClause }),
      this.prisma.userVocabulary.findMany({
        where: whereClause,
        include: {
          vocabulary: {
            include: {
              meanings: true,
              examples: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    const mapped = items.map((uv) => {
      const v = uv.vocabulary;
      const primaryMeaning = v.meanings[0]?.meaning || v.shortDefinition || v.definition || '';
      return {
        id: v.id,
        word: v.word,
        meaning: primaryMeaning,
        phonetic: v.phonetic || v.pronunciation,
        partOfSpeech: v.partOfSpeech,
        cefrLevel: v.cefrLevel,
        audioUrl: v.audioUrl,
        exampleSentence: v.examples[0]?.sentence || null,
        exampleTranslation: v.examples[0]?.translation || null,
        masteryScore: uv.masteryScore,
        slipRisk: Math.round(uv.slipRisk * 100),
        incorrectCount: uv.incorrectCount,
        correctCount: uv.correctCount,
        lastReviewedAt: uv.lastReviewedAt,
        nextReviewAt: uv.nextReviewAt,
        status: uv.status,
      };
    });

    return {
      items: mapped,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      meta: {
        summary: {
          totalForgotten: total,
          urgency: total >= 10 ? 'HIGH' : total > 0 ? 'MEDIUM' : 'LOW',
        },
      },
    };
  }

  /**
   * Chẩn đoán nguyên nhân hay quên / dùng sai từ vựng (Word Memory Root-Cause Diagnostic)
   */
  async getVocabularyDiagnostic(vocabularyId: string, userId: string) {
    const vocab = await this.prisma.vocabulary.findUnique({
      where: { id: vocabularyId },
      include: {
        meanings: true,
        examples: true,
      },
    });

    if (!vocab) {
      throw new NotFoundException(`Vocabulary item ${vocabularyId} not found`);
    }

    const [userVocab, recentEvents] = await Promise.all([
      this.prisma.userVocabulary.findUnique({
        where: { userId_vocabularyId: { userId, vocabularyId } },
      }),
      this.prisma.reviewEvent.findMany({
        where: { userId, vocabularyId },
        orderBy: { reviewedAt: 'desc' },
        take: 6,
      }),
    ]);

    const stability = userVocab?.stability || 1.0;
    const retrievability = userVocab?.retrievability || 0.6;
    const difficulty = userVocab?.difficultyEstimate || vocab.difficulty || 3.0;
    const incorrectCount = userVocab?.incorrectCount || 0;
    const correctCount = userVocab?.correctCount || 0;

    const reasons: string[] = [];
    if (incorrectCount >= 2) {
      reasons.push('Sai nhiều lần trong các bài kiểm tra nhớ chủ động (Active Recall).');
    }
    if (stability < 1.5) {
      reasons.push('Độ bền trí nhớ (Memory Stability) chưa chuyển sang vùng trí nhớ dài hạn.');
    }
    if (difficulty >= 4.0) {
      reasons.push('Từ vựng có độ phức tạp ngữ nghĩa hoặc âm tiết dễ nhầm lẫn.');
    }
    if (recentEvents.some((e) => e.responseTimeMs > 4000)) {
      reasons.push('Thời gian phản xạ nhớ lại (Recall Latency) còn chậm (> 4 giây).');
    }
    if (reasons.length === 0) {
      reasons.push('Từ đang trong chu kỳ lặp lại ngắt quãng tự nhiên (Spaced Repetition Schedule).');
    }

    let recommendedAction = 'Luyện gõ từ và làm bài tập điền từ để củng cố trí nhớ cơ bắp.';
    if (incorrectCount > 2) {
      recommendedAction = 'Xem lại phát âm chuẩn và làm bài trắc nghiệm nhanh để định vị chính xác nét nghĩa.';
    } else if (stability > 3.0) {
      recommendedAction = 'Viết câu hoàn chỉnh với từ này trong ngữ cảnh giao tiếp thực tế.';
    }

    const journey = recentEvents.map((e) => ({
      id: e.id,
      eventType: e.correct ? 'RECALL_SUCCESS' : 'RECALL_LAPSE',
      description: e.correct ? 'Ghi nhớ thành công trong phiên ôn tập' : `Trả lời sai (${e.answer})`,
      createdAt: e.reviewedAt.toISOString(),
    }));

    return {
      vocabulary: {
        id: vocab.id,
        word: vocab.word,
        meaningVi: vocab.meanings[0]?.meaning || vocab.shortDefinition || vocab.definition || '',
        phonetic: vocab.phonetic || vocab.pronunciation,
        partOfSpeech: vocab.partOfSpeech,
        audioUrl: vocab.audioUrl,
      },
      scores: {
        recognition: Math.min(100, Math.round((userVocab?.masteryScore || 50) * 1.1)),
        recall: Math.min(100, Math.round((userVocab?.masteryScore || 40) * 0.9)),
        context: Math.min(100, Math.round((userVocab?.masteryScore || 45) * 0.85)),
        production: Math.min(100, Math.round((userVocab?.masteryScore || 35) * 0.8)),
        speaking: 75,
      },
      memoryStatus: (userVocab?.slipRisk || 0) >= 0.5 ? 'CRITICAL_FORGETTING' : (userVocab?.slipRisk || 0) >= 0.3 ? 'SLIPPING' : 'STABLE',
      stability: Math.round(stability * 10) / 10,
      retrievability: Math.round(retrievability * 100) / 100,
      difficulty: Math.round(difficulty * 10) / 10,
      lapseCount: incorrectCount,
      reasons,
      recommendedAction,
      journey,
      confusionPair: null,
    };
  }

}
