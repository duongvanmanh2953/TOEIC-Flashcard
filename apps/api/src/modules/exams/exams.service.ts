import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisCacheService } from '../../common/cache/redis-cache.service';
import {
  CreateExamDto,
  UpdateExamDto,
  SubmitExamAttemptDto,
} from './dto/exam.dto';
import { ExamScoringService } from './exam-scoring.service';
import { ExamAnalyticsService } from './exam-analytics.service';
import { ExamStatus, ModerationStatus, QuestionType, GrantStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class ExamsService {
  constructor(
    private prisma: PrismaService,
    private cacheService: RedisCacheService,
    private scoringService: ExamScoringService,
    private analyticsService: ExamAnalyticsService,
  ) {}

  async getPublicExams(
    filters: {
      search?: string;
      examType?: string;
      languageId?: string;
      level?: string;
      section?: string;
      sortBy?: 'popular' | 'newest' | 'attempts' | 'likes';
    },
    userId?: string,
  ) {
    const where: any = {
      status: ExamStatus.PUBLISHED,
      moderationStatus: ModerationStatus.APPROVED,
    };

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { tags: { has: filters.search.trim().toLowerCase() } },
      ];
    }

    if (filters.examType) where.examType = filters.examType;
    if (filters.languageId) where.languageId = filters.languageId;
    if (filters.level) where.level = filters.level;
    if (filters.section) where.section = filters.section;

    let orderBy: any = [{ createdAt: 'desc' }];
    if (filters.sortBy === 'popular' || filters.sortBy === 'likes') {
      orderBy = [{ likeCount: 'desc' }, { attemptCount: 'desc' }];
    } else if (filters.sortBy === 'attempts') {
      orderBy = [{ attemptCount: 'desc' }, { createdAt: 'desc' }];
    }

    const exams = await this.prisma.exam.findMany({
      where,
      include: {
        author: { select: { id: true, displayName: true, avatar: true } },
        _count: { select: { questions: true, attempts: true, comments: true } },
      },
      orderBy,
    });

    const userLikes = userId
      ? await this.prisma.examLike.findMany({
          where: { userId, examId: { in: exams.map((e) => e.id) } },
          select: { examId: true },
        })
      : [];
    const userDislikes = userId
      ? await this.prisma.examDislike.findMany({
          where: { userId, examId: { in: exams.map((e) => e.id) } },
          select: { examId: true },
        })
      : [];
    const userSaved = userId
      ? await this.prisma.examSaved.findMany({
          where: { userId, examId: { in: exams.map((e) => e.id) } },
          select: { examId: true },
        })
      : [];

    const userExams = userId
      ? await this.prisma.exam.findMany({
          where: { authorId: userId },
          select: { id: true, tags: true },
        })
      : [];
    const userClonedSourceIds = new Set<string>();
    userExams.forEach((ue) => {
      (ue.tags || []).forEach((t) => {
        if (t.startsWith('source:')) {
          userClonedSourceIds.add(t.replace('source:', ''));
        }
      });
    });

    const likedSet = new Set(userLikes.map((l) => l.examId));
    const dislikedSet = new Set(userDislikes.map((d) => d.examId));
    const savedSet = new Set(userSaved.map((s) => s.examId));

    return exams.map(({ passwordHash, ...rest }) => ({
      ...rest,
      hasPassword: rest.isProtected,
      isOwner: userId ? rest.authorId === userId : false,
      isCloned: userClonedSourceIds.has(rest.id),
      userLiked: likedSet.has(rest.id),
      userDisliked: dislikedSet.has(rest.id),
      userSaved: savedSet.has(rest.id),
    }));
  }

  async getMyExams(userId: string) {
    const exams = await this.prisma.exam.findMany({
      where: { authorId: userId },
      include: {
        author: { select: { id: true, displayName: true, avatar: true } },
        _count: { select: { questions: true, attempts: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return exams.map(({ passwordHash, ...rest }) => {
      const sourceExamId = (rest.tags || []).find((t) => t.startsWith('source:'))?.replace('source:', '') || null;
      return {
        ...rest,
        hasPassword: rest.isProtected,
        isOwner: true,
        isCloned: Boolean(sourceExamId),
        sourceExamId,
      };
    });
  }

  async getSavedExams(userId: string) {
    const saved = await this.prisma.examSaved.findMany({
      where: { userId },
      include: {
        exam: {
          include: {
            author: { select: { id: true, displayName: true, avatar: true } },
            _count: { select: { questions: true, attempts: true, comments: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return saved.map((s) => {
      const { passwordHash, ...rest } = s.exam;
      return {
        ...rest,
        hasPassword: rest.isProtected,
        savedAt: s.createdAt,
        userSaved: true,
      };
    });
  }

  async getExamDetails(examId: string, userId?: string, password?: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        author: { select: { id: true, displayName: true, avatar: true } },
        questions: {
          orderBy: { questionNumber: 'asc' },
          include: {
            options: { orderBy: { displayOrder: 'asc' } },
          },
        },
        _count: { select: { attempts: true, comments: true, likes: true } },
      },
    });

    if (!exam) throw new NotFoundException('Bộ đề thi không tồn tại');

    const isAuthor = userId && exam.authorId === userId;
    let hasAccessGrant = false;

    if (userId && exam.isProtected && !isAuthor) {
      const grant = await this.prisma.bankAccessGrant.findFirst({
        where: {
          bankId: examId,
          userId,
          status: 'ACTIVE',
          revokedAt: null,
        },
      });
      if (grant && (!grant.expiresAt || grant.expiresAt > new Date())) {
        hasAccessGrant = true;
      }
    }

    if (exam.isProtected && !isAuthor && !hasAccessGrant) {
      if (!password?.trim()) {
        return {
          id: exam.id,
          title: exam.title,
          description: exam.description,
          examType: exam.examType,
          totalQuestions: exam.totalQuestions,
          durationMinutes: exam.durationMinutes,
          isProtected: true,
          hasPassword: true,
          author: exam.author,
          requiresPassword: true,
        };
      }

      const trimmed = password.trim();

      // Find the grant matching this tokenHash for this exam
      const tokenHash = crypto.createHash('sha256').update(trimmed).digest('hex');
      const keyGrant = await this.prisma.bankAccessGrant.findFirst({
        where: {
          bankId: examId,
          tokenHash,
          status: GrantStatus.ACTIVE,
          revokedAt: null,
        },
      });

      if (!keyGrant) {
        throw new ForbiddenException('Access Key không hợp lệ hoặc đã bị thu hồi. Mật khẩu của tác giả không được dùng để cấp quyền cho tài khoản khác.');
      }

      if (keyGrant.userId !== userId) {
        throw new ForbiddenException('ACCESS_KEY_NOT_ASSIGNED_TO_USER: Access Key này được cấp riêng cho người dùng khác, bạn không có quyền sử dụng mã này');
      }

      if (keyGrant.expiresAt && keyGrant.expiresAt < new Date()) {
        throw new ForbiddenException('Access Key này đã hết hạn sử dụng');
      }

      await this.prisma.bankAccessGrant.update({
        where: { id: keyGrant.id },
        data: { lastUsedAt: new Date() },
      });
      hasAccessGrant = true;
    }

    // Determine user reactions
    let userLiked = false;
    let userDisliked = false;
    let userSaved = false;

    let isCloned = false;
    if (userId) {
      const [l, d, s, c] = await Promise.all([
        this.prisma.examLike.findUnique({ where: { userId_examId: { userId, examId } } }),
        this.prisma.examDislike.findUnique({ where: { userId_examId: { userId, examId } } }),
        this.prisma.examSaved.findUnique({ where: { userId_examId: { userId, examId } } }),
        this.prisma.exam.findFirst({
          where: {
            authorId: userId,
            tags: { has: `source:${examId}` },
          },
          select: { id: true },
        }),
      ]);
      userLiked = Boolean(l);
      userDisliked = Boolean(d);
      userSaved = Boolean(s);
      isCloned = Boolean(c);
    }

    const { passwordHash, ...safeExam } = exam;

    // For test-taking security, hide correct answers unless requester is author
    const safeQuestions = safeExam.questions.map((q) => {
      if (isAuthor) return q;
      const { correctAnswer, acceptedAnswers, explanation, sourceExplanation, optionExplanations, ...pubQ } = q;
      return pubQ;
    });

    return {
      ...safeExam,
      questions: safeQuestions,
      hasPassword: exam.isProtected,
      isOwner: Boolean(userId && exam.authorId === userId),
      isCloned,
      userLiked,
      userDisliked,
      userSaved,
    };
  }

  async createExam(userId: string, dto: CreateExamDto) {
    let passwordHash: string | null = null;
    if (dto.isProtected && dto.password?.trim()) {
      passwordHash = await bcrypt.hash(dto.password.trim(), 10);
    }

    const questionsData = (dto.questions || []).map((q, idx) => ({
      questionNumber: q.questionNumber || idx + 1,
      questionText: q.questionText,
      questionHtml: q.questionHtml,
      imageUrl: q.imageUrl,
      audioUrl: q.audioUrl,
      questionType: q.questionType || QuestionType.MULTIPLE_CHOICE,
      correctAnswer: q.correctAnswer,
      acceptedAnswers: q.acceptedAnswers || [],
      explanation: q.explanation,
      sourceExplanation: q.sourceExplanation,
      optionExplanations: q.optionExplanations || null,
      grammarType: q.grammarType,
      partOfSpeech: q.partOfSpeech,
      difficulty: q.difficulty || 'MEDIUM',
      category: q.category || 'Grammar',
      skill: q.skill || 'Reading',
      points: q.points || 1.0,
      tags: q.tags || [],
      vocabularyIds: q.vocabularyIds || [],
      options: {
        create: (q.options || []).map((opt, oIdx) => ({
          key: opt.key || String.fromCharCode(65 + oIdx),
          text: opt.text,
          imageUrl: opt.imageUrl,
          displayOrder: opt.displayOrder ?? oIdx,
        })),
      },
    }));

    const totalQuestions = questionsData.length;
    const computedTotalScore = questionsData.reduce((acc, q) => acc + (q.points || 1.0), 0);

    const exam = await this.prisma.exam.create({
      data: {
        authorId: userId,
        title: dto.title.trim(),
        description: dto.description?.trim(),
        coverImage: dto.coverImage,
        languageId: dto.languageId || 'en',
        examType: dto.examType || 'TOEIC',
        section: dto.section || 'Full',
        level: dto.level || 'Intermediate',
        durationMinutes: dto.durationMinutes || 60,
        totalQuestions,
        totalScore: dto.totalScore || computedTotalScore || 100.0,
        passingScore: dto.passingScore || 50.0,
        status: dto.status || ExamStatus.DRAFT,
        moderationStatus: ModerationStatus.APPROVED, // Auto-approve or PENDING based on system
        isProtected: Boolean(dto.isProtected && passwordHash),
        passwordHash,
        tags: (dto.tags || []).map((t) => t.trim().toLowerCase()),
        questions: {
          create: questionsData,
        },
      },
      include: {
        questions: { include: { options: true } },
      },
    });

    const { passwordHash: _, ...safe } = exam;
    return safe;
  }

  async updateExam(userId: string, examId: string, dto: UpdateExamDto) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Bộ đề không tồn tại');
    if (exam.authorId !== userId) throw new ForbiddenException('Bạn không có quyền chỉnh sửa bộ đề này');

    let passwordHash = exam.passwordHash;
    if (dto.isProtected !== undefined) {
      if (dto.isProtected && dto.password?.trim()) {
        passwordHash = await bcrypt.hash(dto.password.trim(), 10);
      } else if (!dto.isProtected) {
        passwordHash = null;
      }
    }

    // If new questions provided, replace them
    if (dto.questions && Array.isArray(dto.questions)) {
      await this.prisma.examQuestion.deleteMany({ where: { examId } });

      for (let idx = 0; idx < dto.questions.length; idx++) {
        const q = dto.questions[idx];
        await this.prisma.examQuestion.create({
          data: {
            examId,
            questionNumber: q.questionNumber || idx + 1,
            questionText: q.questionText,
            questionHtml: q.questionHtml,
            imageUrl: q.imageUrl,
            audioUrl: q.audioUrl,
            questionType: q.questionType || QuestionType.MULTIPLE_CHOICE,
            correctAnswer: q.correctAnswer,
            acceptedAnswers: q.acceptedAnswers || [],
            explanation: q.explanation,
            sourceExplanation: q.sourceExplanation,
            optionExplanations: q.optionExplanations || null,
            grammarType: q.grammarType,
            partOfSpeech: q.partOfSpeech,
            difficulty: q.difficulty || 'MEDIUM',
            category: q.category || 'Grammar',
            skill: q.skill || 'Reading',
            points: q.points || 1.0,
            tags: q.tags || [],
            vocabularyIds: q.vocabularyIds || [],
            options: {
              create: (q.options || []).map((opt, oIdx) => ({
                key: opt.key || String.fromCharCode(65 + oIdx),
                text: opt.text,
                imageUrl: opt.imageUrl,
                displayOrder: opt.displayOrder ?? oIdx,
              })),
            },
          },
        });
      }
    }

    const questionCount = await this.prisma.examQuestion.count({ where: { examId } });

    const updated = await this.prisma.exam.update({
      where: { id: examId },
      data: {
        title: dto.title?.trim() || exam.title,
        description: dto.description !== undefined ? dto.description?.trim() : exam.description,
        coverImage: dto.coverImage !== undefined ? dto.coverImage : exam.coverImage,
        languageId: dto.languageId || exam.languageId,
        examType: dto.examType || exam.examType,
        section: dto.section || exam.section,
        level: dto.level || exam.level,
        durationMinutes: dto.durationMinutes || exam.durationMinutes,
        totalQuestions: questionCount,
        totalScore: dto.totalScore || exam.totalScore,
        passingScore: dto.passingScore !== undefined ? dto.passingScore : exam.passingScore,
        status: dto.status || exam.status,
        isProtected: dto.isProtected !== undefined ? dto.isProtected : exam.isProtected,
        passwordHash,
        tags: dto.tags ? dto.tags.map((t) => t.trim().toLowerCase()) : exam.tags,
      },
    });

    const { passwordHash: _, ...safe } = updated;
    return safe;
  }

  async deleteExam(userId: string, examId: string, role?: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Bộ đề không tồn tại');
    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
    if (exam.authorId !== userId && !isAdmin) {
      throw new ForbiddenException('Bạn không có quyền xóa bộ đề này');
    }

    await this.prisma.exam.delete({ where: { id: examId } });
    return { success: true, message: `Đã xóa bộ đề "${exam.title}" thành công` };
  }

  async publishExam(userId: string, examId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { _count: { select: { questions: true } } },
    });
    if (!exam) throw new NotFoundException('Bộ đề không tồn tại');
    if (exam.authorId !== userId) throw new ForbiddenException('Bạn không có quyền xuất bản bộ đề này');
    if (exam._count.questions === 0) {
      throw new BadRequestException('Bộ đề phải có ít nhất 1 câu hỏi để xuất bản');
    }

    const updated = await this.prisma.exam.update({
      where: { id: examId },
      data: { status: ExamStatus.PUBLISHED },
    });

    return { success: true, exam: updated };
  }

  async submitForReview(userId: string, examId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { _count: { select: { questions: true } } },
    });
    if (!exam) throw new NotFoundException('Bộ đề không tồn tại');
    if (exam.authorId !== userId) throw new ForbiddenException('Bạn không có quyền gửi duyệt bộ đề này');
    if (exam._count.questions === 0) {
      throw new BadRequestException('Bộ đề phải có ít nhất 1 câu hỏi để gửi duyệt');
    }

    const updated = await this.prisma.exam.update({
      where: { id: examId },
      data: {
        moderationStatus: ModerationStatus.PENDING,
        status: ExamStatus.DRAFT,
      },
    });

    return { success: true, message: 'Đã gửi bộ đề lên ban quản trị xét duyệt', exam: updated };
  }

  async approveExam(adminUserId: string, examId: string, role: string) {
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Chỉ quản trị viên mới có quyền duyệt bộ đề');
    }

    const updated = await this.prisma.exam.update({
      where: { id: examId },
      data: {
        moderationStatus: ModerationStatus.APPROVED,
        status: ExamStatus.PUBLISHED,
      },
    });

    return { success: true, message: 'Đã phê duyệt và xuất bản bộ đề lên cộng đồng', exam: updated };
  }

  async rejectExam(adminUserId: string, examId: string, role: string, reason?: string) {
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Chỉ quản trị viên mới có quyền từ chối bộ đề');
    }

    const updated = await this.prisma.exam.update({
      where: { id: examId },
      data: {
        moderationStatus: ModerationStatus.REJECTED,
        status: ExamStatus.DRAFT,
      },
    });

    return { success: true, message: 'Đã từ chối phê duyệt bộ đề', reason, exam: updated };
  }

  async duplicateExam(userId: string, examId: string) {
    const original = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          include: { options: true },
        },
      },
    });
    if (!original) throw new NotFoundException('Bộ đề gốc không tồn tại');

    // Rule 1: Owner cannot clone their own item
    if (original.authorId === userId) {
      throw new BadRequestException('Bạn là tác giả của bộ đề này, không cần sao chép!');
    }

    // Rule 2: Check if current user already has this exam in their collection
    const existingClone = await this.prisma.exam.findFirst({
      where: {
        authorId: userId,
        tags: { has: `source:${examId}` },
      },
      include: {
        author: { select: { id: true, displayName: true, avatar: true } },
        _count: { select: { questions: true } },
      },
    });
    if (existingClone) {
      return {
        ...existingClone,
        alreadyCloned: true,
        message: 'Bộ đề này đã có trong bộ đề thi của bạn.',
      };
    }

    const copyTitle = `${original.title} (Bản sao)`;
    const cleanTags = (original.tags || []).filter(
      (t) => !t.startsWith('source:') && !t.startsWith('cloned_from:')
    );
    const tagsWithSource = [...cleanTags, `source:${original.id}`, `cloned_from:${original.id}`];

    const duplicated = await this.prisma.exam.create({
      data: {
        authorId: userId,
        title: copyTitle,
        description: original.description,
        coverImage: original.coverImage,
        languageId: original.languageId,
        examType: original.examType,
        section: original.section,
        level: original.level,
        durationMinutes: original.durationMinutes,
        totalQuestions: original.totalQuestions,
        totalScore: original.totalScore,
        passingScore: original.passingScore,
        status: ExamStatus.DRAFT,
        moderationStatus: ModerationStatus.APPROVED,
        tags: tagsWithSource,
        questions: {
          create: original.questions.map((q) => ({
            questionNumber: q.questionNumber,
            questionText: q.questionText,
            questionHtml: q.questionHtml,
            imageUrl: q.imageUrl,
            audioUrl: q.audioUrl,
            questionType: q.questionType,
            correctAnswer: q.correctAnswer as any,
            acceptedAnswers: q.acceptedAnswers,
            explanation: q.explanation,
            sourceExplanation: q.sourceExplanation,
            optionExplanations: q.optionExplanations as any,
            grammarType: q.grammarType,
            partOfSpeech: q.partOfSpeech,
            difficulty: q.difficulty,
            category: q.category,
            skill: q.skill,
            points: q.points,
            tags: q.tags,
            vocabularyIds: q.vocabularyIds,
            options: {
              create: q.options.map((opt) => ({
                key: opt.key,
                text: opt.text,
                imageUrl: opt.imageUrl,
                displayOrder: opt.displayOrder,
              })),
            },
          })),
        },
      },
    });

    return {
      ...duplicated,
      alreadyCloned: false,
      message: 'Đã sao chép bộ đề về danh sách "Đề thi của tôi" thành công!',
    };
  }

  // ===========================================================================
  // EXAM TAKING & SUBMISSION ENGINE
  // ===========================================================================

  async startExam(userId: string, examId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          orderBy: { questionNumber: 'asc' },
          include: { options: { orderBy: { displayOrder: 'asc' } } },
        },
      },
    });
    if (!exam) throw new NotFoundException('Bộ đề không tồn tại');
    if (exam.questions.length === 0) throw new BadRequestException('Bộ đề chưa có câu hỏi');

    if (exam.isProtected && exam.authorId !== userId) {
      const grant = await this.prisma.bankAccessGrant.findFirst({
        where: {
          bankId: examId,
          userId,
          status: 'ACTIVE',
          revokedAt: null,
        },
      });
      const hasValidGrant = grant && (!grant.expiresAt || grant.expiresAt > new Date());
      if (!hasValidGrant) {
        throw new ForbiddenException('Bộ đề thi này đã được bảo vệ. Vui lòng mở khóa bằng Access Key hoặc liên hệ tác giả để được cấp quyền.');
      }
    }

    const attempt = await this.prisma.examAttempt.create({
      data: {
        examId,
        userId,
        startedAt: new Date(),
        totalPossibleScore: exam.totalScore,
      },
    });

    // Increment attemptCount on exam
    await this.prisma.exam.update({
      where: { id: examId },
      data: { attemptCount: { increment: 1 } },
    });

    // Strip answers for testing security
    const safeQuestions = exam.questions.map((q) => {
      const { correctAnswer, acceptedAnswers, explanation, sourceExplanation, optionExplanations, ...pub } = q;
      return pub;
    });

    return {
      attemptId: attempt.id,
      startedAt: attempt.startedAt,
      durationMinutes: exam.durationMinutes,
      totalQuestions: exam.totalQuestions,
      title: exam.title,
      questions: safeQuestions,
    };
  }

  async submitExam(userId: string, attemptId: string, dto: SubmitExamAttemptDto) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            questions: {
              include: { options: true },
            },
          },
        },
      },
    });

    if (!attempt) throw new NotFoundException('Phiên làm bài không tồn tại');
    if (attempt.userId !== userId) throw new ForbiddenException('Bạn không có quyền nộp bài này');
    if (attempt.submittedAt) throw new BadRequestException('Bài thi này đã được nộp trước đó');

    const now = new Date();
    const durationSeconds = Math.max(
      1,
      Math.round((now.getTime() - new Date(attempt.startedAt).getTime()) / 1000),
    );

    // Map user answers
    const answersMap = new Map<string, { selectedAnswer: any; timeSpentSeconds: number }>();
    for (const a of dto.answers || []) {
      answersMap.set(a.questionId, {
        selectedAnswer: a.selectedAnswer,
        timeSpentSeconds: a.timeSpentSeconds || 0,
      });
    }

    // Grade attempt server-side
    const scoringResult = this.scoringService.calculateTotalScore(
      attempt.exam.questions,
      answersMap,
      attempt.exam.passingScore,
    );

    // Compute smart analytics
    const analytics = this.analyticsService.computeAnalytics(
      scoringResult.evaluatedAnswers,
      durationSeconds,
    );

    // Save individual answers
    await this.prisma.$transaction([
      this.prisma.examAttempt.update({
        where: { id: attemptId },
        data: {
          submittedAt: now,
          durationSeconds,
          score: scoringResult.score,
          totalPossibleScore: scoringResult.totalPossibleScore,
          percentage: scoringResult.percentage,
          correctCount: scoringResult.correctCount,
          wrongCount: scoringResult.wrongCount,
          skippedCount: scoringResult.skippedCount,
          isPassed: scoringResult.isPassed,
          analytics: analytics as any,
        },
      }),
      this.prisma.examAnswer.createMany({
        data: scoringResult.evaluatedAnswers.map((ea) => ({
          attemptId,
          questionId: ea.questionId,
          selectedAnswer: ea.selectedAnswer as any,
          correctAnswer: ea.correctAnswer as any,
          isCorrect: ea.isCorrect,
          pointsAwarded: ea.pointsAwarded,
          timeSpentSeconds: ea.timeSpentSeconds,
          category: ea.category,
          skill: ea.skill,
          grammarType: ea.grammarType,
          partOfSpeech: ea.partOfSpeech,
          difficulty: ea.difficulty,
        })),
      }),
    ]);

    return {
      attemptId,
      submittedAt: now,
      durationSeconds,
      score: scoringResult.score,
      totalPossibleScore: scoringResult.totalPossibleScore,
      percentage: scoringResult.percentage,
      correctCount: scoringResult.correctCount,
      wrongCount: scoringResult.wrongCount,
      skippedCount: scoringResult.skippedCount,
      isPassed: scoringResult.isPassed,
      analytics,
    };
  }

  async getAttemptResult(userId: string, attemptId: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            questions: {
              orderBy: { questionNumber: 'asc' },
              include: { options: { orderBy: { displayOrder: 'asc' } } },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt) throw new NotFoundException('Lượt làm bài không tồn tại');
    if (attempt.userId !== userId) throw new ForbiddenException('Bạn không thể xem kết quả của người khác');

    const answerMap = new Map(attempt.answers.map((a) => [a.questionId, a]));

    const detailedQuestions = attempt.exam.questions.map((q) => {
      const ans = answerMap.get(q.id);
      return {
        ...q,
        userAnswer: ans?.selectedAnswer ?? null,
        isCorrect: ans?.isCorrect ?? false,
        pointsAwarded: ans?.pointsAwarded ?? 0,
        timeSpentSeconds: ans?.timeSpentSeconds ?? 0,
      };
    });

    return {
      id: attempt.id,
      examId: attempt.examId,
      examTitle: attempt.exam.title,
      examType: attempt.exam.examType,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      durationSeconds: attempt.durationSeconds,
      score: attempt.score,
      totalPossibleScore: attempt.totalPossibleScore,
      percentage: attempt.percentage,
      correctCount: attempt.correctCount,
      wrongCount: attempt.wrongCount,
      skippedCount: attempt.skippedCount,
      isPassed: attempt.isPassed,
      analytics: attempt.analytics,
      questions: detailedQuestions,
    };
  }

  async getUserExamHistory(userId: string) {
    const attempts = await this.prisma.examAttempt.findMany({
      where: { userId, submittedAt: { not: null } },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            examType: true,
            totalQuestions: true,
            durationMinutes: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
      take: 50,
    });

    return attempts.map((att) => ({
      id: att.id,
      examId: att.examId,
      examTitle: att.exam.title,
      examType: att.exam.examType,
      totalQuestions: att.exam.totalQuestions,
      score: att.score,
      totalPossibleScore: att.totalPossibleScore,
      percentage: att.percentage,
      correctCount: att.correctCount,
      wrongCount: att.wrongCount,
      skippedCount: att.skippedCount,
      durationSeconds: att.durationSeconds,
      submittedAt: att.submittedAt,
      isPassed: att.isPassed,
    }));
  }

  async getUserWrongAnswers(userId: string, grammarType?: string) {
    const where: any = {
      attempt: { userId },
      isCorrect: false,
    };

    if (grammarType) where.grammarType = grammarType;

    const wrongAnswers = await this.prisma.examAnswer.findMany({
      where,
      include: {
        question: {
          include: {
            options: true,
            exam: { select: { id: true, title: true, examType: true } },
          },
        },
      },
      orderBy: { id: 'desc' },
      take: 100,
    });

    // Group by grammarType for smart review
    const groupedByGrammar: Record<string, number> = {};
    for (const wa of wrongAnswers) {
      const g = wa.grammarType || 'Chung';
      groupedByGrammar[g] = (groupedByGrammar[g] || 0) + 1;
    }

    return {
      totalWrong: wrongAnswers.length,
      groupedByGrammar,
      wrongAnswers: wrongAnswers.map((wa) => ({
        id: wa.id,
        questionId: wa.questionId,
        questionText: wa.question.questionText,
        questionType: wa.question.questionType,
        options: wa.question.options,
        selectedAnswer: wa.selectedAnswer,
        correctAnswer: wa.correctAnswer,
        explanation: wa.question.explanation,
        sourceExplanation: wa.question.sourceExplanation,
        optionExplanations: wa.question.optionExplanations,
        grammarType: wa.grammarType,
        category: wa.category,
        skill: wa.skill,
        partOfSpeech: wa.partOfSpeech,
        examTitle: wa.question.exam.title,
        vocabularyIds: wa.question.vocabularyIds,
      })),
    };
  }

  // ===========================================================================
  // COMMUNITY INTERACTIONS (LIKES, DISLIKES, COMMENTS, SAVES)
  // ===========================================================================

  async toggleLikeExam(userId: string, examId: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Bộ đề không tồn tại');

    const existingLike = await this.prisma.examLike.findUnique({
      where: { userId_examId: { userId, examId } },
    });

    if (existingLike) {
      await this.prisma.examLike.delete({ where: { id: existingLike.id } });
      const updated = await this.prisma.exam.update({
        where: { id: examId },
        data: { likeCount: { decrement: 1 } },
        select: { likeCount: true, dislikeCount: true },
      });
      return { liked: false, disliked: false, likeCount: Math.max(0, updated.likeCount), dislikeCount: updated.dislikeCount };
    } else {
      const existingDislike = await this.prisma.examDislike.findUnique({
        where: { userId_examId: { userId, examId } },
      });
      if (existingDislike) {
        await this.prisma.examDislike.delete({ where: { id: existingDislike.id } });
        await this.prisma.exam.update({
          where: { id: examId },
          data: { dislikeCount: { decrement: 1 } },
        });
      }

      await this.prisma.examLike.create({ data: { userId, examId } });
      const updated = await this.prisma.exam.update({
        where: { id: examId },
        data: { likeCount: { increment: 1 } },
        select: { likeCount: true, dislikeCount: true },
      });

      return { liked: true, disliked: false, likeCount: updated.likeCount, dislikeCount: Math.max(0, updated.dislikeCount) };
    }
  }

  async toggleDislikeExam(userId: string, examId: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Bộ đề không tồn tại');

    const existingDislike = await this.prisma.examDislike.findUnique({
      where: { userId_examId: { userId, examId } },
    });

    if (existingDislike) {
      await this.prisma.examDislike.delete({ where: { id: existingDislike.id } });
      const updated = await this.prisma.exam.update({
        where: { id: examId },
        data: { dislikeCount: { decrement: 1 } },
        select: { likeCount: true, dislikeCount: true },
      });
      return { liked: false, disliked: false, likeCount: Math.max(0, updated.likeCount), dislikeCount: updated.dislikeCount };
    } else {
      const existingLike = await this.prisma.examLike.findUnique({
        where: { userId_examId: { userId, examId } },
      });
      if (existingLike) {
        await this.prisma.examLike.delete({ where: { id: existingLike.id } });
        await this.prisma.exam.update({
          where: { id: examId },
          data: { likeCount: { decrement: 1 } },
        });
      }

      await this.prisma.examDislike.create({ data: { userId, examId } });
      const updated = await this.prisma.exam.update({
        where: { id: examId },
        data: { dislikeCount: { increment: 1 } },
        select: { likeCount: true, dislikeCount: true },
      });

      return { liked: false, disliked: true, likeCount: Math.max(0, updated.likeCount), dislikeCount: updated.dislikeCount };
    }
  }

  async toggleSaveExam(userId: string, examId: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Bộ đề không tồn tại');

    const existing = await this.prisma.examSaved.findUnique({
      where: { userId_examId: { userId, examId } },
    });

    if (existing) {
      await this.prisma.examSaved.delete({ where: { id: existing.id } });
      return { saved: false, message: 'Đã bỏ lưu bộ đề' };
    } else {
      await this.prisma.examSaved.create({ data: { userId, examId } });
      return { saved: true, message: 'Đã lưu bộ đề vào danh sách cá nhân' };
    }
  }

  async getExamComments(examId: string) {
    const comments = await this.prisma.examComment.findMany({
      where: { examId, parentId: null },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, displayName: true, avatar: true, role: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, displayName: true, avatar: true, role: true } },
            replies: {
              orderBy: { createdAt: 'asc' },
              include: {
                user: { select: { id: true, displayName: true, avatar: true, role: true } },
              },
            },
          },
        },
      },
    });

    const totalCount = await this.prisma.examComment.count({ where: { examId, deletedAt: null } });
    return { comments, totalCount };
  }

  async addExamComment(userId: string, examId: string, content: string, parentId?: string) {
    if (!content || !content.trim()) throw new BadRequestException('Nội dung bình luận không được để trống');

    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Bộ đề không tồn tại');

    if (parentId) {
      const parent = await this.prisma.examComment.findUnique({ where: { id: parentId } });
      if (!parent) throw new NotFoundException('Bình luận gốc không tồn tại');
    }

    const comment = await this.prisma.examComment.create({
      data: {
        userId,
        examId,
        content: content.trim(),
        parentId: parentId || null,
      },
      include: {
        user: { select: { id: true, displayName: true, avatar: true, role: true } },
      },
    });

    await this.prisma.exam.update({
      where: { id: examId },
      data: { commentCount: { increment: 1 } },
    });

    if (parentId) {
      await this.prisma.examComment.update({
        where: { id: parentId },
        data: { replyCount: { increment: 1 } },
      });
    }

    return comment;
  }

  async updateExamComment(userId: string, commentId: string, content: string) {
    if (!content || !content.trim()) throw new BadRequestException('Nội dung bình luận không được để trống');

    const comment = await this.prisma.examComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Bình luận không tồn tại');
    if (comment.userId !== userId) throw new ForbiddenException('Bạn chỉ có thể sửa bình luận của mình');

    return this.prisma.examComment.update({
      where: { id: commentId },
      data: { content: content.trim(), isEdited: true },
      include: {
        user: { select: { id: true, displayName: true, avatar: true, role: true } },
      },
    });
  }

  async deleteExamComment(userId: string, commentId: string, userRole?: string) {
    const comment = await this.prisma.examComment.findUnique({
      where: { id: commentId },
      include: { _count: { select: { replies: true } } },
    });
    if (!comment) throw new NotFoundException('Bình luận không tồn tại');

    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    if (comment.userId !== userId && !isAdmin) {
      throw new ForbiddenException('Bạn không có quyền xóa bình luận này');
    }

    if (comment._count.replies > 0) {
      await this.prisma.examComment.update({
        where: { id: commentId },
        data: { content: '[Bình luận đã bị xóa]', deletedAt: new Date() },
      });
    } else {
      await this.prisma.examComment.delete({ where: { id: commentId } });
    }

    await this.prisma.exam.update({
      where: { id: comment.examId },
      data: { commentCount: { decrement: 1 } },
    });

    if (comment.parentId) {
      await this.prisma.examComment.update({
        where: { id: comment.parentId },
        data: { replyCount: { decrement: 1 } },
      });
    }

    return { success: true };
  }
}
