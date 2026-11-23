import { Prisma } from '@prisma/client';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QuestionSourceType, GameModeType } from '@prisma/client';
import { GameQuestionPayload } from './game-mode.interface';
import {
  MULTILINGUAL_VOCABULARY_BANK,
  buildMultipleChoiceQuestion,
} from './multilingual-questions.data';

function mapGameModeToQuestionType(gameMode: GameModeType): string {
  switch (gameMode) {
    case GameModeType.TRANSLATION_RUSH:
    case GameModeType.CLASSIC_QUIZ:
    case GameModeType.SURVIVAL:
    case GameModeType.DUEL:
    case GameModeType.TEAM_BATTLE:
    case GameModeType.BOSS_ROUND:
    case GameModeType.FINAL_SHOWDOWN:
      return 'VOCABULARY_QUIZ';
    case GameModeType.WORD_BLITZ:
      return 'WORD_MATCHING';
    case GameModeType.LISTENING_RUSH:
      return 'LISTENING_CHALLENGE';
    case GameModeType.MISSING_WORD:
      return 'MISSING_WORD';
    case GameModeType.SYNONYM_BATTLE:
      return 'WORD_RECOGNITION';
    case GameModeType.GUESS_WORD:
    case GameModeType.WORD_RUSH:
      return 'SPELLING_CHALLENGE';
    default:
      return 'VOCABULARY_QUIZ';
  }
}

