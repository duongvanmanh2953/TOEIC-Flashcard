import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CefrLevel } from '@prisma/client';

export interface GenerateQuizDto {
  title?: string;
  questionCount?: number; // 5, 10, 20
  sourceFilter: 'FAVORITES' | 'WEAK_WORDS' | 'CEFR' | 'DECK';
  cefrLevel?: CefrLevel;
  deckId?: string;
}

@Injectable()
export class QuizzesService {
  constructor(private prisma: PrismaService) {}

  async generateQuiz(userId: string, dto: GenerateQuizDto) {
    const limit = dto.questionCount || 10;
    let targetVocabIds: string[] = [];

    if (dto.sourceFilter === 'FAVORITES') {
      const favs = await this.prisma.userVocabulary.findMany({
        where: { userId, isFavorite: true },
        select: { vocabularyId: true },
        take: limit,
      });
      targetVocabIds = favs.map((f) => f.vocabularyId);
    } else if (dto.sourceFilter === 'WEAK_WORDS') {
      const weak = await this.prisma.userVocabulary.findMany({
        where: { userId, OR: [{ masteryScore: { lt: 50 } }, { isHard: true }] },
        select: { vocabularyId: true },
        take: limit,
        orderBy: { masteryScore: 'asc' },
      });
      targetVocabIds = weak.map((w) => w.vocabularyId);
    } else if (dto.sourceFilter === 'CEFR') {
      const cefrVocabs = await this.prisma.vocabulary.findMany({
        where: dto.cefrLevel ? { cefrLevel: dto.cefrLevel } : {},
        select: { id: true },
        take: limit,
      });
      targetVocabIds = cefrVocabs.map((v) => v.id);
    } else if (dto.sourceFilter === 'DECK' && dto.deckId) {
      const deck = await this.prisma.communityDeck.findUnique({
        where: { id: dto.deckId },
        include: { words: true },
      });
      if (deck && deck.words.length > 0) {
        const words = await this.prisma.vocabulary.findMany({
          where: { word: { in: deck.words.map((w) => w.word.toLowerCase()) } },
          select: { id: true },
          take: limit,
        });
        targetVocabIds = words.map((w) => w.id);

        // If targetVocabIds has fewer words than needed, generate questions directly from deck.words
        if (targetVocabIds.length === 0 && deck.words.length > 0) {
          const distractors = await this.prisma.vocabulary.findMany({
            take: 30,
            select: { word: true, shortDefinition: true },
          });

          const selectedWords = deck.words.slice(0, limit);
          const questions = selectedWords.map((cw, index) => {
            const meaning = cw.meaning || cw.definition || cw.word;
            const otherOptions = distractors
              .filter((d) => d.word.toLowerCase() !== cw.word.toLowerCase())
              .slice(0, 3)
              .map((d) => d.shortDefinition || d.word);
            const options = [meaning, ...otherOptions].sort(() => Math.random() - 0.5);

            const isFillBlank = index % 2 === 1 && Boolean(cw.example);
            let prompt = `Nghĩa chính xác của từ "${cw.word}" là gì?`;
            let sentenceContext: string | null = null;

            if (isFillBlank && cw.example) {
              const regex = new RegExp(`\\b${cw.word}\\b`, 'gi');
              sentenceContext = cw.example.replace(regex, '______');
              prompt = `Chọn từ thích hợp điền vào chỗ trống: "${sentenceContext}"`;
            }

            return {
              id: `q-${index + 1}`,
              vocabularyId: cw.id,
              word: cw.word,
              prompt,
              phonetic: cw.phonetic || '',
              sentenceContext,
              options: isFillBlank
                ? [cw.word, ...distractors.slice(0, 3).map((d) => d.word)].sort(() => Math.random() - 0.5)
                : options,
              correctAnswer: isFillBlank ? cw.word : meaning,
              explanation: cw.exampleTranslation || cw.definition || meaning,
            };
          });

          const quiz = await this.prisma.customQuiz.create({
            data: {
              userId,
              title: dto.title || `Custom Quiz: ${deck.title} (${questions.length} câu)`,
              sourceFilter: dto.sourceFilter,
              questionCount: questions.length,
              questions: questions as any,
            },
          });

          return {
            quizId: quiz.id,
            title: quiz.title,
            questionCount: questions.length,
            questions,
          };
        }
      }
    }

    // Fallback: If not enough target words, fetch from CEFR or general vocabulary
    const remaining = limit - targetVocabIds.length;
    if (remaining > 0) {
      const extra = await this.prisma.vocabulary.findMany({
        where: {
          id: { notIn: targetVocabIds },
          ...(dto.cefrLevel ? { cefrLevel: dto.cefrLevel } : {}),
        },
        select: { id: true },
        take: remaining,
      });
      targetVocabIds.push(...extra.map((e) => e.id));
    }

    const vocabs = await this.prisma.vocabulary.findMany({
      where: { id: { in: targetVocabIds } },
      include: { meanings: true, examples: true },
    });

    if (vocabs.length === 0) {
      throw new BadRequestException('Không tìm thấy từ vựng phù hợp với tiêu chí đã chọn để tạo bài thi.');
    }

    const distractors = await this.prisma.vocabulary.findMany({
      take: 30,
      select: { word: true, shortDefinition: true },
    });

    const questions = vocabs.map((vocab, index) => {
      const meaning = vocab.meanings[0]?.meaning || vocab.shortDefinition || vocab.definition;
      const otherOptions = distractors
        .filter((d) => d.word.toLowerCase() !== vocab.word.toLowerCase())
        .slice(0, 3)
        .map((d) => d.shortDefinition || d.word);
      const options = [meaning, ...otherOptions].sort(() => Math.random() - 0.5);

      const isFillBlank = index % 2 === 1 && vocab.examples[0]?.sentence;
      let prompt = `Nghĩa chính xác của từ "${vocab.word}" là gì?`;
      let sentenceContext = null;

      if (isFillBlank) {
        const regex = new RegExp(`\\b${vocab.word}\\b`, 'gi');
        sentenceContext = vocab.examples[0].sentence.replace(regex, '______');
        prompt = `Chọn từ thích hợp điền vào chỗ trống: "${sentenceContext}"`;
      }

      return {
        id: `q-${index + 1}`,
        vocabularyId: vocab.id,
        word: vocab.word,
        prompt,
        phonetic: vocab.phonetic || vocab.pronunciation,
        sentenceContext,
        options: isFillBlank
          ? [vocab.word, ...distractors.slice(0, 3).map((d) => d.word)].sort(() => Math.random() - 0.5)
          : options,
        correctAnswer: isFillBlank ? vocab.word : meaning,
        explanation: vocab.examples[0]?.translation || vocab.definition,
      };
    });

    const quiz = await this.prisma.customQuiz.create({
      data: {
        userId,
        title: dto.title || `Custom Quiz: ${dto.sourceFilter} (${questions.length} câu)`,
        sourceFilter: dto.sourceFilter,
        questionCount: questions.length,
        questions: questions as any,
      },
    });

    return {
      quizId: quiz.id,
      title: quiz.title,
      questionCount: questions.length,
      questions,
    };
  }

  async submitQuiz(quizId: string, userId: string, answers: Record<string, string>, responseTimeMs: number) {
    const quiz = await this.prisma.customQuiz.findUnique({ where: { id: quizId } });
    if (!quiz || quiz.userId !== userId) {
      throw new NotFoundException('Quiz not found');
    }

    const questions = quiz.questions as any[];
    let correctCount = 0;

    for (const q of questions) {
      const userAns = (answers[q.id] || '').trim().toLowerCase();
      const correctAns = (q.correctAnswer || '').trim().toLowerCase();
      if (userAns === correctAns || (correctAns.includes(userAns) && userAns.length > 2)) {
        correctCount++;
      }
    }

    const accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    const score = correctCount * 10;

    const attempt = await this.prisma.customQuizAttempt.create({
      data: {
        quizId,
        userId,
        score,
        accuracy,
        responseTimeMs: responseTimeMs || 30000,
        answers: answers as any,
      },
    });

    // Award XP
    await this.prisma.userXP.upsert({
      where: { userId },
      update: { totalXP: { increment: score } },
      create: { userId, totalXP: score },
    });

    return {
      attemptId: attempt.id,
      accuracy,
      correctCount,
      totalCount: questions.length,
      xpEarned: score,
    };
  }
}
