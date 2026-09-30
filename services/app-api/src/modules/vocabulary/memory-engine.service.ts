import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CefrLevel, VocabStatus } from '@prisma/client';

export interface ExtractedCaptureWord {
  word: string;
  contextSentence: string;
  contextMeaning: string;
  cefrLevel: CefrLevel;
  collocations: string[];
  importanceScore: number;
  isKnown: boolean;
  statusText?: string;
}

@Injectable()
export class MemoryEngineService {
  private readonly logger = new Logger(MemoryEngineService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 1. VOCABULARY X-RAY: Full Diagnostic of Learner's Vocabulary Brain
   */
  async getVocabularyXRay(userId: string) {
    const userVocabs = await this.prisma.userVocabulary.findMany({
      where: { userId },
      include: {
        vocabulary: {
          select: {
            id: true,
            word: true,
            cefrLevel: true,
            partOfSpeech: true,
            meanings: { take: 1, select: { domain: true, register: true } },
          },
        },
      },
    });

    const trackedCount = userVocabs.length;
    if (trackedCount === 0) {
      return {
        hasEnoughData: false,
        trackedCount: 0,
        message: 'Chưa có đủ dữ liệu học tập. Hãy bắt đầu ôn tập một vài từ để kích hoạt Vocabulary X-Ray!',
        categories: { strong: 0, unstable: 0, atRisk: 0, forgotten: 0 },
        dimensions: { recognition: 0, recall: 0, context: 0, usage: 0, speaking: 0 },
        cefrDistribution: { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 },
        weakAreas: [],
      };
    }

    let strongCount = 0;
    let unstableCount = 0;
    let atRiskCount = 0;
    let forgottenCount = 0;

    let sumRecognition = 0;
    let sumRecall = 0;
    let sumContext = 0;
    let sumUsage = 0;
    let sumSpeaking = 0;

    const cefrCounts: Record<string, number> = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
    const domainErrors: Record<string, { total: number; incorrect: number }> = {
      Business: { total: 0, incorrect: 0 },
      Academic: { total: 0, incorrect: 0 },
      Workplace: { total: 0, incorrect: 0 },
      Collocations: { total: 0, incorrect: 0 },
      'Phrasal verbs': { total: 0, incorrect: 0 },
    };

    for (const uv of userVocabs) {
      // Memory state categorization
      if (uv.masteryScore >= 80 || uv.status === VocabStatus.STRONG || uv.status === VocabStatus.MASTERED) {
        strongCount++;
      } else if (uv.slipRisk > 0.65 || uv.incorrectCount >= 3) {
        forgottenCount++;
      } else if (uv.slipRisk > 0.4 || uv.status === VocabStatus.REVIEW || uv.status === VocabStatus.DORMANT) {
        atRiskCount++;
      } else {
        unstableCount++;
      }

      // Dimension scores (normalized to 0-100)
      const rec = (uv.recognitionScore || (uv.correctCount > 0 ? 0.75 : 0.2)) * 100;
      const reca = (uv.recallScore || (uv.activeRecallScore > 0 ? uv.activeRecallScore : uv.masteryScore / 100)) * 100;
      const ctx = (uv.contextScore || (uv.correctCount >= 2 ? 0.65 : 0.3)) * 100;
      const usg = (uv.productionScore || (uv.masteryScore >= 70 ? 0.55 : 0.25)) * 100;
      const spk = (uv.speakingScore || 0.3) * 100;

      sumRecognition += rec;
      sumRecall += reca;
      sumContext += ctx;
      sumUsage += usg;
      sumSpeaking += spk;

      // CEFR
      const level = uv.vocabulary?.cefrLevel || 'B1';
      if (cefrCounts[level] !== undefined) {
        cefrCounts[level]++;
      }

      // Domain telemetry
      const domain = uv.vocabulary?.meanings?.[0]?.domain || 'Workplace';
      const matchedDomain = domain.includes('Business')
        ? 'Business'
        : domain.includes('Tech') || domain.includes('Academic')
        ? 'Academic'
        : 'Workplace';

      domainErrors[matchedDomain].total++;
      if (uv.incorrectCount > 0 || uv.slipRisk > 0.5) {
        domainErrors[matchedDomain].incorrect++;
      }
    }

    const avgRec = Math.round(sumRecognition / trackedCount);
    const avgRecall = Math.round(sumRecall / trackedCount);
    const avgContext = Math.round(sumContext / trackedCount);
    const avgUsage = Math.round(sumUsage / trackedCount);
    const avgSpeaking = Math.round(sumSpeaking / trackedCount);

    const weakAreas = Object.entries(domainErrors)
      .filter(([_, data]) => data.total > 0)
      .map(([name, data]) => ({
        domain: name,
        errorRate: Math.round((data.incorrect / data.total) * 100),
        wordsTracked: data.total,
      }))
      .sort((a, b) => b.errorRate - a.errorRate);

    return {
      hasEnoughData: trackedCount >= 3,
      trackedCount,
      categories: {
        strong: strongCount,
        unstable: unstableCount,
        atRisk: atRiskCount,
        forgotten: forgottenCount,
      },
      dimensions: {
        recognition: Math.min(100, Math.max(10, avgRec)),
        recall: Math.min(100, Math.max(10, avgRecall)),
        context: Math.min(100, Math.max(10, avgContext)),
        usage: Math.min(100, Math.max(10, avgUsage)),
        speaking: Math.min(100, Math.max(10, avgSpeaking)),
      },
      cefrDistribution: cefrCounts,
      weakAreas,
    };
  }

  /**
   * 2. "WHY AM I BAD AT THIS WORD?" & WORD JOURNEY
   */
  async getWordDiagnosticAndJourney(wordId: string, userId: string) {
    const vocab = await this.prisma.vocabulary.findUnique({
      where: { id: wordId },
      include: {
        meanings: true,
        examples: { take: 3 },
      },
    });
    if (!vocab) throw new NotFoundException('Không tìm thấy từ vựng này.');

    const userVocab = await this.prisma.userVocabulary.findUnique({
      where: { userId_vocabularyId: { userId, vocabularyId: wordId } },
    });

    const journeyEvents = await this.prisma.wordJourneyEvent.findMany({
      where: { userId, vocabularyId: wordId },
      orderBy: { createdAt: 'asc' },
    });

    // Diagnostic calculation
    const seenCount = userVocab?.repetitionCount || 0;
    const correctCount = userVocab?.correctCount || 0;
    const incorrectCount = userVocab?.incorrectCount || 0;
    const recScore = userVocab?.recognitionScore || (correctCount > 0 ? 0.85 : 0.4);
    const recallScore = userVocab?.recallScore || (userVocab?.masteryScore ? userVocab.masteryScore / 100 : 0.3);
    const contextScore = userVocab?.contextScore || (correctCount >= 2 ? 0.6 : 0.25);
    const prodScore = userVocab?.productionScore || 0.2;

    // Detect root cause weakness
    let primaryWeakness = 'Mới học (Cần ôn luyện nhận diện)';
    let nextBestActivity = 'Ôn tập lặp lại ngắt quãng (Flashcard)';
    let weaknessDetails = 'Bạn mới tiếp cận từ này, cần củng cố ghi nhớ cơ bản.';

    if (recScore >= 0.75 && prodScore < 0.4) {
      primaryWeakness = 'Biết từ nhưng chưa dùng được (Active Production)';
      nextBestActivity = 'Viết câu chứa từ → Trò chuyện AI Tutor';
      weaknessDetails = 'Bạn nhận diện nghĩa rất tốt trong bài trắc nghiệm, nhưng chưa tự tin chủ động đặt câu hoặc nói từ này.';
    } else if (recScore >= 0.7 && contextScore < 0.45) {
      primaryWeakness = 'Yếu ngữ cảnh thực tế (Context Understanding)';
      nextBestActivity = 'Đọc ngữ cảnh & Điền từ trong đoạn văn';
      weaknessDetails = 'Bạn hiểu nghĩa từ điển nhưng hay bị nhầm lẫn khi từ xuất hiện trong ngữ cảnh công việc hoặc câu phức tạp.';
    } else if (incorrectCount >= 3) {
      primaryWeakness = 'Hay bị quên hoặc nhầm lẫn (Memory Lapse / Confusion)';
      nextBestActivity = 'Phân biệt cặp từ hay nhầm → Giải thích nghĩa gốc';
      weaknessDetails = 'Bạn có xu hướng bị quên nghĩa sau 2-3 ngày hoặc nhầm với từ có phát âm/cách viết tương đồng.';
    }

    return {
      word: {
        id: vocab.id,
        word: vocab.word,
        pronunciation: vocab.pronunciation || vocab.phonetic,
        partOfSpeech: vocab.partOfSpeech,
        definition: vocab.definition,
        cefrLevel: vocab.cefrLevel,
        meanings: vocab.meanings,
        examples: vocab.examples,
      },
      diagnostic: {
        seenCount,
        correctCount,
        incorrectCount,
        recognitionRate: Math.round(recScore * 100),
        recallRate: Math.round(recallScore * 100),
        contextRate: Math.round(contextScore * 100),
        productionRate: Math.round(prodScore * 100),
        stabilityDays: userVocab?.stability || 1.0,
        primaryWeakness,
        weaknessDetails,
        nextBestActivity,
        recommendedReviewMode: userVocab?.recommendedReviewMode || (prodScore < 0.4 ? 'PRODUCTION' : 'RECOGNITION'),
      },
      timeline: journeyEvents.map((e) => ({
        id: e.id,
        eventType: e.eventType,
        details: e.details,
        metadata: e.metadata,
        timestamp: e.createdAt,
      })),
    };
  }

  /**
   * 3. REAL-WORLD VOCABULARY CAPTURE: Extract, Contextualize & Filter Known Words
   */
  async captureAndAnalyzeText(userId: string, rawText: string, sourceTitle?: string) {
    const text = (rawText || '').trim();
    if (text.length < 10) {
      throw new BadRequestException('Vui lòng cung cấp đoạn văn bản tiếng Anh dài tối thiểu từ 10 ký tự.');
    }

    // Tokenize into clean words
    const tokens = text
      .toLowerCase()
      .replace(/[^a-zA-Z\s-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !/^(the|and|for|with|this|that|from|have|are|was|were|been|will|would|can|could|should|about|they|their|them|your|what|when|where|which|who)$/i.test(w));

    const uniqueWords = Array.from(new Set(tokens)).slice(0, 40);

    // Retrieve user's existing knowledge base to exclude known words
    const userVocabs = await this.prisma.userVocabulary.findMany({
      where: {
        userId,
        vocabulary: { word: { in: uniqueWords } },
      },
      include: { vocabulary: { select: { word: true } } },
    });

    const knownWordsMap = new Set(
      userVocabs
        .filter((uv) => uv.masteryScore >= 70 || uv.status === VocabStatus.STRONG || uv.status === VocabStatus.MASTERED)
        .map((uv) => uv.vocabulary.word.toLowerCase()),
    );

    // Context sentence extraction helper
    const sentences = text.split(/(?<=[.?!])\s+/);

    const candidates: ExtractedCaptureWord[] = [];
    for (const w of uniqueWords) {
      const isKnown = knownWordsMap.has(w);

      // Find sentence containing this word
      const contextSentence =
        sentences.find((s) => new RegExp(`\\b${w}\\b`, 'i').test(s))?.trim() ||
        `This passage emphasizes the role of ${w}.`;

      // Estimate CEFR & importance
      let cefrLevel: CefrLevel = CefrLevel.B1;
      let importanceScore = 0.75;
      if (w.length >= 9 || /(ility|tion|ment|able|ence|ance|ize)$/i.test(w)) {
        cefrLevel = CefrLevel.B2;
        importanceScore = 0.88;
      }
      if (w.length >= 11 || /(sophist|omnip|compreh|prereq|concurr)/i.test(w)) {
        cefrLevel = CefrLevel.C1;
        importanceScore = 0.95;
      }

      candidates.push({
        word: w,
        contextSentence,
        contextMeaning: `Nghĩa trong ngữ cảnh: dùng để diễn đạt khái niệm liên quan đến "${w}" trong đoạn trích`,
        cefrLevel,
        collocations: [`${w} strategy`, `effective ${w}`, `implement ${w}`],
        importanceScore,
        isKnown,
        statusText: isKnown ? 'Đã thành thạo' : importanceScore >= 0.85 ? 'Từ vựng giá trị cao' : 'Khuyên dùng',
      });
    }

    // Rank candidates: Unknown high-value words first
    candidates.sort((a, b) => {
      if (a.isKnown !== b.isKnown) return a.isKnown ? 1 : -1;
      return b.importanceScore - a.importanceScore;
    });

    return {
      totalFound: candidates.length,
      recommendedCount: candidates.filter((c) => !c.isKnown).length,
      alreadyKnownCount: candidates.filter((c) => c.isKnown).length,
      candidates,
    };
  }

  /**
   * 4. SAVE CAPTURED VOCABULARY TO LEARNING LOOP
   */
  async saveCapturedVocabulary(
    userId: string,
    payload: {
      sourceTitle?: string;
      rawText: string;
      words: Array<{
        word: string;
        contextSentence?: string;
        contextMeaning?: string;
        cefrLevel?: CefrLevel;
        collocations?: string[];
      }>;
    },
  ) {
    const { sourceTitle, rawText, words } = payload;
    if (!words || words.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất 1 từ vựng để thêm vào lộ trình học.');
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Create Capture Record
      const capture = await tx.vocabularyCapture.create({
        data: {
          userId,
          sourceTitle: sourceTitle || 'Đoạn văn tự do',
          rawText,
          extractedCount: words.length,
          selectedCount: words.length,
        },
      });

      const savedWords: any[] = [];

      for (const item of words) {
        const cleanWord = item.word.toLowerCase().trim();

        // Save capture item
        await tx.vocabularyCaptureItem.create({
          data: {
            captureId: capture.id,
            word: cleanWord,
            contextSentence: item.contextSentence,
            contextMeaning: item.contextMeaning,
            cefrLevel: item.cefrLevel || CefrLevel.B1,
            collocations: item.collocations || [],
            isSelected: true,
          },
        });

        // Ensure Vocabulary entity exists
        let vocab = await tx.vocabulary.findUnique({ where: { word: cleanWord } });
        if (!vocab) {
          vocab = await tx.vocabulary.create({
            data: {
              word: cleanWord,
              normalizedWord: cleanWord,
              definition: item.contextMeaning || `Từ vựng trích xuất từ ngữ cảnh: "${cleanWord}"`,
              cefrLevel: item.cefrLevel || CefrLevel.B1,
              difficulty: 3.0,
              examples: item.contextSentence
                ? {
                    create: {
                      sentence: item.contextSentence,
                      translation: item.contextMeaning,
                      sourceType: 'USER_CAPTURE',
                    },
                  }
                : undefined,
            },
          });
        }

        // Initialize UserVocabulary state in Learning Loop
        const userVocab = await tx.userVocabulary.upsert({
          where: { userId_vocabularyId: { userId, vocabularyId: vocab.id } },
          create: {
            userId,
            vocabularyId: vocab.id,
            status: VocabStatus.LEARNING,
            masteryScore: 15,
            recognitionScore: 0.5,
            recallScore: 0.2,
            contextScore: 0.6, // High because captured from real context!
            productionScore: 0.1,
            recommendedReviewMode: 'CONTEXT',
            nextReviewAt: new Date(),
            firstLearnedAt: new Date(),
          },
          update: {
            contextScore: 0.7,
            nextReviewAt: new Date(),
          },
        });

        // Log Word Journey Event
        await tx.wordJourneyEvent.create({
          data: {
            userId,
            vocabularyId: vocab.id,
            eventType: 'VOCAB_CAPTURED',
            details: `Trích xuất từ tài liệu "${sourceTitle || 'Ngữ cảnh thực tế'}": ${item.contextSentence || cleanWord}`,
            metadata: {
              captureId: capture.id,
              contextSentence: item.contextSentence,
              cefr: item.cefrLevel,
            },
          },
        });

        savedWords.push({ word: cleanWord, id: vocab.id });
      }

      return {
        success: true,
        message: `Đã kết nối thành công ${words.length} từ vựng vào Personal Vocabulary Brain & Hàng đợi ôn tập Smart Review!`,
        captureId: capture.id,
        savedWords,
      };
    });
  }

  /**
   * 5. SMART REVIEW QUEUE: Grouped by Cognitive Weakness & Micro-Learning
   */
  async getSmartReviewQueue(userId: string) {
    const now = new Date();

    const userVocabs = await this.prisma.userVocabulary.findMany({
      where: {
        userId,
      },
      orderBy: [{ slipRisk: 'desc' }, { nextReviewAt: 'asc' }],
      take: 60,
      include: {
        vocabulary: {
          select: {
            id: true,
            word: true,
            phonetic: true,
            pronunciation: true,
            definition: true,
            cefrLevel: true,
            examples: { take: 1, select: { sentence: true, translation: true } },
          },
        },
      },
    });

    const memoryDue: any[] = [];
    const contextWeak: any[] = [];
    const productionWeak: any[] = [];
    const recentlyForgotten: any[] = [];

    for (const uv of userVocabs) {
      const item = {
        id: uv.id,
        vocabularyId: uv.vocabularyId,
        word: uv.vocabulary.word,
        phonetic: uv.vocabulary.phonetic || uv.vocabulary.pronunciation,
        definition: uv.vocabulary.definition,
        cefrLevel: uv.vocabulary.cefrLevel,
        example: uv.vocabulary.examples?.[0]?.sentence || null,
        status: uv.status,
        masteryScore: uv.masteryScore,
        slipRisk: uv.slipRisk,
        recognitionScore: uv.recognitionScore,
        productionScore: uv.productionScore,
        recommendedMode: uv.recommendedReviewMode || 'RECOGNITION',
      };

      if (uv.incorrectCount >= 2 || uv.slipRisk > 0.6) {
        recentlyForgotten.push(item);
      } else if (uv.recognitionScore >= 0.7 && uv.productionScore < 0.45) {
        // High recognition but low production -> Use It or Lose It!
        productionWeak.push(item);
      } else if (uv.contextScore < 0.45) {
        contextWeak.push(item);
      } else if (!uv.nextReviewAt || uv.nextReviewAt <= now) {
        memoryDue.push(item);
      }
    }

    const totalQueueCount = memoryDue.length + contextWeak.length + productionWeak.length + recentlyForgotten.length;

    return {
      totalQueueCount,
      summary: {
        memoryDueCount: memoryDue.length,
        contextWeakCount: contextWeak.length,
        productionWeakCount: productionWeak.length,
        recentlyForgottenCount: recentlyForgotten.length,
      },
      smartQueue: {
        memoryDue: memoryDue.slice(0, 15),
        contextWeak: contextWeak.slice(0, 10),
        productionWeak: productionWeak.slice(0, 10),
        recentlyForgotten: recentlyForgotten.slice(0, 10),
      },
      microLearningSessions: {
        threeMin: userVocabs.slice(0, 5),
        fiveMin: userVocabs.slice(0, 10),
        tenMin: userVocabs.slice(0, 20),
        fifteenMin: userVocabs.slice(0, 30),
      },
    };
  }

  /**
   * 6. USE IT OR LOSE IT: Production Learning Evaluation & Learning Loop Feedback
   */
  async evaluateProductionExercise(
    userId: string,
    payload: {
      vocabularyId: string;
      userSentence: string;
      exerciseType: 'CREATE_SENTENCE' | 'FILL_BLANK' | 'COLLOCATION_PICK';
    },
  ) {
    const { vocabularyId, userSentence, exerciseType } = payload;
    const cleanSentence = (userSentence || '').trim();

    const vocab = await this.prisma.vocabulary.findUnique({
      where: { id: vocabularyId },
    });
    if (!vocab) throw new NotFoundException('Không tìm thấy từ vựng.');

    // Production validity check: Sentence must be >= 4 words and contain the target word
    const hasTargetWord = new RegExp(`\\b${vocab.word}\\b`, 'i').test(cleanSentence);
    const wordCount = cleanSentence.split(/\s+/).length;
    const isValidProduction = hasTargetWord && wordCount >= 4;

    const userVocab = await this.prisma.userVocabulary.findUnique({
      where: { userId_vocabularyId: { userId, vocabularyId } },
    });

    const currentProd = userVocab?.productionScore || 0.2;
    const newProd = isValidProduction ? Math.min(1.0, currentProd + 0.2) : Math.max(0.1, currentProd - 0.05);

    await this.prisma.userVocabulary.update({
      where: { userId_vocabularyId: { userId, vocabularyId } },
      data: {
        productionScore: newProd,
        lastReviewMode: 'PRODUCTION',
        recommendedReviewMode: newProd >= 0.7 ? 'CONVERSATION' : 'PRODUCTION',
        masteryScore: isValidProduction ? Math.min(100, (userVocab?.masteryScore || 50) + 6) : undefined,
      },
    });

    // Log Word Journey Event
    await this.prisma.wordJourneyEvent.create({
      data: {
        userId,
        vocabularyId,
        eventType: isValidProduction ? 'SENTENCE_PRODUCTION_SUCCESS' : 'SENTENCE_PRODUCTION_ATTEMPT',
        details: `Người dùng tự đặt câu: "${cleanSentence}"`,
        metadata: { exerciseType, isValidProduction, newProductionScore: newProd },
      },
    });

    return {
      success: true,
      isValidProduction,
      scoreGained: isValidProduction ? 15 : 5,
      feedback: isValidProduction
        ? `Tuyệt vời! Bạn đã sử dụng chính xác từ "${vocab.word}" trong câu hoàn chỉnh.`
        : `Câu cần chứa từ "${vocab.word}" và có độ dài tối thiểu từ 4 từ để đạt chuẩn sử dụng chủ động.`,
      newProductionScore: Math.round(newProd * 100),
    };
  }

  /**
   * 7. CONFUSION ENGINE: Detected Confused Pairs & Targeted Reviews
   */
  async getConfusionEngineData(userId: string) {
    const userConfusions = await this.prisma.vocabularyConfusionPair.findMany({
      where: { userId },
      include: {
        word1: { select: { id: true, word: true, definition: true, partOfSpeech: true } },
        word2: { select: { id: true, word: true, definition: true, partOfSpeech: true } },
      },
      orderBy: { confusionCount: 'desc' },
      take: 10,
    });

    // Default classic confused pairs for English / TOEIC learners
    const defaultPairs = [
      {
        word1: 'affect',
        part1: 'verb',
        meaning1: 'tác động / ảnh hưởng đến',
        example1: 'The change in tax policy affected company revenue.',
        word2: 'effect',
        part2: 'noun',
        meaning2: 'kết quả / hiệu ứng',
        example2: 'The positive effect was noticed immediately.',
        tip: 'affect là Động từ (Action), effect là Danh từ (Noun/Result).',
      },
      {
        word1: 'borrow',
        part1: 'verb',
        meaning1: 'mượn (nhận vào)',
        example1: 'Can I borrow your laptop for 10 minutes?',
        word2: 'lend',
        part2: 'verb',
        meaning2: 'cho mượn (đưa đi)',
        example2: 'The bank agreed to lend us 50,000 USD.',
        tip: 'Borrow = nhận về; Lend = cho người khác mượn.',
      },
      {
        word1: 'economic',
        part1: 'adj',
        meaning1: 'thuộc về nền kinh tế',
        example1: 'The country faces economic challenges.',
        word2: 'economical',
        part2: 'adj',
        meaning2: 'tiết kiệm / kinh tế',
        example2: 'This electric car is very economical on fuel.',
        tip: 'Economic = vĩ mô kinh tế; Economical = tiết kiệm chi phí.',
      },
      {
        word1: 'adapt',
        part1: 'verb',
        meaning1: 'thích nghi / điều chỉnh',
        example1: 'Our team adapted quickly to remote work.',
        word2: 'adopt',
        part2: 'verb',
        meaning2: 'nhận nuôi / áp dụng chính sách mới',
        example2: 'We decided to adopt a new CI/CD strategy.',
        tip: 'Adapt = thay đổi để thích nghi; Adopt = chọn và áp dụng cái mới.',
      },
    ];

    return {
      personalizedPairs: userConfusions.map((c) => ({
        id: c.id,
        word1: c.word1.word,
        meaning1: c.word1.definition,
        word2: c.word2.word,
        meaning2: c.word2.definition,
        confusionCount: c.confusionCount,
      })),
      curatedPairs: defaultPairs,
    };
  }

  /**
   * 8. LEARNING GOAL & MISSION
   */
  async updateLearningGoal(userId: string, primaryGoal: string, secondaryGoal?: string) {
    const updated = await this.prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        primaryGoal: primaryGoal || 'TOEIC',
        secondaryGoal: secondaryGoal || 'Workplace Communication',
      },
      update: {
        primaryGoal,
        secondaryGoal,
      },
    });

    return {
      success: true,
      message: `Đã cập nhật mục tiêu học tập chính: ${primaryGoal}. Các bài học và trợ giảng AI sẽ ưu tiên ngữ cảnh này!`,
      goal: {
        primary: updated.primaryGoal,
        secondary: updated.secondaryGoal,
      },
    };
  }
}