@Injectable()
export class QuestionProviderService {
  private readonly logger = new Logger(QuestionProviderService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Unified adapter to fetch questions from any learning source with multi-language awareness
   */
  async getQuestionsForRoom(
    sourceType: QuestionSourceType,
    sourceId: string | null | undefined,
    count: number = 10,
    gameMode: GameModeType = GameModeType.TRANSLATION_RUSH,
    languageId: string = 'en',
    ownerId?: string,
  ): Promise<GameQuestionPayload[]> {
    let results: GameQuestionPayload[] = [];
    const normalizedLang = (languageId || 'en').toLowerCase().trim();

    try {
      switch (sourceType) {
        case QuestionSourceType.VOCABULARY_DECK:
          results = await this.fetchFromVocabulary(sourceId, count, normalizedLang, gameMode, ownerId);
          break;

        case QuestionSourceType.QUESTION_BANK:
          results = await this.fetchFromExamBank(sourceId, count, normalizedLang, gameMode, ownerId);
          break;

        case QuestionSourceType.GRAMMAR_EXERCISES:
          results = await this.fetchFromGrammarExercises(sourceId, count, normalizedLang, gameMode);
          break;

        case QuestionSourceType.KNOWLEDGE_BASE:
          results = await this.fetchFromKnowledgeBase(sourceId, count, normalizedLang, gameMode);
          break;

        case QuestionSourceType.SYSTEM_PRESET:
        default:
          results = await this.fetchFromSystemPreset(gameMode, count, normalizedLang);
          break;
      }
    } catch (err: any) {
      this.logger.warn(`Failed to fetch from ${sourceType} for [${normalizedLang}]: ${err.message}`);
      throw err;
    }

    const unique = new Map(results.map((question) => [question.prompt.trim().toLowerCase(), question]));
    return Array.from(unique.values()).slice(0, count);
  }

  /**
   * Helper: converts list of words into 4-choice Multiple Choice questions
   */
  private buildMultipleChoiceFromWordList(
    words: Array<{
      id: string;
      word: string;
      meaning: string;
      phonetic?: string | null;
      partOfSpeech?: string | null;
      example?: string | null;
    }>,
    languageId: string,
    gameMode: GameModeType,
  ): GameQuestionPayload[] {
    const letters = ['A', 'B', 'C', 'D'];
    const qType = mapGameModeToQuestionType(gameMode);

    return words.map((w, idx) => {
      // Pick 3 distractors from the rest of the words
      const otherMeanings = words
        .filter((_, i) => i !== idx)
        .map((other) => other.meaning)
        .filter(Boolean);

      const shuffledOthers = otherMeanings.sort(() => 0.5 - Math.random());
      const distractors = shuffledOthers.slice(0, 3);
      if (distractors.length < 3) {
        // Fallback to authentic vocabulary distractors from bank instead of "Lựa chọn B"
        const fallbackItems = MULTILINGUAL_VOCABULARY_BANK[languageId] || MULTILINGUAL_VOCABULARY_BANK['en'] || [];
        for (const fb of fallbackItems) {
          if (fb.meaningVi && fb.meaningVi !== w.meaning && !distractors.includes(fb.meaningVi)) {
            distractors.push(fb.meaningVi);
            if (distractors.length >= 3) break;
          }
        }
      }

      const correctIndex = Math.floor(Math.random() * 4);
      const optionsText: string[] = [];
      let dIdx = 0;
      for (let i = 0; i < 4; i++) {
        if (i === correctIndex) {
          optionsText.push(w.meaning);
        } else {
          optionsText.push(distractors[dIdx++]);
        }
      }

      const options = optionsText.map((opt, i) => `${letters[i]}. ${opt}`);
      const acceptedAnswers = [
        letters[correctIndex],
        letters[correctIndex].toLowerCase(),
        w.word.toLowerCase().trim(),
        w.meaning.toLowerCase().trim(),
      ];
      if (w.phonetic) acceptedAnswers.push(w.phonetic.toLowerCase().trim());

      return {
        id: w.id || `vocab-${idx}`,
        prompt: `Chọn nghĩa đúng của từ「${w.word}」${w.phonetic ? ` (${w.phonetic})` : ''}:`,
        direction: 'TARGET_VI',
        correctAnswer: letters[correctIndex],
        acceptedAnswers,
        options,
        correctOptionIndex: correctIndex,
        explanation: `${w.word}${w.phonetic ? ` [${w.phonetic}]` : ''} (${w.partOfSpeech || 'từ vựng'}): ${w.meaning}${w.example ? ` | Ví dụ: ${w.example}` : ''}`,
        difficulty: 3.0,
        category: 'Vocabulary',
        languageCode: languageId,
        questionType: qType,
        phonetic: w.phonetic || undefined,
        targetWord: w.word,
      };
    });
  }

  /**
   * 1. Vocabulary adapter (Supports Community Decks, System Decks & Language Fallback)
   */
  private async fetchFromVocabulary(
    deckId: string | null | undefined,
    count: number,
    languageId: string,
    gameMode: GameModeType = GameModeType.TRANSLATION_RUSH,
    ownerId?: string,
  ): Promise<GameQuestionPayload[]> {
    if (deckId?.startsWith('progress:')) {
      if (!ownerId) return [];
      const now = new Date();
      const filters: Record<string, Prisma.UserVocabularyWhereInput> = {
        learned: { firstLearnedAt: { not: null } },
        favorites: { isFavorite: true },
        flagged: { isHard: true },
        mistakes: { incorrectCount: { gt: 0 }, lastReviewedAt: { gte: new Date(now.getTime() - 30 * 86400000) } },
        weak: { repetitionCount: { gt: 0 }, masteryScore: { lt: 80 } },
        due: { nextReviewAt: { lte: now } },
      };
      const filter = filters[deckId.slice('progress:'.length)];
      if (!filter) return [];
      const progress = await this.prisma.userVocabulary.findMany({
        where: { ...filter, userId: ownerId, vocabulary: { languageId } },
        orderBy: [{ nextReviewAt: 'asc' }, { lastReviewedAt: 'desc' }],
        take: count,
        include: { vocabulary: { include: { meanings: { take: 1 } } } },
      });
      return this.buildMultipleChoiceFromWordList(progress.map(({ vocabulary }) => ({
        id: vocabulary.id,
        word: vocabulary.word,
        meaning: vocabulary.meanings[0]?.meaning || vocabulary.shortDefinition || vocabulary.definition,
        phonetic: vocabulary.phonetic || vocabulary.pronunciation,
        partOfSpeech: vocabulary.partOfSpeech,
      })), languageId, gameMode);
    }

    if (deckId) {
      const cleanDeckId = String(deckId).replace(/^cloned_/, '');
      const communityDeck = await this.prisma.communityDeck.findUnique({
        where: { id: cleanDeckId },
        include: { words: true },
      });

      if (communityDeck) {
        const publicDeck = communityDeck.isPublic && !communityDeck.isProtected &&
          (communityDeck.status === 'APPROVED' || communityDeck.isOfficial);
        if (communityDeck.languageId !== languageId || (communityDeck.userId !== ownerId && !publicDeck)) return [];
        const words = [...communityDeck.words].sort(() => 0.5 - Math.random()).slice(0, count);
        return this.buildMultipleChoiceFromWordList(
          words.map((w) => ({
            id: w.id,
            word: w.word,
            meaning: w.meaning,
            phonetic: w.phonetic,
            partOfSpeech: w.partOfSpeech,
            example: w.example,
          })),
          languageId,
          gameMode,
        );
      }
    }

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
      take: count * 3,
      include: {
        meanings: { take: 1 },
      },
    });

