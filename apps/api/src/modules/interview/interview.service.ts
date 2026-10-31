import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AIService } from '../ai/ai.service';
import { InterviewTaxonomyService } from './interview-taxonomy.service';
import { InterviewRagService } from './interview-rag.service';
import { InterviewBillingService } from './interview-billing.service';
import {
  InterviewSetupConfig,
  InterviewReportData,
  InterviewQuestionItem,
} from '@vocabflow/shared';

@Injectable()
export class InterviewService {
  private readonly logger = new Logger(InterviewService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
    private readonly taxonomyService: InterviewTaxonomyService,
    private readonly ragService: InterviewRagService,
    private readonly billingService: InterviewBillingService,
  ) {}

  /**
   * Initialize a new AI Interview Session (Phần 2.6 & 11.1)
   */
  async createSession(userId: string, config: InterviewSetupConfig) {
    // 1. Entitlement check
    await this.billingService.checkEntitlement(userId);

    // 2. Select initial question pool based on mode & source
    const questions = await this.selectQuestionsForSession(config, userId);
    if (questions.length === 0) {
      throw new BadRequestException('Không tìm thấy bộ câu hỏi phù hợp cho ngành nghề và vị trí này.');
    }

    // 3. Create Session in database
    const session = await this.prisma.interviewSession.create({
      data: {
        userId,
        languageId: config.languageId || 'en',
        supportLanguageId: config.supportLanguageId || 'vi',
        industryCode: config.industryCode,
        positionTitle: config.positionTitle,
        seniorityLevel: config.seniorityLevel || 'Mid-level',
        interviewType: config.interviewType || 'General Professional',
        mode: config.mode || 'REALISTIC',
        questionMode: config.questionMode || 'SEQUENTIAL',
        interviewerStyle: config.interviewerStyle || 'PROFESSIONAL',
        durationMinutes: config.durationMinutes || 20,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });

    // 4. Reserve session credits with the created session.id
    try {
      const idempotencyKey = `session_res_${userId}_${session.id}`;
      await this.billingService.reserveSessionCredits(userId, session.id, idempotencyKey);
    } catch (billingErr) {
      this.logger.warn(`Could not reserve credits for session ${session.id}: ${billingErr}`);
    }

    // 5. Create first turn with Question 1
    const firstQ = questions[0];
    const firstTurn = await this.prisma.interviewTurn.create({
      data: {
        sessionId: session.id,
        turnNumber: 1,
        questionText: firstQ.body,
        questionId: firstQ.id,
        isFollowUp: false,
        hintLevelUsed: 0,
        usedSampleAnswer: false,
      },
    });

    return {
      session: {
        id: session.id,
        industryCode: session.industryCode,
        positionTitle: session.positionTitle,
        seniorityLevel: session.seniorityLevel,
        languageId: session.languageId,
        supportLanguageId: session.supportLanguageId,
        mode: session.mode,
        durationMinutes: session.durationMinutes,
        status: session.status,
      },
      currentTurn: {
        turnNumber: 1,
        questionText: firstTurn.questionText,
        questionId: firstTurn.questionId,
        totalQuestions: questions.length,
      },
    };
  }

  /**
   * Candidate submits answer (text or voice transcript) (Phần 6.2 - 6.4)
   */
  async submitTurnAnswer(
    userId: string,
    sessionId: string,
    turnNumber: number,
    candidateAnswer: string,
    durationSec: number = 0
  ) {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        turns: { orderBy: { turnNumber: 'asc' } },
      },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundException('Phiên phỏng vấn không tồn tại hoặc bạn không có quyền truy cập.');
    }

    const currentTurn = session.turns.find((t) => t.turnNumber === turnNumber);
    if (!currentTurn) {
      throw new NotFoundException(`Lượt câu hỏi ${turnNumber} không tồn tại.`);
    }

    const cleanAnswer = this.ragService.sanitizeCandidateText(candidateAnswer);

