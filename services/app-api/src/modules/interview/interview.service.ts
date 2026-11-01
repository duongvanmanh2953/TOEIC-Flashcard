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
  InterviewLanguageContext,
  TranslationPurpose,
  TranslationResponse,
  buildInterviewLanguageContext,
  MULTILINGUAL_CURATED_QUESTIONS,
  wrapAsUntrustedContext,
  InterviewActivity,
} from './interview.shared';
import { InterviewAnalyzerService } from './interview-analyzer.service';
import { InterviewLearningService } from './interview-learning.service';

@Injectable()
export class InterviewService {
  private readonly logger = new Logger(InterviewService.name);
  private readonly hintCache = new Map<string, { turnNumber: number; level: number; hint: string; translationVi: string }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
    private readonly taxonomyService: InterviewTaxonomyService,
    private readonly ragService: InterviewRagService,
    private readonly billingService: InterviewBillingService,
    private readonly analyzerService: InterviewAnalyzerService,
    private readonly learningService: InterviewLearningService,
  ) {}

  /**
   * Build or fetch validated language context for a session
   */
  getLanguageContext(config: Partial<InterviewSetupConfig>): InterviewLanguageContext {
    return buildInterviewLanguageContext(
      config.languageId || 'en',
      config.supportLanguageId || 'vi',
      'vi'
    );
  }

  /**
   * Generates authentic, role-specific opening script matching interview language,
   * seniority, and interview style (Phần 5.3)
   */
  async getOpeningScript(params: {
    industryCode: string;
    positionCode?: string;
    positionTitle: string;
    seniorityLevel: string;
    interviewType: string;
    languageId: string;
    interviewerStyle?: string;
  }): Promise<{ scriptText: string; languageId: string }> {
    const lang = (params.languageId || 'en').toLowerCase().split(/[-_]/)[0];
    const pos = params.positionTitle || 'Candidate';
    const seniority = params.seniorityLevel || 'Professional';

    // Tailored scripts per language to guarantee instant, natural opening
    if (lang === 'ja') {
      return {
        scriptText: `本日はお時間をいただきありがとうございます。${pos}（${seniority}）の面接を担当いたしますAI面接官です。本日はこれまでの実務経験や専門スキル、そして実際の業務における課題解決アプローチについて詳しくお伺いしていきます。準備が整いましたら、最初のご質問に進みましょう。`,
        languageId: 'ja',
      };
    }

    if (lang === 'ko') {
      return {
        scriptText: `안녕하세요. 오늘 ${pos} (${seniority}) 포지션 면접을 진행하게 된 AI 인터뷰어입니다. 귀하의 전문 실무 경험과 역량, 그리고 실제 현업 문제 해결 과정을 심도 있게 나누고자 합니다. 준비되셨다면 편안한 마음으로 시작해 주세요.`,
        languageId: 'ko',
      };
    }

    if (lang === 'zh') {
      return {
        scriptText: `您好！欢迎参加本次 ${pos}（${seniority}）的专业模拟面试。我是您的AI面试官。今天我们将重点探讨您的实战项目经验、专业技术深度以及在实际业务中应对挑战的解决思路。准备好后，我们即可开始第一道问题。`,
        languageId: 'zh',
      };
    }

    if (lang === 'vi') {
      return {
        scriptText: `Chào mừng bạn đến với buổi phỏng vấn vị trí ${pos} (${seniority}). Tôi là người phỏng vấn AI của bạn. Hôm nay chúng ta sẽ cùng trao đổi về kinh nghiệm chuyên môn, kỹ năng cốt lõi và cách bạn tiếp cận các bài toán thực tế trong công việc. Khi đã sẵn sàng, chúng ta sẽ bắt đầu với câu hỏi đầu tiên.`,
        languageId: 'vi',
      };
    }

    // Default English
    return {
      scriptText: `Welcome to your ${pos} (${seniority}) interview session. I am your AI interviewer today. We will explore your hands-on experience, core domain competencies, architectural decisions, and how you resolve challenging real-world problems. Whenever you are ready, let's begin with our first question.`,
      languageId: 'en',
    };
  }

  /**
   * Initialize a new AI Interview Session (Phần 2.6 & 10.1)
   * Enforces fail-closed Pro entitlement guard before session creation.
   */
  async createSession(userId: string, config: InterviewSetupConfig) {
    // 1. Entitlement check (Fail-closed: strictly throws ForbiddenException if user is not Pro)
    await this.billingService.ensureProEntitlement(userId);

    // 2. Build canonical Language Context
    const langContext = this.getLanguageContext(config);

    // 3. Select initial question pool based on mode & source
    const questions = await this.selectQuestionsForSession(config, userId);
    if (questions.length === 0) {
      throw new BadRequestException('Không tìm thấy bộ câu hỏi phù hợp cho ngành nghề và vị trí này.');
    }

    // 4. Create Session in database
    const session = await this.prisma.interviewSession.create({
      data: {
        userId,
        languageId: langContext.interviewLanguage,
        supportLanguageId: langContext.supportLanguage,
        industryCode: config.industryCode,
        positionTitle: config.positionTitle,
        seniorityLevel: config.seniorityLevel || 'Mid-level',
        interviewType: config.interviewType || 'General Professional',
        mode: config.mode || 'REALISTIC',
        questionMode: config.questionMode || 'SEQUENTIAL',
        interviewerStyle: config.interviewerStyle || 'PROFESSIONAL',
        durationMinutes: config.durationMinutes || 20,
        status: 'IN_PROGRESS',
        jobBriefJson: (config.jobBrief as any) || null,
        blueprintJson: (config.blueprint as any) || null,
        currentActivity: 'speaking',
        startedAt: new Date(),
      },
    });

    // 5. Reserve session credits with idempotency
    try {
      const idempotencyKey = `session_res_${userId}_${session.id}`;
      await this.billingService.reserveSessionCredits(userId, session.id, idempotencyKey);
    } catch (billingErr) {
      this.logger.warn(`Could not reserve credits for session ${session.id}: ${billingErr}`);
    }

    // 6. Create first turn with Question 1
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
      languageContext: langContext,
      currentTurn: {
        turnNumber: 1,
        questionText: firstTurn.questionText,
        questionId: firstTurn.questionId,
        totalQuestions: questions.length,
      },
    };
  }

  /**
   * Candidate submits answer (text or voice transcript) (Phần 4.2 - 4.4 & 7.1 - 7.3)
   * Supports Translation-Aware Evaluation: candidate who spoke in support language
   * has their answer translated for domain evaluation while preserving original transcript.
   */
  async submitTurnAnswer(
    userId: string,
    sessionId: string,
    turnNumber: number,
    candidateAnswer: string,
    durationSec: number = 0,
    options?: {
      isTranslated?: boolean;
      detectedSourceLanguage?: string;
      originalTranscript?: string;
    }
  ) {
    // 1. Entitlement verification
    await this.billingService.ensureProEntitlement(userId);

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

    // 1. Update activity: analyzing
    await this.prisma.interviewSession.update({
      where: { id: sessionId },
      data: { currentActivity: 'analyzing' },
    });

    // 2. RAG Context Retrieval for grounded evaluation (selective, only if needed)
    let knowledgeContext = '';
    try {
      const relevantChunks = await this.ragService.retrieveRelevantKnowledge({
        industryCode: session.industryCode,
        languageCode: session.languageId,
        queryText: `${currentTurn.questionText} ${cleanAnswer}`,
        requesterUserId: userId,
        limit: 2,
      });
      if (relevantChunks.length > 0) {
        knowledgeContext = relevantChunks.map((c) => c.content).join('\n---\n');
      }
    } catch (ragErr) {
      this.logger.warn(`RAG retrieval warning: ${ragErr}`);
    }

    // 3. Consolidated Single-Pass Turn Orchestrator (Task 4)
    const recentTurnsSummary = session.turns
      .filter((t) => t.candidateAnswer)
      .slice(-3)
      .map((t) => `Q: ${t.questionText} | A: ${t.candidateAnswer}`)
      .join('\n');

    const orchestratorRes = await this.analyzerService.orchestrateTurn({
      userId,
      sessionId,
      turnNumber,
      currentQuestionText: currentTurn.questionText,
      candidateAnswer: cleanAnswer,
      isFollowUp: currentTurn.isFollowUp,
      interviewLanguage: session.languageId,
      supportLanguage: session.supportLanguageId,
      jobTitle: session.positionTitle,
      seniority: session.seniorityLevel,
      recentTurnsSummary,
      knowledgeContext,
      blueprint: session.blueprintJson as any,
    });

    // 4. Record learning memory evidence (Task 7)
    await this.learningService.recordTurnEvidence(
      userId,
      sessionId,
      turnNumber,
      {
        demonstratedCompetencies: orchestratorRes.contentAssessment.demonstratedCompetencies,
        missingEvidence: orchestratorRes.contentAssessment.missingEvidence,
        technicalScore: orchestratorRes.contentAssessment.technicalAccuracyScore,
      },
      session.jobBriefJson as any
    );

    const isTranslatedAnswer = orchestratorRes.answerType === 'translated' || Boolean(options?.isTranslated);

    // 5. Update current turn with candidate answer & analysis
    await this.prisma.interviewTurn.update({
      where: { id: currentTurn.id },
      data: {
        candidateAnswer: cleanAnswer,
        durationSec,
        analysisJson: {
          ...orchestratorRes.contentAssessment,
          isTranslatedAnswer,
          originalTranscript: options?.originalTranscript || cleanAnswer,
          normalizedAnswer: orchestratorRes.normalizedAnswer,
          detectedSourceLanguage: orchestratorRes.detectedLanguage || (isTranslatedAnswer ? session.supportLanguageId : session.languageId),
          feedbackForUser: orchestratorRes.feedbackForUser,
          tokenUsage: orchestratorRes.tokenUsage,
        } as any,
      },
    });

    // Update session metrics
    const currentMetrics = (session.metricsJson as any) || {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCachedTokens: 0,
      totalCostUsd: 0,
      totalRequests: 0,
      turnLatenciesMs: [],
    };
    if (orchestratorRes.tokenUsage) {
      currentMetrics.totalInputTokens += orchestratorRes.tokenUsage.inputTokens || 0;
      currentMetrics.totalOutputTokens += orchestratorRes.tokenUsage.outputTokens || 0;
      currentMetrics.totalCachedTokens += orchestratorRes.tokenUsage.cachedInputTokens || 0;
      currentMetrics.totalCostUsd += orchestratorRes.tokenUsage.estimatedCostUsd || 0;
      currentMetrics.totalRequests += 1;
    }

    // 6. Follow-up decision:
    if (orchestratorRes.decision === 'ask_followup' && !currentTurn.isFollowUp && orchestratorRes.followUpQuestion) {
      const nextTurnNumber = turnNumber + 1;
      const followUpTurn = await this.prisma.interviewTurn.create({
        data: {
          sessionId: session.id,
          turnNumber: nextTurnNumber,
          questionText: orchestratorRes.followUpQuestion,
          isFollowUp: true,
          followUpParentId: currentTurn.id,
          hintLevelUsed: 0,
        },
      });

      await this.prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
          currentActivity: 'speaking',
          metricsJson: currentMetrics as any,
        },
      });

      return {
        isSessionCompleted: false,
        evaluation: session.mode === 'COACH' ? orchestratorRes.contentAssessment : undefined,
        feedbackForUser: orchestratorRes.feedbackForUser,
        nextTurn: {
          turnNumber: nextTurnNumber,
          questionText: followUpTurn.questionText,
          isFollowUp: true,
          followUpParentQuestion: currentTurn.questionText,
        },
        tokenUsage: orchestratorRes.tokenUsage,
      };
    }

    // 7. Otherwise, advance to next main question or finish session
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

    // Finish session if target questions reached (4-5 main questions) or max turn limit hit
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

    await this.prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        currentActivity: 'speaking',
        metricsJson: currentMetrics as any,
      },
    });

    return {
      isSessionCompleted: false,
      evaluation: session.mode === 'COACH' ? orchestratorRes.contentAssessment : undefined,
      feedbackForUser: orchestratorRes.feedbackForUser,
      nextTurn: {
        turnNumber: nextTurnNumber,
        questionText: nextTurn.questionText,
        questionId: nextTurn.questionId,
        isFollowUp: false,
        totalQuestions: Math.min(5, allQuestions.length),
      },
      tokenUsage: orchestratorRes.tokenUsage,
    };
  }

  /**
   * Request multi-level hints (Keywords -> Structure -> Sample Answer) (Phần 8.1)
   */
  async requestHint(userId: string, sessionId: string, turnNumber: number, hintLevel: 1 | 2 | 3) {
    await this.billingService.ensureProEntitlement(userId);

    const cacheKey = `${sessionId}_${turnNumber}_${hintLevel}`;
    if (this.hintCache.has(cacheKey)) {
      return this.hintCache.get(cacheKey)!;
    }

    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: { turns: true },
    });

    if (!session || session.userId !== userId) throw new NotFoundException('Session not found');
    const turn = session.turns.find((t) => t.turnNumber === turnNumber);
    if (!turn) throw new NotFoundException('Turn not found');

    await this.prisma.interviewTurn.update({
      where: { id: turn.id },
      data: {
        hintLevelUsed: Math.max(turn.hintLevelUsed, hintLevel),
        usedSampleAnswer: hintLevel === 3 ? true : turn.usedSampleAnswer,
      },
    });

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

    const result = {
      turnNumber,
      level: hintLevel,
      hint: parsedHint?.content || 'Focus on concrete actions, measurable results, and technical tools.',
      translationVi: parsedHint?.contentVi || 'Hãy tập trung vào hành động cụ thể, kết quả đo lường được và công cụ kỹ thuật.',
    };
    this.hintCache.set(cacheKey, result);
    return result;
  }

  /**
   * Centralized, multi-purpose Translation Service (Phần 3.1 - 3.4)
   * Explicit sourceLanguage, targetLanguage, purpose, and term preservation.
   */
  async translateContent(
    userId: string,
    text: string,
    targetLang: string = 'vi',
    sourceLang?: string,
    purpose: TranslationPurpose = 'question',
    industryCode?: string
  ): Promise<TranslationResponse> {
    const cleanText = (text || '').trim();
    if (!cleanText) {
      return {
        originalText: '',
        translatedText: '',
        sourceLanguage: sourceLang || 'auto',
        targetLanguage: targetLang,
        purpose,
      };
    }

    const normSource = (sourceLang || 'en').toLowerCase().split(/[-_]/)[0];
    const normTarget = (targetLang || 'vi').toLowerCase().split(/[-_]/)[0];

    // If source and target are identical, return immediately without wasting LLM call
    if (normSource === normTarget) {
      return {
        originalText: cleanText,
        translatedText: cleanText,
        sourceLanguage: normSource,
        targetLanguage: normTarget,
        purpose,
        isCached: true,
      };
    }

    const purposeDescriptions: Record<TranslationPurpose, string> = {
      question: 'Dịch câu hỏi phỏng vấn để ứng viên hiểu đúng yêu cầu chuyên môn',
      answer: 'Chuẩn hóa câu trả lời của ứng viên sang ngôn ngữ phỏng vấn phục vụ đánh giá năng lực',
      hint: 'Dịch gợi ý trả lời chuyên sâu',
      sample_answer: 'Dịch câu trả lời mẫu tham khảo',
      feedback: 'Dịch nhận xét đánh giá của người phỏng vấn',
      explanation: 'Giải thích thuật ngữ hoặc ngữ cảnh phỏng vấn',
    };

    const prompt = `Bạn là chuyên gia dịch thuật song ngữ phỏng vấn tuyển dụng chuyên nghiệp.
Nhiệm vụ: ${purposeDescriptions[purpose] || 'Dịch văn bản phỏng vấn'}
Từ ngôn ngữ: ${normSource}
Sang ngôn ngữ: ${normTarget === 'vi' ? 'tiếng Việt' : normTarget}

NGUYÊN TẮC BẮT BUỘC:
1. Dịch đúng chiều từ ${normSource} sang ${normTarget}.
2. Giữ nguyên ngữ cảnh công việc và thuật ngữ chuyên ngành (e.g. Redis, React, PMS, STAR, SLA, P&L, ROAS, KPI).
3. Không thêm lời chào, không thêm markdown (###), không thêm lời giải thích cá nhân.
4. Xuất ra bản dịch thuần túy không bao bọc bởi dấu ngoặc kép.

Văn bản cần dịch:
"""${cleanText}"""`;

    const aiPromise = this.aiService.pipelineQuery(userId, prompt);
    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 6000));
    const res: any = await Promise.race([aiPromise, timeoutPromise]);
    let replyText = (res as any)?.reply || (res as any)?.response || '';

    // Sanitize any residual conversational headers or markdown artifacts
    if (replyText.includes('###') || replyText.includes('Chào ') || replyText.includes('Dịch:')) {
      const validLines = replyText
        .split('\n')
        .map((l: string) => l.trim())
        .filter((l: string) => l && !l.startsWith('###') && !l.includes('Chào ') && !l.startsWith('Dịch:'));
      if (validLines.length > 0) {
        replyText = validLines[validLines.length - 1];
      }
    }

    replyText = replyText.replace(/^[*\#\-\d.\s"':]+|["']$/g, '').trim();

    return {
      originalText: cleanText,
      translatedText: replyText || cleanText,
      sourceLanguage: normSource,
      targetLanguage: normTarget,
      purpose,
    };
  }

  /**
   * Finish session and generate comprehensive post-interview report (Phần 8.1 - 8.6)
   * Separates 4 distinct scoring clusters: Professional Competency, Communication,
   * Language Proficiency (translation-aware), and Interview Performance.
   */
  async finishSession(userId: string, sessionId: string) {
    await this.billingService.ensureProEntitlement(userId);

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

    // 2. Inspect if any candidate turns were translated from support language
    let hasTranslatedAnswer = false;
    const answeredTurns = session.turns.filter((t) => t.candidateAnswer);

    for (const t of answeredTurns) {
      const analysis = t.analysisJson as any;
      if (analysis?.isTranslatedAnswer) {
        hasTranslatedAnswer = true;
        break;
      }
    }

    // 3. Prepare structured transcript for multi-dimensional AI assessment
    const turnsSummary = answeredTurns
      .map((t) => {
        const analysis = t.analysisJson as any;
        return `Turn ${t.turnNumber} (${t.isFollowUp ? 'Follow-up' : 'Main'}):
Question: ${t.questionText}
Candidate Answer: ${t.candidateAnswer}
Was Translated: ${analysis?.isTranslatedAnswer ? 'YES (Original speech was in support language)' : 'NO (Direct speech in interview language)'}
Hint Level Used: ${t.hintLevelUsed}`;
      })
      .join('\n\n');

    const prompt = `You are a Senior Technical Hiring Director and International Interview Auditor.
Analyze this completed interview session:
Position: ${session.positionTitle} (${session.seniorityLevel})
Industry: ${session.industryCode}
Interview Language: ${session.languageId}
Support Language: ${session.supportLanguageId}
Candidate used translation on some turns: ${hasTranslatedAnswer ? 'YES' : 'NO'}

Transcript:
${turnsSummary || 'No responses recorded.'}

SCORING CRITERIA (4 DISTINCT CLUSTERS, 0-100 each):
1. professionalCompetency: Depth of domain knowledge, system decisions, technical accuracy.
2. communication: Structure, clarity, conciseness, ability to articulate ideas.
3. languageProficiency: Grammar, vocabulary, natural phrasing in ${session.languageId}. NOTE: If candidate used translation, languageProficiency must reflect direct responses only or note that speech was translated.
4. interviewPerformance: Relevance to questions, STAR evidence, quantified impact.

Output strictly valid JSON with this structure:
{
  "overallScore": 82,
  "competencyScore": 85,
  "communicationScore": 80,
  "languageScore": ${hasTranslatedAnswer ? 65 : 82},
  "performanceScore": 84,
  "strengths": ["Clear architectural breakdown", "Structured STAR delivery"],
  "weaknesses": ["Could provide more quantifiable latency metrics"],
  "summaryMd": "Detailed professional evaluation in Markdown with actionable insights.",
  "questionReviews": [
    {
      "turnNumber": 1,
      "question": "question text",
      "questionTranslation": "bản dịch câu hỏi",
      "candidateAnswer": "answer text",
      "score": 85,
      "feedback": "detailed critique",
      "rubricEvaluation": {
        "completeness": 4,
        "technicalDepth": 4,
        "communicationClarity": 4,
        "evidenceMetrics": 3
      },
      "suggestedAnswer": "exemplary reference answer demonstrating ideal response",
      "translationVi": "bản dịch tiếng Việt của câu trả lời tham khảo",
      "practiceTips": ["Practice quantifying outcomes with metrics"]
    }
  ],
  "learningRecommendations": [
    {
      "domain": "TECHNICAL",
      "title": "${session.positionTitle} Core Architecture",
      "reason": "Deepen practical trade-off analysis.",
      "targetUrl": "/vocabulary"
    },
    {
      "domain": "VOCABULARY",
      "title": "Interview Metric Verbs & STAR Phrases",
      "reason": "Enhance precision when describing results.",
      "targetUrl": "/vocabulary"
    }
  ]
}`;

    const aiPromise = this.aiService.pipelineQuery(userId, prompt);
    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 10000));
    const aiRes: any = await Promise.race([aiPromise, timeoutPromise]);
    let parsed: any = null;
    try {
      if (aiRes) {
        const match = ((aiRes as any).reply || (aiRes as any).response || '').match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
      }
    } catch {}

    const competencyScore = parsed?.competencyScore || 78;
    const communicationScore = parsed?.communicationScore || 75;
    const languageScore = parsed?.languageScore || (hasTranslatedAnswer ? 65 : 72);
    const performanceScore = parsed?.performanceScore || 76;
    const overallScore =
      parsed?.overallScore ||
      Math.round(competencyScore * 0.35 + communicationScore * 0.25 + languageScore * 0.2 + performanceScore * 0.2);

    // 4. Save Evaluation record
    const evaluation = await this.prisma.interviewEvaluation.create({
      data: {
        sessionId: session.id,
        overallScore,
        competencyScore,
        languageScore,
        strengths: parsed?.strengths || ['Professional demeanor', 'Relevant core concepts mentioned'],
        weaknesses: parsed?.weaknesses || ['Include more quantifiable metrics and structured STAR examples'],
        summaryMd:
          parsed?.summaryMd ||
          `Ứng viên thể hiện kiến thức nền tảng tốt cho vị trí **${session.positionTitle}**, cần rèn luyện thêm cách diễn đạt theo cấu trúc STAR và số liệu thực tế.`,
        recommendationsJson: parsed?.learningRecommendations || [],
        questionReviewsJson: parsed?.questionReviews || [],
      },
    });

    // 5. Update session status & activity
    await this.prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        currentActivity: 'completed',
        score: overallScore,
        endedAt: new Date(),
      },
    });

    // 6. Finalize learning profile (Task 7)
    try {
      await this.learningService.finalizeSessionLearning(userId, session, evaluation);
    } catch (e) {
      this.logger.warn(`Failed to finalize learning memory: ${e}`);
    }

    return {
      isSessionCompleted: true,
      report: {
        sessionId: session.id,
        overallScore,
        competencyScore,
        communicationScore,
        languageScore,
        performanceScore,
        isAnyAnswerTranslated: hasTranslatedAnswer,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        summaryMd: evaluation.summaryMd,
        questionReviews: evaluation.questionReviewsJson as any,
        learningRecommendations: evaluation.recommendationsJson as any,
      },
    };
  }

  async updateSessionActivity(sessionId: string, activity: InterviewActivity) {
    return this.prisma.interviewSession.update({
      where: { id: sessionId },
      data: { currentActivity: activity },
    });
  }

  async getSessionActivity(sessionId: string) {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id: sessionId },
      select: { currentActivity: true, id: true, status: true },
    });
    return session || { currentActivity: 'idle', status: 'READY' };
  }

  /**
   * Question Pool Selection with Multilingual Role Competency Mapping (Phần 6)
   */
  async selectQuestionsForSession(config: InterviewSetupConfig, userId: string): Promise<InterviewQuestionItem[]> {
    const { industryCode, languageId = 'en', questionSource = 'CURATED', questionMode = 'SEQUENTIAL' } = config;
    const normLang = (languageId || 'en').toLowerCase().split(/[-_]/)[0];

    let dbQuestions = await this.prisma.interviewQuestion.findMany({
      where: {
        industryCode,
        language: normLang,
        isApproved: true,
        OR: [
          { source: 'CURATED' },
          { source: 'COMMUNITY' },
          { source: 'PRIVATE', ownerId: userId },
        ],
      },
      take: 15,
    });

    if (dbQuestions.length === 0) {
      return this.getCuratedFallbackQuestions(industryCode, normLang);
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

  /**
   * Adaptive AI Turn Evaluation with Translation-Aware Context (Phần 7.1 - 7.3 & 8.3)
   */
  private async evaluateTurnWithAI(
    session: any,
    questionText: string,
    answerText: string,
    knowledgeContext: string,
    isFollowUp: boolean,
    isTranslatedAnswer: boolean
  ) {
    const prompt = `You are a Senior Interviewer for ${session.positionTitle} (${session.seniorityLevel}).
Industry: ${session.industryCode}
Interview Language: ${session.languageId}
Question: "${questionText}"
Candidate Answer: "${answerText}"
Was Translated from Support Language: ${isTranslatedAnswer ? 'YES' : 'NO'}

Reference Knowledge:
${knowledgeContext}

Analyze the candidate's answer:
1. Is it complete? Does it address the question with solid evidence or technical steps?
2. If incomplete and this is NOT a follow-up, propose ONE sharp, natural follow-up question in ${session.languageId}.
3. If complete or already a follow-up, set shouldFollowUp to false.

Return JSON strictly:
{
  "completenessScore": 75,
  "shouldFollowUp": true,
  "followUpQuestion": "Which specific tools did you use and what were the measured results?",
  "feedbackMessage": "Good initial direction, but lacks quantifiable metrics.",
  "missingDimensions": ["Quantifiable metrics", "Implementation tools"]
}`;

    const aiPromise = this.aiService.pipelineQuery(session.userId, prompt);
    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 7000));
    const res: any = await Promise.race([aiPromise, timeoutPromise]);
    try {
      if (res) {
        const match = ((res as any).reply || (res as any).response || '').match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]);
      }
    } catch {}

    const isShort = answerText.split(/\s+/).length < 20;
    return {
      completenessScore: isShort ? 60 : 75,
      shouldFollowUp: !isFollowUp && isShort,
      followUpQuestion:
        !isFollowUp && isShort
          ? session.languageId === 'ja'
            ? '具体的にどのような手法を用い、どのような結果が得られたか詳しく教えていただけますか？'
            : session.languageId === 'ko'
            ? '구체적으로 어떤 기술적 조치를 취하셨고 어떤 결과를 얻으셨는지 자세히 말씀해 주시겠습니까?'
            : session.languageId === 'zh'
            ? '能否请您详细说明一下您具体采取了哪些措施，以及取得了怎样的成效？'
            : 'Could you elaborate on the specific actions you took and the measurable results you achieved?'
          : null,
      feedbackMessage: 'Clear foundation, could be strengthened with concrete metrics and tools.',
      missingDimensions: isShort ? ['Specific actions', 'Quantified results'] : [],
    };
  }

  /**
   * Curated Fallback Matrix covering TECH, HOSP, BIZ, FIN, MKT, EDU across EN, JA, KO, ZH
   */
  private getCuratedFallbackQuestions(industryCode: string, lang: string): InterviewQuestionItem[] {
    const industryData = MULTILINGUAL_CURATED_QUESTIONS[industryCode] || MULTILINGUAL_CURATED_QUESTIONS.TECH;
    const questionsForLang = industryData[lang] || industryData.en || [];

    return questionsForLang.map((q, idx) => ({
      id: `curated-${industryCode}-${lang}-${idx + 1}`,
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