    if (vocabs.length) {
      const shuffled = vocabs.sort(() => 0.5 - Math.random()).slice(0, count);
      return this.buildMultipleChoiceFromWordList(
        shuffled.map((v) => ({
          id: v.id,
          word: v.word,
          meaning: v.meanings?.[0]?.meaning || v.shortDefinition || v.definition || v.word,
          phonetic: v.phonetic || v.pronunciation,
          partOfSpeech: v.partOfSpeech,
          example: null,
        })),
        languageId,
        gameMode,
      );
    }

    // When DB doesn't have sufficient words for this specific language, fetch from Multilingual Bank
    return [];
  }

  /**
   * 2. Question Bank (ExamQuestion) adapter
   */
  private async fetchFromExamBank(
    examId: string | null | undefined,
    count: number,
    languageId: string = 'en',
    gameMode: GameModeType = GameModeType.TRANSLATION_RUSH,
    ownerId?: string,
  ): Promise<GameQuestionPayload[]> {
    if (examId) {
      const examQuestions = await this.prisma.examQuestion.findMany({
        where: {
          examId,
          exam: {
            languageId,
            OR: [
              ...(ownerId ? [{ authorId: ownerId }] : []),
              { status: 'PUBLISHED', moderationStatus: 'APPROVED', isProtected: false },
            ],
          },
        },
        take: count,
        include: { options: true },
      });

      if (examQuestions.length > 0) {
        return examQuestions.map((q) => {
          const sortedOptions = (q.options || []).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
          const correctKey = Array.isArray(q.correctAnswer)
            ? String(q.correctAnswer[0] || 'A').toUpperCase().trim()
            : String(q.correctAnswer || 'A').toUpperCase().trim();
          const correctIdx = sortedOptions.findIndex((o) => o.key.toUpperCase().trim() === correctKey);
          const correctOpt = sortedOptions[correctIdx >= 0 ? correctIdx : 0];
          const letters = ['A', 'B', 'C', 'D'];
          const letterAnswer = correctOpt ? correctOpt.key.toUpperCase() : 'A';

          return {
            id: q.id,
            prompt: q.questionText,
            direction: 'EN_VI',
            correctAnswer: letterAnswer,
            acceptedAnswers: [letterAnswer, letterAnswer.toLowerCase(), correctOpt?.text?.toLowerCase().trim() || ''],
            options: sortedOptions.map((o) => `${o.key.toUpperCase()}. ${o.text}`),
            correctOptionIndex: correctIdx >= 0 ? correctIdx : 0,
            explanation: q.explanation || undefined,
            difficulty: 3.0,
            category: 'Exam Bank',
            audioUrl: q.audioUrl || undefined,
            languageCode: languageId,
            questionType: mapGameModeToQuestionType(gameMode),
          };
        });
      }
    }

    return [];
  }

  /**
   * 3. Grammar Exercises adapter
   */
  private async fetchFromGrammarExercises(
    categoryId: string | null | undefined,
    count: number,
    languageId: string = 'en',
    gameMode: GameModeType = GameModeType.TRANSLATION_RUSH,
  ): Promise<GameQuestionPayload[]> {
    const whereClause: any = categoryId ? { categoryId } : {};
    const exercises = await this.prisma.grammarExercise.findMany({
      where: whereClause,
      take: count,
    });

    if (exercises.length === 0) {
      return [];
    }

    return exercises.map((ex) => {
      const optionsArray = Array.isArray(ex.options) ? (ex.options as string[]) : [];
      const correctIdx = optionsArray.findIndex((o) => o.toLowerCase().trim() === ex.correctAnswer.toLowerCase().trim());
      const letters = ['A', 'B', 'C', 'D'];
      const letterAnswer = correctIdx >= 0 && correctIdx < 4 ? letters[correctIdx] : 'A';

      return {
        id: ex.id,
        prompt: ex.questionText,
        direction: 'GRAMMAR_PRACTICE',
        correctAnswer: letterAnswer,
        acceptedAnswers: [letterAnswer, letterAnswer.toLowerCase(), ex.correctAnswer.toLowerCase().trim()],
        options: optionsArray.map((o, idx) => `${letters[idx] || '?'}. ${o}`),
        correctOptionIndex: correctIdx >= 0 ? correctIdx : 0,
        explanation: ex.explanation || undefined,
        difficulty: ex.difficulty || 3.0,
        category: 'Grammar',
        languageCode: languageId,
        questionType: 'MISSING_WORD',
      };
    });
  }

  /**
   * 4. Knowledge Base adapter
   */
  private async fetchFromKnowledgeBase(
    resourceId: string | null | undefined,
    count: number,
    languageId: string = 'en',
    gameMode: GameModeType = GameModeType.TRANSLATION_RUSH,
  ): Promise<GameQuestionPayload[]> {
    const whereClause: any = { ...(resourceId ? { id: resourceId } : {}), status: 'PUBLISHED', language: languageId, isPremium: false };
    const resources = await this.prisma.learningResource.findMany({
      where: whereClause,
      take: count,
    });

    if (resources.length === 0) {
      return [];
    }

    const allTitles = resources.map((r) => r.title);
    return resources.map((r) => {
      const letters = ['A', 'B', 'C', 'D'];
      const otherTitles = allTitles.filter((t) => t !== r.title);
      const distractors = otherTitles.sort(() => 0.5 - Math.random()).slice(0, 3);
      const fallbackThemes = ['Ngữ pháp ứng dụng', 'Phản xạ giao tiếp', 'Từ vựng cốt lõi', 'Phát âm chuẩn'];
      for (const ft of fallbackThemes) {
        if (distractors.length >= 3) break;
        if (!distractors.includes(ft) && ft !== r.title) {
          distractors.push(ft);
        }
      }
      const correctIdx = Math.floor(Math.random() * 4);
      const optionsText: string[] = [];
      let dI = 0;
      for (let i = 0; i < 4; i++) {
        if (i === correctIdx) {
          optionsText.push(r.title);
        } else {
          optionsText.push(distractors[dI++] || `Khái niệm ${letters[i]}`);
        }
      }
      return {
        id: r.id,
        prompt: `Khái niệm hoặc chủ đề nào tương ứng với: "${r.description || r.title}"?`,
        direction: 'KNOWLEDGE_CONCEPT',
        correctAnswer: letters[correctIdx],
        acceptedAnswers: [letters[correctIdx], letters[correctIdx].toLowerCase(), r.title.toLowerCase().trim()],
        options: optionsText.map((t, i) => `${letters[i]}. ${t}`),
        correctOptionIndex: correctIdx,
        explanation: r.description || undefined,
        difficulty: 3.0,
        category: r.category || 'Knowledge',
        languageCode: languageId,
        questionType: 'WORD_RECOGNITION',
      };
    });
  }

  /**
   * 5. Preset fallback adapter with strict language matching
   * Never falls back to English when user is studying Japanese, Korean, Chinese, Thai, Vietnamese, etc.!
   */
  private async fetchFromSystemPreset(
    gameMode: GameModeType,
    count: number,
    languageId: string = 'en',
  ): Promise<GameQuestionPayload[]> {
    const normalizedLang = (languageId || 'en').toLowerCase().trim();
    const qType = mapGameModeToQuestionType(gameMode);

    // 1. Check Multilingual Vocabulary Bank first for target language
    const langItems = MULTILINGUAL_VOCABULARY_BANK[normalizedLang];
    if (langItems && langItems.length > 0) {
      this.logger.log(`Using Multilingual Bank for [${normalizedLang}], total available items: ${langItems.length}`);
      const selected: any[] = [];
      while (selected.length < count) {
        const pool = [...langItems].sort(() => 0.5 - Math.random());
        for (const item of pool) {
          selected.push(item);
          if (selected.length >= count) break;
        }
      }
      return selected.map((item, idx) => {
        const q = buildMultipleChoiceQuestion(item, qType);
        if (idx >= langItems.length) {
          q.id = `${q.id}-r${idx}`;
        }
        return q;
      });
    }

    // 2. If language has no direct bank, check DB GameQuestion if en
    if (normalizedLang === 'en') {
      const dbQuestions = await this.prisma.gameQuestion.findMany({
        where: {
          gameMode,
          status: 'PUBLISHED',
        },
        take: count * 2,
      });

      if (dbQuestions.length > 0) {
        const letters = ['A', 'B', 'C', 'D'];
        const allCorrect = dbQuestions.map((dq) => dq.correctAnswer).filter(Boolean);
        const enSeedWords = (MULTILINGUAL_VOCABULARY_BANK['en'] || []).map((s) => s.targetWord);

        return dbQuestions.slice(0, count).map((q) => {
          const accepted = q.acceptedAnswers || [];
          let options: string[] = [];
          let correctIdx = 0;

          if (accepted.length >= 4) {
            options = accepted.slice(0, 4).map((a, i) => `${letters[i]}. ${a}`);
            correctIdx = 0;
          } else {
            const pool = allCorrect.filter((c) => c !== q.correctAnswer).sort(() => 0.5 - Math.random());
            const distractors = pool.slice(0, 3);
            for (const sw of enSeedWords) {
              if (distractors.length >= 3) break;
              if (sw !== q.correctAnswer && !distractors.includes(sw)) {
                distractors.push(sw);
              }
            }
            correctIdx = Math.floor(Math.random() * 4);
            const opts: string[] = [];
            let p = 0;
            for (let i = 0; i < 4; i++) {
              if (i === correctIdx) {
                opts.push(q.correctAnswer);
              } else {
                opts.push(distractors[p++] || `Lựa chọn ${letters[i]}`);
              }
            }
            options = opts.map((opt, i) => `${letters[i]}. ${opt}`);
          }

          return {
            id: q.id,
            prompt: q.prompt,
            direction: q.direction,
            correctAnswer: letters[correctIdx],
            acceptedAnswers: [letters[correctIdx], letters[correctIdx].toLowerCase(), q.correctAnswer.toLowerCase().trim(), ...accepted],
            options,
            correctOptionIndex: correctIdx,
            explanation: q.explanation || undefined,
            difficulty: q.difficulty || 3.0,
            category: q.category || 'General',
            audioUrl: q.audioUrl || undefined,
            languageCode: normalizedLang,
            questionType: qType,
          };
        });
      }

      const enItems = MULTILINGUAL_VOCABULARY_BANK['en'];
      if (enItems && enItems.length > 0) {
        return enItems.slice(0, count).map((item) => buildMultipleChoiceQuestion(item, qType));
      }
    }

    // 3. Guaranteed multi-language generation to avoid empty room
    const fallbackBank = MULTILINGUAL_VOCABULARY_BANK[normalizedLang] || MULTILINGUAL_VOCABULARY_BANK['ja'];
    return fallbackBank.slice(0, count).map((item) => buildMultipleChoiceQuestion(item, qType));
  }
}