    // 1. RAG Context Retrieval for grounded evaluation
    const relevantChunks = await this.ragService.retrieveRelevantKnowledge({
      industryCode: session.industryCode,
      languageCode: session.languageId,
      queryText: `${currentTurn.questionText} ${cleanAnswer}`,
      requesterUserId: userId,
      limit: 3,
    });

    const knowledgeContext = relevantChunks.map((c) => c.content).join('\n---\n');

    // 2. AI Turn Evaluation & Follow-up decision
    const evaluation = await this.evaluateTurnWithAI(
      session,
      currentTurn.questionText,
      cleanAnswer,
      knowledgeContext,
      currentTurn.isFollowUp
    );

    // 3. Update current turn
    await this.prisma.interviewTurn.update({
      where: { id: currentTurn.id },
      data: {
        candidateAnswer: cleanAnswer,
        durationSec,
        analysisJson: evaluation as any,
      },
    });

    // 4. Decide next turn:
    // If answer is incomplete AND hasn't reached max follow-up (1 follow-up max per main question):
    if (evaluation.shouldFollowUp && !currentTurn.isFollowUp && evaluation.followUpQuestion) {
      const nextTurnNumber = turnNumber + 1;
      const followUpTurn = await this.prisma.interviewTurn.create({
        data: {
          sessionId: session.id,
          turnNumber: nextTurnNumber,
          questionText: evaluation.followUpQuestion,
          isFollowUp: true,
          followUpParentId: currentTurn.id,
          hintLevelUsed: 0,
        },
      });

      return {
        isSessionCompleted: false,
        evaluation: session.mode === 'COACH' ? evaluation : undefined,
        nextTurn: {
          turnNumber: nextTurnNumber,
          questionText: followUpTurn.questionText,
          isFollowUp: true,
          followUpParentQuestion: currentTurn.questionText,
        },
      };
    }

    // Otherwise, move to next primary question or complete session
    const allQuestions = await this.selectQuestionsForSession(
      {
        industryCode: session.industryCode,
        positionTitle: session.positionTitle,
        languageId: session.languageId,
        questionSource: 'CURATED',
        questionMode: session.questionMode as any,
      } as any,
      userId
    );

    const answeredMainTurns = session.turns.filter((t) => !t.isFollowUp).length;
    const nextQuestionIndex = answeredMainTurns;

    // Check if finished session (target: 4-5 main questions or reach max turn limit)
    if (nextQuestionIndex >= Math.min(5, allQuestions.length) || turnNumber >= this.billingService.getMaxTurnsLimit()) {
      return this.finishSession(userId, sessionId);
    }

    const nextQ = allQuestions[nextQuestionIndex];
    const nextTurnNumber = turnNumber + 1;

    const nextTurn = await this.prisma.interviewTurn.create({
      data: {
        sessionId: session.id,
        turnNumber: nextTurnNumber,
        questionText: nextQ.body,
        questionId: nextQ.id,
        isFollowUp: false,
        hintLevelUsed: 0,
      },
    });

