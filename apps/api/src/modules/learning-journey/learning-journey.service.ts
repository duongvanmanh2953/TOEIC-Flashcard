import { Prisma } from '@prisma/client';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  MULTILINGUAL_CURRICULA,
  CurriculumStage,
  CurriculumLesson,
  AI_ROADMAP_RECOMMENDATIONS,
  RoadmapRecommendation,
  getCurriculumQuestions,
  matchesCurriculumAnswer,
} from './curriculum-data';

export interface ProfileInputDto {
  languageId: string;
  targetLevel?: string;
  learningGoal?: string;
  dailyStudyMinutes?: number;
  preferredLearningDays?: string[];
  skillAssessments?: Record<string, { status: string; score: number; confidence: number }>;
  strengths?: string[];
  weaknesses?: string[];
}

export interface SubmitLessonDto {
  nodeId: string;
  score?: number; // Accept legacy clients while calculating the stored score from answers.
  timeSpentSeconds: number;
  activitiesResult?: any;
  skillBreakdown?: Record<string, number>;
}

@Injectable()
export class LearningJourneyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get or create default learning profile for user and language space
   */
  async getLearningProfile(userId: string, languageId: string = 'en') {
    const lang = (languageId || 'en').toLowerCase();
    let profile = await this.prisma.learningProfile.findUnique({
      where: {
        userId_languageId: { userId, languageId: lang },
      },
    });

    if (!profile) {
      // Find user profile to inspect estimated level
      const userProfile = await this.prisma.userProfile.findUnique({ where: { userId } });
      const estimated = (userProfile?.englishLevel as string) || 'A2';
      const target = estimated === 'C1' ? 'C2' : estimated === 'B2' ? 'C1' : 'B1';

      profile = await this.prisma.learningProfile.create({
        data: {
          userId,
          languageId: lang,
          targetLevel: target,
          currentEstimatedLevel: estimated,
          learningGoal: 'COMMUNICATION',
          dailyStudyMinutes: 20,
          preferredLearningDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
          skillAssessments: {
            vocabulary: { status: 'ASSESSED', score: 75, confidence: 0.8 },
            grammar: { status: 'ASSESSED', score: 70, confidence: 0.75 },
            listening: { status: 'INSUFFICIENT_EVIDENCE', score: 50, confidence: 0.4 },
            reading: { status: 'ASSESSED', score: 80, confidence: 0.85 },
            speaking: { status: 'NOT_ASSESSED', score: 0, confidence: 0.0 },
            writing: { status: 'NOT_ASSESSED', score: 0, confidence: 0.0 },
          },
          strengths: ['Từ vựng cơ bản', 'Đọc hiểu ngữ cảnh đơn giản'],
          weaknesses: ['Phản xạ nghe hội thoại', 'Cụm động từ & Phrasal Verbs'],
          recommendedFocus: ['Active Listening Lab', 'Ngữ pháp ứng dụng'],
          assessmentCompletedAt: new Date(),
        },
      });
    }

    return profile;
  }

  /**
   * Save or update learning profile (e.g. from placement test or goal setting)
   */
  async upsertLearningProfile(userId: string, dto: ProfileInputDto) {
    const lang = (dto.languageId || 'en').toLowerCase();
    const existing = await this.prisma.learningProfile.findUnique({
      where: { userId_languageId: { userId, languageId: lang } },
    });

    const targetLevel = dto.targetLevel || existing?.targetLevel || 'B1';
    const learningGoal = dto.learningGoal || existing?.learningGoal || 'COMMUNICATION';
    const dailyStudyMinutes = dto.dailyStudyMinutes || existing?.dailyStudyMinutes || 20;

    const profile = await this.prisma.learningProfile.upsert({
      where: { userId_languageId: { userId, languageId: lang } },
      create: {
        userId,
        languageId: lang,
        targetLevel,
        currentEstimatedLevel: existing?.currentEstimatedLevel || 'A2',
        learningGoal,
        dailyStudyMinutes,
        preferredLearningDays: dto.preferredLearningDays || ['MON', 'TUE', 'WED', 'THU', 'FRI'],
        skillAssessments: dto.skillAssessments || {
          vocabulary: { status: 'ASSESSED', score: 75, confidence: 0.8 },
          grammar: { status: 'ASSESSED', score: 70, confidence: 0.75 },
          listening: { status: 'INSUFFICIENT_EVIDENCE', score: 50, confidence: 0.4 },
        },
        strengths: dto.strengths || ['Từ vựng nền tảng'],
        weaknesses: dto.weaknesses || ['Nghe bắt từ khóa'],
        recommendedFocus: ['Học phản xạ ngữ âm & từ vựng'],
        assessmentCompletedAt: new Date(),
      },
      update: {
        targetLevel,
        learningGoal,
        dailyStudyMinutes,
        preferredLearningDays: dto.preferredLearningDays,
        skillAssessments: dto.skillAssessments,
        strengths: dto.strengths,
        weaknesses: dto.weaknesses,
        updatedAt: new Date(),
      },
    });

    // When profile updates, ensure roadmap reflects these settings
    await this.generatePersonalizedRoadmap(userId, lang);

    return profile;
  }

  /**
   * Generate or retrieve personalized roadmap instance for user
   */
  async getRoadmap(userId: string, languageId: string = 'en') {
    const lang = (languageId || 'en').toLowerCase();
    let instance = await this.prisma.roadmapInstance.findFirst({
      where: { userId, languageId: lang, status: 'ACTIVE' },
      include: {
        progressList: true,
      },
      orderBy: { version: 'desc' },
    });

    if (!instance) {
      instance = await this.generatePersonalizedRoadmap(userId, lang);
    }

    return instance;
  }

  /**
   * Get AI recommended roadmap suggestions for a specific language space
   */
  getRoadmapRecommendations(languageId: string = 'en'): RoadmapRecommendation[] {
    const lang = (languageId || 'en').toLowerCase().trim();
    return AI_ROADMAP_RECOMMENDATIONS[lang] || AI_ROADMAP_RECOMMENDATIONS['en'] || [];
  }

  /**
   * Apply an AI recommended roadmap preset or custom configuration
   */
  async applyRoadmapPreset(
    userId: string,
    dto: {
      languageId: string;
      presetId?: string;
      customTitle?: string;
      targetLevel?: string;
      learningGoal?: string;
      dailyStudyMinutes?: number;
    },
  ) {
    const lang = (dto.languageId || 'en').toLowerCase().trim();
    const recommendations = this.getRoadmapRecommendations(lang);
    const preset = dto.presetId ? recommendations.find((r) => r.id === dto.presetId) : null;

    const targetLevel = dto.targetLevel || preset?.targetLevel || 'B1';
    const learningGoal = dto.learningGoal || preset?.learningGoal || 'COMMUNICATION';
    const dailyStudyMinutes = dto.dailyStudyMinutes || preset?.dailyStudyMinutes || 20;
    const customTitle = dto.customTitle || preset?.title;

    await this.prisma.learningProfile.upsert({
      where: { userId_languageId: { userId, languageId: lang } },
      create: {
        userId,
        languageId: lang,
        targetLevel,
        currentEstimatedLevel: 'A2',
        learningGoal,
        dailyStudyMinutes,
        preferredLearningDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
      },
      update: {
        targetLevel,
        learningGoal,
        dailyStudyMinutes,
        updatedAt: new Date(),
      },
    });

    return await this.generatePersonalizedRoadmap(userId, lang, {
      title: customTitle,
      targetLevel,
      learningGoal,
      dailyStudyMinutes,
    });
  }

  /**
   * Generates a tailor-made roadmap instance using the curriculum graph & user profile
   */
  async generatePersonalizedRoadmap(
    userId: string,
    languageId: string = 'en',
    customOptions?: {
      title?: string;
      targetLevel?: string;
      learningGoal?: string;
      dailyStudyMinutes?: number;
    },
  ) {
    const lang = (languageId || 'en').toLowerCase();
    const profile = await this.getLearningProfile(userId, lang);

    const baseStages = MULTILINGUAL_CURRICULA[lang] || MULTILINGUAL_CURRICULA['en'];

    // Collect all lesson nodes
    let totalNodes = 0;
    const allLessons: CurriculumLesson[] = [];
    baseStages.forEach((st) => {
      st.chapters.forEach((ch) => {
        ch.lessons.forEach((les) => {
          totalNodes++;
          allLessons.push(les);
        });
      });
    });

    // Check existing progress to preserve mastery
    const existingProgress = await this.prisma.userLessonProgress.findMany({
      where: { userId },
    });
    const progressMap = new Map(existingProgress.map((p) => [p.nodeId, p]));

    // Archive any old active roadmaps
    await this.prisma.roadmapInstance.updateMany({
      where: { userId, languageId: lang, status: 'ACTIVE' },
      data: { status: 'ARCHIVED' },
    });

    // Compute title based on goal or custom title
    const effectiveGoal = customOptions?.learningGoal || profile.learningGoal;
    const effectiveLevel = customOptions?.targetLevel || profile.targetLevel;

    const goalTitleMap: Record<string, string> = {
      COMMUNICATION: 'Lộ Trình Giao Tiếp Phản Xạ Đời Thực',
      CAREER: 'Lộ Trình Công Sở & Thăng Tiến Sự Nghiệp',
      EXAM: 'Lộ Trình Chinh Phục Chứng Chỉ Quốc Tế',
      TRAVEL: 'Lộ Trình Du Lịch & Định Cư Toàn Cầu',
    };
    const title =
      customOptions?.title ||
      `${goalTitleMap[effectiveGoal] || 'Hành Trình Học Tập Cá Nhân Hóa'} (${effectiveLevel})`;

    const newRoadmap = await this.prisma.roadmapInstance.create({
      data: {
        userId,
        languageId: lang,
        title,
        targetLevel: effectiveLevel,
        version: (profile.roadmapVersion || 1) + 1,
        status: 'ACTIVE',
        totalNodes,
        completedNodes: 0,
        masteredNodes: 0,
        currentStageIndex: 0,
        currentChapterIndex: 0,
        stagesJson: baseStages as any,
        adaptationLog: [
          {
            timestamp: new Date().toISOString(),
            action: customOptions?.title ? 'CUSTOM_ROADMAP_CONFIGURED' : 'INITIAL_ROADMAP_GENERATED',
            reason: `Tạo lộ trình cá nhân hóa: ${title} (Mục tiêu: ${effectiveGoal}, Trình độ: ${effectiveLevel})`,
          },
        ],
      },
    });

    // Initialize progress for each lesson in prerequisite order
    let completedCount = 0;
    let masteredCount = 0;
    let currentNodeId: string | null = null;

    for (let i = 0; i < allLessons.length; i++) {
      const les = allLessons[i];
      const prev = progressMap.get(les.id);

      let status = 'LOCKED';
      let score = 0;

      if (prev && (prev.status === 'MASTERED' || prev.status === 'COMPLETED')) {
        status = prev.status;
        score = prev.score;
        if (status === 'COMPLETED') completedCount++;
        if (status === 'MASTERED') {
          completedCount++;
          masteredCount++;
        }
      } else if (i === 0 || allLessons[i - 1].prerequisites.length === 0) {
        // First node is available
        status = 'AVAILABLE';
        if (!currentNodeId) currentNodeId = les.id;
      }

      await this.prisma.userLessonProgress.upsert({
        where: {
          userId_roadmapId_nodeId: {
            userId,
            roadmapId: newRoadmap.id,
            nodeId: les.id,
          },
        },
        create: {
          userId,
          roadmapId: newRoadmap.id,
          nodeId: les.id,
          nodeType: les.type === 'CHECKPOINT' ? 'CHECKPOINT' : 'LESSON',
          status,
          score,
          attemptCount: prev ? prev.attemptCount : 0,
        },
        update: {
          status,
          score,
        },
      });
    }

    if (!currentNodeId && allLessons.length > 0) {
      currentNodeId = allLessons[0].id;
    }

    const updated = await this.prisma.roadmapInstance.update({
      where: { id: newRoadmap.id },
      data: {
        completedNodes: completedCount,
        masteredNodes: masteredCount,
        currentNodeId,
      },
      include: {
        progressList: true,
      },
    });

    return updated;
  }

  /**
   * Submit activity / lesson / checkpoint result
   * Evaluates mastery (> 80%), unlocks subsequent nodes or prescribes remedial steps
   */
  async submitLessonProgress(userId: string, roadmapId: string, dto: SubmitLessonDto) {
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.prisma.$transaction(
          (tx) => this.saveLessonProgress(tx, userId, roadmapId, dto),
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      } catch (err) {
        if (!(err instanceof Prisma.PrismaClientKnownRequestError) || err.code !== 'P2034' || attempt >= 2) throw err;
      }
    }
  }

  private async saveLessonProgress(tx: Prisma.TransactionClient, userId: string, roadmapId: string, dto: SubmitLessonDto) {
    const roadmap = await tx.roadmapInstance.findUnique({
      where: { id: roadmapId },
      include: { progressList: true },
    });

    if (!roadmap) throw new NotFoundException('Không tìm thấy lộ trình');
    if (roadmap.userId !== userId) throw new BadRequestException('Không có quyền truy cập lộ trình này');

    const progress = await tx.userLessonProgress.findUnique({
      where: {
        userId_roadmapId_nodeId: {
          userId,
          roadmapId,
          nodeId: dto.nodeId,
        },
      },
    });

    if (!progress) throw new NotFoundException('Không tìm thấy bài học này trong tiến trình');

    const stages = roadmap.stagesJson as unknown as CurriculumStage[];
    const allLessons = stages.flatMap((stage) => stage.chapters.flatMap((chapter) => chapter.lessons));
    const lesson = allLessons.find((item) => item.id === dto.nodeId);
    if (!lesson) throw new NotFoundException('Không tìm thấy nội dung bài học.');
    if (progress.status === 'LOCKED') throw new BadRequestException('Hãy hoàn thành bài tiên quyết trước.');

    const questions = lesson.activities.flatMap(getCurriculumQuestions);
    const answers = dto.activitiesResult?.userAnswers;
    if (dto.activitiesResult?.stepsCompleted !== lesson.activities.length ||
        questions.some(({ key }) => typeof answers?.[key] !== 'string' || !answers[key].trim() || answers[key].length > 4000)) {
      throw new BadRequestException('Hãy trả lời đầy đủ các câu hỏi của bài học trước khi lưu.');
    }
    const correct = questions.filter(({ key, answer }) => matchesCurriculumAnswer(answers?.[key], answer)).length;
    const score = questions.length ? Math.round(100 * correct / questions.length) : 0;
    const passedAttempt = questions.length === 0 || score >= 80;
    const masteredAttempt = questions.length > 0 && score >= 90;
    const bestScore = Math.max(progress.score, score);
    const isMastered = progress.status === 'MASTERED' || masteredAttempt;
    const isPassed = isMastered || progress.status === 'COMPLETED' || passedAttempt;
    const attemptId = dto.activitiesResult?.attemptId;
    const previousResult = progress.activitiesResult as { attemptId?: string } | null;
    if (typeof attemptId === 'string' && attemptId && attemptId === previousResult?.attemptId) {
      return { success: true, score, status: progress.status, isPassed: passedAttempt, isMastered: masteredAttempt, progress };
    }

    let newStatus = progress.status;
    let remediationPath = null;

    if (isMastered) {
      newStatus = 'MASTERED';
    } else if (isPassed) {
      newStatus = 'COMPLETED';
    } else {
      newStatus = 'RETAKE_REQUIRED';
      remediationPath = {
        failedScore: score,
        requiredThreshold: 80,
        advice: 'Điểm số chưa đạt ngưỡng thông thạo 80%. Hãy làm lại phần bài tập vận dụng để củng cố trước khi sang bài tiếp theo.',
      };
    }

    // Update progress
    const updatedProgress = await tx.userLessonProgress.update({
      where: { id: progress.id },
      data: {
        status: newStatus,
        score: bestScore,
        attemptCount: { increment: 1 },
        activitiesResult: {
          attemptId: typeof attemptId === 'string' ? attemptId.slice(0, 128) : null,
          stepsCompleted: lesson.activities.length,
          userAnswers: Object.fromEntries(questions.map(({ key }) => [key, answers[key]])),
        },
        skillBreakdown: dto.skillBreakdown || progress.skillBreakdown,
        remediationPath: remediationPath as any,
        lastAttemptAt: new Date(),
        completedAt: isPassed ? progress.completedAt ?? new Date() : progress.completedAt,
        masteredAt: isMastered ? progress.masteredAt ?? new Date() : progress.masteredAt,
      },
    });

    // If passed, unlock dependent/subsequent nodes
    if (isPassed) {
      const progressByNode = new Map(roadmap.progressList.map((item) => [item.nodeId, item.status]));
      progressByNode.set(lesson.id, newStatus);
      const completed = (nodeId: string) => {
        const status = progressByNode.get(nodeId);
        return status === undefined || status === 'COMPLETED' || status === 'MASTERED';
      };
      const unlocked = allLessons.filter((item) =>
        progressByNode.get(item.id) === 'LOCKED' && item.prerequisites.every(completed));
      if (unlocked.length) {
        await tx.userLessonProgress.updateMany({
          where: { roadmapId, userId, nodeId: { in: unlocked.map((item) => item.id) }, status: 'LOCKED' },
          data: { status: 'AVAILABLE' },
        });
        await tx.roadmapInstance.update({
          where: { id: roadmap.id },
          data: { currentNodeId: unlocked[0].id },
        });
      }
    }

    // Recalculate summary counts
    const allUserProgress = await tx.userLessonProgress.findMany({
      where: { roadmapId },
    });
    const completedNodes = allUserProgress.filter((p) => p.status === 'COMPLETED' || p.status === 'MASTERED').length;
    const masteredNodes = allUserProgress.filter((p) => p.status === 'MASTERED').length;

    await tx.roadmapInstance.update({
      where: { id: roadmap.id },
      data: { completedNodes, masteredNodes },
    });

    return {
      success: true,
      score,
      status: newStatus,
      isPassed: passedAttempt,
      isMastered: masteredAttempt,
      progress: updatedProgress,
    };
  }

  /**
   * Daily Study Plan generator: combines review due from SRS, next required lesson, and weak skill focus
   */
  async getDailyPlan(userId: string, languageId: string = 'en') {
    const lang = (languageId || 'en').toLowerCase();
    const [roadmap, profile, dueWords] = await Promise.all([
      this.getRoadmap(userId, lang),
      this.getLearningProfile(userId, lang),
      this.prisma.userVocabulary.findMany({
        where: {
          userId,
          nextReviewAt: { lte: new Date() },
          vocabulary: { languageId: lang },
        },
        orderBy: { nextReviewAt: 'asc' },
        take: 20,
        include: { vocabulary: true },
      }),
    ]);

    const stages = roadmap.stagesJson as unknown as CurriculumStage[];
    const allLessons: CurriculumLesson[] = [];
    stages.forEach((st) => st.chapters.forEach((ch) => ch.lessons.forEach((l) => allLessons.push(l))));

    const statusByLesson = new Map(roadmap.progressList.map((progress) => [progress.nodeId, progress.status]));
    const actionable = (lesson: CurriculumLesson) =>
      ['AVAILABLE', 'IN_PROGRESS', 'RETAKE_REQUIRED', 'REVIEW_NEEDED'].includes(statusByLesson.get(lesson.id) ?? '');
    const currentNode = allLessons.find((lesson) => lesson.id === roadmap.currentNodeId && actionable(lesson)) ||
      allLessons.find(actionable);

    // Distribute time budget
    const budget = profile.dailyStudyMinutes || 20;
    const srsTime = dueWords.length ? Math.min(dueWords.length, 10, Math.max(3, Math.round(budget * 0.3))) : 0;
    const lessonTime = currentNode ? Math.min(currentNode.durationMinutes, budget - srsTime) : 0;
    const labTime = Math.max(0, budget - srsTime - lessonTime);

    return {
      date: new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()),
      totalBudgetMinutes: budget,
      dueWordsCount: dueWords.length,
      nextLesson: currentNode
        ? {
            id: currentNode.id,
            title: currentNode.title,
            type: currentNode.type,
            durationMinutes: lessonTime,
            objective: currentNode.objective,
          }
        : null,
      planItems: [
        {
          id: 'item-srs-review',
          title: `Ôn tập trí nhớ ngắt quãng SRS (${dueWords.length} từ cần kích hoạt)`,
          durationMinutes: srsTime,
          type: 'SRS_REVIEW',
          route: '/review',
          isCompleted: dueWords.length === 0,
        },
        {
          id: 'item-roadmap-lesson',
          title: currentNode ? `Bài học tiếp theo: ${currentNode.title}` : 'Hoàn thành chặng học',
          durationMinutes: lessonTime,
          type: 'ROADMAP_LESSON',
          route: `/journey?nodeId=${currentNode?.id || ''}`,
          isCompleted: false,
        },
        ...(labTime > 0
          ? [
              {
                id: 'item-listening-lab',
                title: 'Luyện nghe phản xạ trong Listening Lab (Active Comprehension)',
                durationMinutes: labTime,
                type: 'LISTENING_LAB',
                route: '/listening',
                isCompleted: false,
              },
            ]
          : []),
      ],
    };
  }
}
