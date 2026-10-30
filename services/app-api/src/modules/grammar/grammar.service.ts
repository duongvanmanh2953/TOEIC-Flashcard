import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ENGLISH_GRAMMAR_CURRICULUM } from './english-curriculum.data';


export interface SubmitExerciseDto {
  exerciseId: string;
  userAnswer: string;
  responseTimeMs?: number;
}

@Injectable()
export class GrammarService {
  private readonly logger = new Logger(GrammarService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Seed default grammar topics if none exist in DB
   */
  async seedDefaultGrammarIfNeeded() {
    const count = await this.prisma.grammarCategory.count();
    if (count > 0) return;

    this.logger.log('Seeding initial comprehensive grammar categories and topics...');

    // 1. Tenses
    const tenses = await this.prisma.grammarCategory.create({
      data: {
        code: 'TENSES',
        title: 'English Tenses & Aspects',
        titleVi: 'Hệ Thống 12 Thì Trong Tiếng Anh',
        description: 'Nắm vững cấu trúc, cách dùng, dấu hiệu nhận biết và các bẫy thường gặp trong đề thi TOEIC.',
        languageId: 'en',
        orderIndex: 1,
        topics: {
          create: [
            {
              title: 'Present Simple Tense',
              titleVi: 'Thì Hiện Tại Đơn',
              summary: 'Diễn tả chân lý, thói quen, lịch trình cố định và các sự thật hiển nhiên.',
              cefrLevel: 'A1',
              orderIndex: 1,
              rules: {
                create: [
                  {
                    title: 'Cấu trúc Khẳng định, Phủ định & Nghi vấn',
                    explanationMd: 'Thì hiện tại đơn với động từ thường và động từ to be. Chú ý thêm -s/-es với chủ ngữ ngôi thứ 3 số ít (he, she, it).',
                    structuresJson: [
                      'Khẳng định: S + V(s/es) + O',
                      'Phủ định: S + do/does not + V-bare + O',
                      'Nghi vấn: Do/Does + S + V-bare + O?',
                    ],
                    commonMistakes: [
                      'Quên thêm -s/-es khi chủ ngữ là danh từ số ít hoặc đại từ bất định (everyone, nobody).',
                      'Nhầm lẫn giữa "does not have" và "has not".',
                    ],
                    examples: {
                      create: [
                        {
                          sentence: 'The marketing manager reviews the quarterly sales report every Monday.',
                          translation: 'Trưởng phòng marketing duyệt báo cáo doanh số hàng quý vào mỗi thứ Hai.',
                          breakdownMd: '**The marketing manager** (S) + **reviews** (V-s) + **the quarterly sales report** (O)',
                        },
                        {
                          sentence: 'The train to Hanoi departs at 06:30 tomorrow morning.',
                          translation: 'Chuyến tàu đi Hà Nội khởi hành lúc 06:30 sáng mai (lịch trình cố định).',
                          breakdownMd: '**The train** (S) + **departs** (V-s) + **at 06:30** (Thời gian)',
                        },
                      ],
                    },
                  },
                ],
              },
              exercises: {
                create: [
                  {
                    questionText: 'Ms. Clara usually ______ all client inquiries before leaving the office.',
                    questionType: 'MULTIPLE_CHOICE',
                    options: ['answers', 'answered', 'answering', 'answer'],
                    correctAnswer: 'answers',
                    acceptedAnswers: ['answers'],
                    explanation: 'Dấu hiệu "usually" kết hợp chủ ngữ số ít "Ms. Clara" yêu cầu động từ thì hiện tại đơn thêm -s (answers).',
                    difficulty: 2.0,
                  },
                  {
                    questionText: 'The flight from Tokyo ______ at Terminal 2 every weekday at 14:00.',
                    questionType: 'FILL_IN_BLANK',
                    correctAnswer: 'arrives',
                    acceptedAnswers: ['arrives'],
                    explanation: 'Lịch trình tàu bay cố định chia hiện tại đơn: The flight (số ít) -> arrives.',
                    difficulty: 2.2,
                  },
                ],
              },
            },
            {
              title: 'Present Perfect Tense',
              titleVi: 'Thì Hiện Tại Hoàn Thành',
              summary: 'Diễn tả hành động xảy ra trong quá khứ kéo dài đến hiện tại, hoặc vừa mới hoàn thành có kết quả ở hiện tại.',
              cefrLevel: 'B1',
              orderIndex: 2,
              rules: {
                create: [
                  {
                    title: 'Công thức và Dấu hiệu Nhận biết (Since, For, Already, Yet)',
                    explanationMd: 'Sử dụng have/has + V3/ed. Dấu hiệu đặc trưng: since + mốc thời gian, for + khoảng thời gian, just, already, yet, so far, recently.',
                    structuresJson: [
                      'Khẳng định: S + have/has + V3/ed + O',
                      'Phủ định: S + have/has not + V3/ed + O',
                      'Nghi vấn: Have/Has + S + V3/ed + O?',
                    ],
                    commonMistakes: [
                      'Dùng thì quá khứ đơn khi có cụm "since + mốc thời gian".',
                      'Nhầm lẫn vị trí của "yet" (cuối câu phủ định/nghi vấn) và "already" (giữa trợ động từ và V3).',
                    ],
                    examples: {
                      create: [
                        {
                          sentence: 'We have collaborated with over 50 international partners since 2020.',
                          translation: 'Chúng tôi đã hợp tác với hơn 50 đối tác quốc tế kể từ năm 2020.',
                          breakdownMd: '**We** (S) + **have collaborated** (V3) + **since 2020** (Mốc thời gian)',
                        },
                      ],
                    },
                  },
                ],
              },
              exercises: {
                create: [
                  {
                    questionText: 'The engineering team ______ the software update three times this month.',
                    questionType: 'MULTIPLE_CHOICE',
                    options: ['has released', 'released', 'is releasing', 'release'],
                    correctAnswer: 'has released',
                    acceptedAnswers: ['has released'],
                    explanation: 'Dấu hiệu "three times this month" (số lần lặp lại tính đến nay) yêu cầu thì hiện tại hoàn thành: has released.',
                    difficulty: 2.8,
                  },
                ],
              },
            },
          ],
        },
      },
    });

    // 2. Passive Voice
    await this.prisma.grammarCategory.create({
      data: {
        code: 'PASSIVE_VOICE',
        title: 'Passive Voice Mastery',
        titleVi: 'Câu Bị Động & Thể Sai Khiến',
        description: 'Chuyên sâu cấu trúc bị động các thì, bị động với động từ khuyết thiếu và cấu trúc bị động đặc biệt trong bài thi TOEIC Part 5 & 6.',
        languageId: 'en',
        orderIndex: 2,
        topics: {
          create: [
            {
              title: 'Standard Passive Voice',
              titleVi: 'Câu Bị Động Cơ Bản & Nâng Cao',
              summary: 'Nhấn mạnh vào đối tượng chịu tác động của hành động thay vì người thực hiện hành động.',
              cefrLevel: 'B1',
              orderIndex: 1,
              rules: {
                create: [
                  {
                    title: 'Quy tắc chuyển đổi Chủ động -> Bị động: be + V3/ed',
                    explanationMd: 'Tân ngữ của câu chủ động trở thành chủ ngữ của câu bị động. Động từ "be" chia theo thì của câu gốc, động từ chính chuyển về V3/ed.',
                    structuresJson: [
                      'Hiện tại đơn: S + am/is/are + V3/ed (+ by O)',
                      'Hiện tại hoàn thành: S + have/has been + V3/ed (+ by O)',
                      'Modal verbs: S + modal + be + V3/ed',
                    ],
                    commonMistakes: [
                      'Ngoại động từ (transitive) mới có dạng bị động; nội động từ (happen, occur, arrive) KHÔNG chia bị động.',
                    ],
                    examples: {
                      create: [
                        {
                          sentence: 'All confidential documents must be shredded before disposal.',
                          translation: 'Mọi tài liệu mật phải được hủy vụn trước khi tiêu hủy.',
                          breakdownMd: '**All confidential documents** (S) + **must be shredded** (Modal Passive)',
                        },
                      ],
                    },
                  },
                ],
              },
              exercises: {
                create: [
                  {
                    questionText: 'The annual financial budget ______ by the board of directors tomorrow.',
                    questionType: 'MULTIPLE_CHOICE',
                    options: ['will be approved', 'will approve', 'is approved', 'has approved'],
                    correctAnswer: 'will be approved',
                    acceptedAnswers: ['will be approved'],
                    explanation: 'Chủ ngữ "The budget" không thể tự phê duyệt mà phải được phê duyệt bởi hội đồng (bị động thì tương lai: will be approved).',
                    difficulty: 2.6,
                  },
                ],
              },
            },
          ],
        },
      },
    });

    // Comprehensive English Grammar Curriculum (A1 - C2)
    for (const cat of ENGLISH_GRAMMAR_CURRICULUM) {
      const existing = await this.prisma.grammarCategory.findUnique({
        where: { code: cat.code },
      });
      if (existing) continue;

      await this.prisma.grammarCategory.create({
        data: {
          code: cat.code,
          title: cat.title,
          titleVi: cat.titleVi,
          description: cat.description,
          languageId: cat.languageId,
          orderIndex: cat.orderIndex,
          topics: {
            create: cat.topics.map((t) => ({
              title: t.title,
              titleVi: t.titleVi,
              summary: t.summary,
              cefrLevel: t.cefrLevel,
              orderIndex: t.orderIndex,
              rules: {
                create: t.rules.map((r) => ({
                  title: r.title,
                  explanationMd: r.explanationMd,
                  structuresJson: r.structuresJson,
                  commonMistakes: r.commonMistakes,
                  examples: {
                    create: r.examples,
                  },
                })),
              },
              exercises: {
                create: t.exercises.map((ex) => ({
                  questionText: ex.questionText,
                  questionType: ex.questionType as any,
                  options: ex.options,
                  correctAnswer: ex.correctAnswer,
                  acceptedAnswers: ex.acceptedAnswers,
                  explanation: ex.explanation,
                  difficulty: ex.difficulty,
                })),
              },
            })),
          },
        },
      });
    }

    this.logger.log('Initial comprehensive English grammar seeding complete!');
  }


  /**
   * Get all categories with topics and user progress
   */
  async getCategories(userId?: string, languageId = 'en') {
    await this.seedDefaultGrammarIfNeeded();

    const categories = await this.prisma.grammarCategory.findMany({
      where: { languageId },
      orderBy: { orderIndex: 'asc' },
      include: {
        topics: {
          orderBy: { orderIndex: 'asc' },
          include: {
            rules: {
              select: { id: true, title: true },
            },
            exercises: {
              select: { id: true },
            },
            progress: userId
              ? {
                  where: { userId },
                  select: {
                    masteryScore: true,
                    attemptCount: true,
                    correctCount: true,
                    lastStudiedAt: true,
                    nextReviewAt: true,
                  },
                }
              : false,
          },
        },
      },
    });

    return categories.map((cat) => ({
      ...cat,
      topics: cat.topics.map((top) => {
        const userProg = top.progress?.[0];
        return {
          id: top.id,
          title: top.title,
          titleVi: top.titleVi,
          summary: top.summary,
          cefrLevel: top.cefrLevel,
          orderIndex: top.orderIndex,
          ruleCount: top.rules.length,
          exerciseCount: top.exercises.length,
          masteryScore: userProg ? userProg.masteryScore : 0,
          attemptCount: userProg ? userProg.attemptCount : 0,
          lastStudiedAt: userProg ? userProg.lastStudiedAt : null,
          nextReviewAt: userProg ? userProg.nextReviewAt : null,
        };
      }),
    }));
  }

  /**
   * Get single topic details with rules, breakdown, examples, and exercises
   */
  async getTopicDetail(topicId: string, userId?: string) {
    const topic = await this.prisma.grammarTopic.findUnique({
      where: { id: topicId },
      include: {
        category: true,
        rules: {
          orderBy: { orderIndex: 'asc' },
          include: {
            examples: true,
          },
        },
        exercises: true,
        progress: userId
          ? {
              where: { userId },
            }
          : false,
      },
    });

    if (!topic) {
      throw new NotFoundException(`Chủ đề ngữ pháp #${topicId} không tồn tại.`);
    }

    const userProg = topic.progress?.[0] || null;

    return {
      id: topic.id,
      title: topic.title,
      titleVi: topic.titleVi,
      summary: topic.summary,
      cefrLevel: topic.cefrLevel,
      category: topic.category,
      rules: topic.rules,
      exercises: topic.exercises.map((ex) => ({
        id: ex.id,
        questionText: ex.questionText,
        questionType: ex.questionType,
        options: ex.options,
        difficulty: ex.difficulty,
      })),
      userProgress: userProg
        ? {
            masteryScore: userProg.masteryScore,
            attemptCount: userProg.attemptCount,
            correctCount: userProg.correctCount,
            lastStudiedAt: userProg.lastStudiedAt,
            nextReviewAt: userProg.nextReviewAt,
            stability: userProg.stability,
          }
        : null,
    };
  }

  /**
   * Submit grammar exercise answers and update SRS progress
   */
  async submitExercise(userId: string, topicId: string, submissions: SubmitExerciseDto[]) {
    const topic = await this.prisma.grammarTopic.findUnique({
      where: { id: topicId },
      include: { exercises: true },
    });

    if (!topic) {
      throw new NotFoundException(`Chủ đề ngữ pháp #${topicId} không tồn tại.`);
    }

    let correctCount = 0;
    const results = submissions.map((sub) => {
      const exercise = topic.exercises.find((e) => e.id === sub.exerciseId);
      if (!exercise) {
        return {
          exerciseId: sub.exerciseId,
          isCorrect: false,
          userAnswer: sub.userAnswer,
          correctAnswer: '',
          explanation: '',
        };
      }

      const cleanUser = sub.userAnswer.trim().toLowerCase();
      const cleanCorrect = exercise.correctAnswer.trim().toLowerCase();
      const isAccepted =
        cleanUser === cleanCorrect ||
        exercise.acceptedAnswers.map((a) => a.trim().toLowerCase()).includes(cleanUser);

      if (isAccepted) correctCount++;

      return {
        exerciseId: sub.exerciseId,
        isCorrect: isAccepted,
        userAnswer: sub.userAnswer,
        correctAnswer: exercise.correctAnswer,
        explanation: exercise.explanation,
      };
    });

    const total = submissions.length;
    const accuracy = total > 0 ? (correctCount / total) * 100 : 0;

    // Calculate FSRS Spaced Repetition interval
    // If accuracy >= 80%, interval doubles; if < 50%, resets
    const existingProgress = await this.prisma.userGrammarProgress.findUnique({
      where: {
        userId_topicId: { userId, topicId },
      },
    });

    let currentMastery = existingProgress ? existingProgress.masteryScore : 0;
    let stability = existingProgress ? existingProgress.stability : 1.0;

    if (accuracy >= 80) {
      currentMastery = Math.min(100, currentMastery + 20);
      stability = stability * 2.2;
    } else if (accuracy >= 50) {
      currentMastery = Math.min(100, currentMastery + 10);
      stability = Math.max(1.0, stability * 1.2);
    } else {
      currentMastery = Math.max(0, currentMastery - 15);
      stability = 1.0;
    }

    const nextReviewDays = Math.max(1, Math.round(stability));
    const nextReviewAt = new Date(Date.now() + nextReviewDays * 24 * 60 * 60 * 1000);

    const progress = await this.prisma.userGrammarProgress.upsert({
      where: {
        userId_topicId: { userId, topicId },
      },
      create: {
        userId,
        topicId,
        masteryScore: currentMastery,
        attemptCount: total,
        correctCount,
        lastStudiedAt: new Date(),
        nextReviewAt,
        stability,
      },
      update: {
        masteryScore: currentMastery,
        attemptCount: { increment: total },
        correctCount: { increment: correctCount },
        lastStudiedAt: new Date(),
        nextReviewAt,
        stability,
      },
    });

    return {
      results,
      summary: {
        total,
        correctCount,
        accuracy: Math.round(accuracy),
        masteryScore: progress.masteryScore,
        nextReviewAt: progress.nextReviewAt,
      },
    };
  }
}