    return {
      isSessionCompleted: false,
      evaluation: session.mode === 'COACH' ? evaluation : undefined,
      nextTurn: {
        turnNumber: nextTurnNumber,
        questionText: nextTurn.questionText,
        questionId: nextTurn.questionId,
        isFollowUp: false,
        totalQuestions: Math.min(5, allQuestions.length),
      },
    };
  }

  /**
   * Request multi-level hints (Keywords -> Structure -> Sample Answer) (Phần 8.1)
   */
  async requestHint(userId: string, sessionId: string, turnNumber: number, hintLevel: 1 | 2 | 3) {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: { turns: true },
    });

    if (!session || session.userId !== userId) throw new NotFoundException('Session not found');
    const turn = session.turns.find((t) => t.turnNumber === turnNumber);
    if (!turn) throw new NotFoundException('Turn not found');

    // Update hint level used on this turn
    await this.prisma.interviewTurn.update({
      where: { id: turn.id },
      data: {
        hintLevelUsed: Math.max(turn.hintLevelUsed, hintLevel),
        usedSampleAnswer: hintLevel === 3 ? true : turn.usedSampleAnswer,
      },
    });

    // Generate dynamic hint based on level
    const prompt = `You are a professional Interview Coach.
Position: ${session.positionTitle} (${session.seniorityLevel})
Language: ${session.languageId}
Question: "${turn.questionText}"

Generate a Hint Level ${hintLevel}:
- Level 1: 3-5 core technical keywords or competencies the candidate should mention.
- Level 2: An outline/structure template (e.g. STAR framework steps or 3-step technical approach).
- Level 3: A professional, concise sample answer demonstrating best practices.

Return JSON strictly:
{
  "level": ${hintLevel},
  "content": "hint content in ${session.languageId}",
  "contentVi": "bản dịch tiếng Việt của gợi ý"
}`;

    const res = await this.aiService.pipelineQuery(userId, prompt);
    let parsedHint: any = null;
    try {
      const match = ((res as any).reply || (res as any).response || '').match(/\{[\s\S]*\}/);
      if (match) parsedHint = JSON.parse(match[0]);
    } catch {}

    return {
      turnNumber,
      level: hintLevel,
      hint: parsedHint?.content || 'Focus on concrete actions, measurable results, and technical tools.',
      translationVi: parsedHint?.contentVi || 'Hãy tập trung vào hành động cụ thể, kết quả đo lường được và công cụ kỹ thuật.',
    };
  }

  /**
   * Translate Question or Hint to Support Language (Phần 8.2)
   */
  async translateContent(userId: string, text: string, targetLang: string = 'vi') {
    const prompt = `Translate the following interview question/text into natural, professional ${targetLang}:\n"${text}"\nReturn only the translation.`;
    const res = await this.aiService.pipelineQuery(userId, prompt);
    const replyText = (res as any).reply || (res as any).response || '';
    return {
      original: text,
      translated: replyText.trim().replace(/^"|"$/g, ''),
    };
  }

  /**
   * Finish session and generate comprehensive post-interview report (Phần 9.1 - 9.6)
   */
  async finishSession(userId: string, sessionId: string) {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        turns: { orderBy: { turnNumber: 'asc' } },
        evaluation: true,
      },
    });

    if (!session || session.userId !== userId) throw new NotFoundException('Session not found');

    if (session.evaluation) {
      return {
        isSessionCompleted: true,
        report: session.evaluation,
      };
    }

    // 1. Calculate duration and settle credits
    const durationSec = Math.round((Date.now() - session.createdAt.getTime()) / 1000);
    await this.billingService.settleSessionCredits(userId, sessionId, durationSec, session.turns.length);

    // 2. Generate detailed report via AI
    const turnsSummary = session.turns
      .filter((t) => t.candidateAnswer)
      .map(
        (t) =>
          `Turn ${t.turnNumber} (${t.isFollowUp ? 'Follow-up' : 'Main'}):
Question: ${t.questionText}
Candidate Answer: ${t.candidateAnswer}
Hint Used: Level ${t.hintLevelUsed}`
      )
      .join('\n\n');

    const prompt = `You are a Senior Technical Hiring Lead and Certified Language Assessor.
Analyze this completed mock interview session:
Position: ${session.positionTitle} (${session.seniorityLevel})
Language: ${session.languageId}
Transcript:
${turnsSummary || 'No responses provided.'}

Evaluate comprehensively and output strictly in JSON format:
{
  "overallScore": 82,
  "competencyScore": 84,
  "languageScore": 80,
  "strengths": ["Clear explanation of component architecture", "Good structured STAR communication"],
  "weaknesses": ["Missed quantifying latency improvement metrics", "Minor grammatical hesitation with past tenses"],
  "summaryMd": "Detailed 2-paragraph markdown summary of candidate performance, role readiness, and key takeaways.",
  "questionReviews": [
    {
      "turnNumber": 1,
      "question": "question text",
      "candidateAnswer": "answer text",
      "score": 85,
      "feedback": "constructive feedback",
      "suggestedAnswer": "model answer",
      "translationVi": "bản dịch tiếng Việt câu trả lời mẫu"
    }
  ],
  "learningRecommendations": [
    {
      "domain": "VOCABULARY",
      "title": "Technical Performance Metrics & Tradeoffs",
      "reason": "Reinforce terminology for throughput, memory bottlenecks, and latency.",
      "targetUrl": "/vocabulary"
    },
    {
      "domain": "GRAMMAR",
      "title": "Past Perfect & Conditionals for Situational Examples",
      "reason": "Enhance fluency when describing previous engineering challenges.",
      "targetUrl": "/grammar"
    }
  ]
}`;

    const aiRes = await this.aiService.pipelineQuery(userId, prompt);
    let parsed: any = null;
    try {
      const match = ((aiRes as any).reply || (aiRes as any).response || '').match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    } catch {}

    const overallScore = parsed?.overallScore || 75;
    const competencyScore = parsed?.competencyScore || 78;
    const languageScore = parsed?.languageScore || 72;

    // 3. Save Evaluation record
    const evaluation = await this.prisma.interviewEvaluation.create({
      data: {
        sessionId: session.id,
        overallScore,
        competencyScore,
        languageScore,
        strengths: parsed?.strengths || ['Professional attitude', 'Relevant background knowledge'],
        weaknesses: parsed?.weaknesses || ['Provide more concrete metrics in answers'],
        summaryMd: parsed?.summaryMd || 'Ứng viên thể hiện hiểu biết tốt về vị trí công việc, cần bổ sung thêm số liệu minh chứng cụ thể.',
        recommendationsJson: parsed?.learningRecommendations || [],
        questionReviewsJson: parsed?.questionReviews || [],
      },
    });

    // 4. Update session status
    await this.prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        score: overallScore,
        endedAt: new Date(),
      },
    });

    return {
      isSessionCompleted: true,
      report: {
        sessionId: session.id,
        overallScore,
        competencyScore,
        languageScore,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        summaryMd: evaluation.summaryMd,
        questionReviews: evaluation.questionReviewsJson as any,
        learningRecommendations: evaluation.recommendationsJson as any,
      },
    };
  }

  /**
   * Fetch Question Pool matching interview configuration (Phần 3.1 - 3.4)
   */
  async selectQuestionsForSession(config: InterviewSetupConfig, userId: string): Promise<InterviewQuestionItem[]> {
    const { industryCode, languageId = 'en', questionSource = 'CURATED', questionMode = 'SEQUENTIAL' } = config;

    let dbQuestions = await this.prisma.interviewQuestion.findMany({
      where: {
        industryCode,
        language: languageId,
        isApproved: true,
        OR: [
          { source: 'CURATED' },
          { source: 'COMMUNITY' },
          { source: 'PRIVATE', ownerId: userId },
        ],
      },
      take: 15,
    });

    // If no questions in DB yet, return curated fallback questions
    if (dbQuestions.length === 0) {
      return this.getCuratedFallbackQuestions(industryCode, languageId);
    }

    if (questionMode === 'RANDOM') {
      dbQuestions = dbQuestions.sort(() => Math.random() - 0.5);
    }

    return dbQuestions.map((q) => ({
      id: q.id,
      title: q.title,
      body: q.body,
      suggestedAnswer: q.suggestedAnswer || undefined,
      difficulty: q.difficulty,
      seniority: q.seniority,
      interviewType: q.interviewType,
      competencyTags: q.competencyTags,
      language: q.language,
      source: q.source as any,
    }));
  }

  private async evaluateTurnWithAI(
    session: any,
    questionText: string,
    answerText: string,
    knowledgeContext: string,
    isFollowUp: boolean
  ) {
    const prompt = `You are a professional Interviewer for ${session.positionTitle} (${session.seniorityLevel}).
Language: ${session.languageId}
Question: "${questionText}"
Candidate Answer: "${answerText}"
Reference Knowledge:
${knowledgeContext}

Analyze the candidate's answer:
1. Is it complete? Does it lack critical evidence, technical diagnosis, or metrics?
2. If incomplete and isFollowUp is false, propose ONE sharp, natural follow-up question.
3. If complete or already a follow-up, do not follow up.

Return JSON strictly:
{
  "completenessScore": 75,
  "shouldFollowUp": true,
  "followUpQuestion": "Which specific optimization techniques did you apply, and how did you measure latency?",
  "feedbackMessage": "Good initial overview, but lacked quantifiable metrics.",
  "missingDimensions": ["Quantifiable metrics", "Specific tools"]
}`;

    const res = await this.aiService.pipelineQuery(session.userId, prompt);
    try {
      const match = ((res as any).reply || (res as any).response || '').match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch {}

    return {
      completenessScore: 70,
      shouldFollowUp: !isFollowUp && answerText.split(' ').length < 25,
      followUpQuestion: !isFollowUp ? `Could you elaborate on the specific actions you took in that situation?` : null,
      feedbackMessage: 'Clear start, but could provide more details.',
      missingDimensions: [],
    };
  }

  private getCuratedFallbackQuestions(industryCode: string, lang: string): InterviewQuestionItem[] {
    const questionsByIndustry: Record<string, Array<{ title: string; body: string; competencies: string[] }>> = {
      TECH: [
        {
          title: 'Introduction & Background',
          body: 'Could you introduce yourself, your technical background, and a significant production system you recently engineered?',
          competencies: ['Communication', 'Architecture', 'Overview'],
        },
        {
          title: 'Performance Optimization & Troubleshooting',
          body: 'Describe a challenging performance bottleneck you diagnosed in production. What tools did you use and what was the measurable outcome?',
          competencies: ['Problem Solving', 'Technical Diagnosis', 'Metrics'],
        },
        {
          title: 'State Architecture & API Integration',
          body: 'How do you design scalable client-server state synchronization while handling network latency, offline states, and error retries?',
          competencies: ['System Design', 'Reliability', 'API Design'],
        },
        {
          title: 'Engineering Tradeoffs & Code Quality',
          body: 'Tell me about a time you had to balance rapid feature delivery against technical debt. How did you negotiate tradeoffs with stakeholders?',
          competencies: ['Decision Making', 'Communication', 'Pragmatism'],
        },
      ],
      BIZ: [
        {
          title: 'Strategic Prioritization',
          body: 'How do you prioritize competing business features when multiple key stakeholders have opposing high-priority demands?',
          competencies: ['Stakeholder Management', 'Prioritization', 'Leadership'],
        },
        {
          title: 'Data-Driven Decision Making',
          body: 'Can you share an example where qualitative customer feedback contradicted your quantitative analytics? How did you resolve it?',
          competencies: ['Data Analysis', 'Critical Thinking', 'Discovery'],
        },
      ],
      FIN: [
        {
          title: 'Financial Modeling & Forecasting',
          body: 'Walk me through how you build a 3-statement financial model and account for working capital fluctuations.',
          competencies: ['Financial Modeling', 'Accounting', 'Attention to Detail'],
        },
      ],
    };

    const list = questionsByIndustry[industryCode] || questionsByIndustry.TECH;
    return list.map((q, idx) => ({
      id: `curated-${industryCode}-${idx + 1}`,
      title: q.title,
      body: q.body,
      difficulty: 3.0,
      seniority: 'Mid-level',
      interviewType: 'General Professional',
      competencyTags: q.competencies,
      language: lang,
      source: 'CURATED',
    }));
  }
}
