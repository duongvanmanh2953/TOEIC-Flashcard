import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { AIService } from '../ai/ai.service';
import { InterviewRagService } from './interview-rag.service';
import {
  ExtractedJobRequirements,
  ExtractedSkillItem,
  InterviewJobBrief,
  InterviewBlueprint,
  InterviewTurnOrchestratorResult,
  normalizeSkillName,
  sanitizeCandidateText,
  UserInterviewLearningProfileDto,
} from './interview.shared';

@Injectable()
export class InterviewAnalyzerService {
  private readonly logger = new Logger(InterviewAnalyzerService.name);

  constructor(
    private readonly aiService: AIService,
    private readonly ragService: InterviewRagService,
  ) {}

  /**
   * TASK 2 – Job Description Extraction & Skill Matrix Normalization
   * Single-pass structured extraction of all required skill groups.
   */
  async analyzeJobDescription(
    userId: string,
    rawText: string,
    industryCode: string = 'TECH',
    positionTitle?: string
  ): Promise<ExtractedJobRequirements> {
    const cleanText = sanitizeCandidateText(rawText);
    if (!cleanText || cleanText.trim().length < 20) {
      throw new BadRequestException('Mô tả công việc (JD) quá ngắn hoặc không chứa nội dung hợp lệ.');
    }

    // Static system prompt for OpenAI Prompt Caching efficiency
    const systemPrompt = `You are an elite Technical Recruiter and Staff Engineering Hiring Committee member.
Your task is to analyze a Job Description (JD) and extract an exhaustive, structured competency matrix.

EXTRACTION RULES:
1. Distinguish strictly between "required" (must-have) and "preferred" (nice-to-have/bonus/preferred).
2. Never mark a skill as "required" unless the JD explicitly states it is required, mandatory, or essential.
3. Categorize each skill accurately: "Programming Language", "Framework", "Database", "DevOps & Cloud", "Core Knowledge", "Soft Skills", "Business Domain", or "Tooling".
4. Assign an importance score (1 to 5) and confidence score (0.0 to 1.0).
5. Output strictly valid JSON matching the schema with no conversational fluff or markdown fences.`;

    const userPrompt = `Target Position: ${positionTitle || 'Software Engineer'} (Industry: ${industryCode})
Job Description Content:
"""${cleanText.slice(0, 8000)}"""

Return JSON format:
{
  "jobInformation": {
    "jobTitle": "Extracted Title",
    "industry": "${industryCode}",
    "department": "Engineering/Operations",
    "seniority": "Junior / Mid-level / Senior / Lead",
    "experienceRequired": "e.g. 2+ years",
    "employmentType": "Full-time",
    "mainResponsibilities": ["Responsibility 1", "Responsibility 2"],
    "keyObjectives": ["Objective 1"]
  },
  "skills": [
    {
      "name": "Skill Name",
      "category": "Framework",
      "priority": "required",
      "requirementType": "required",
      "source": "job_description",
      "confidence": 0.95,
      "importance": 5,
      "includeInInterview": true
    }
  ],
  "frameworksAndTools": ["React", "Git", "Docker"],
  "coreKnowledge": ["Web Performance", "State Management"],
  "softSkills": ["Team Communication", "Problem Solving"],
  "businessDomain": ["Fintech", "E-commerce"],
  "languageRequirements": {
    "requiredLanguage": "English",
    "expectedProficiency": "Professional working proficiency",
    "communicationRequirements": "Daily standups and technical documentation"
  },
  "preferredQualifications": ["Experience with GraphQL", "AWS certification"]
}`;

    const startTime = Date.now();
    const result = await this.aiService.executeSmartLLM(userPrompt, {
      systemPrompt,
      jsonMode: true,
      temperature: 0.2,
    });
    const latencyMs = Date.now() - startTime;
    this.logger.log(`JD Analysis completed in ${latencyMs}ms with provider: ${result?.provider || 'none'}`);

    let parsed: any = null;
    if (result?.text) {
      try {
        const match = result.text.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
      } catch (err: any) {
        this.logger.warn(`Failed to parse AI JD extraction JSON: ${err.message}`);
      }
    }

    if (!parsed || !parsed.skills || !Array.isArray(parsed.skills)) {
      parsed = this.buildHeuristicFallbackExtraction(cleanText, industryCode, positionTitle);
    }

    // Skill Normalization & Deduplication (Task 2.6)
    const normalizedSkills = this.normalizeSkillList(parsed.skills || []);

    return {
      jobInformation: {
        jobTitle: parsed.jobInformation?.jobTitle || positionTitle || 'Professional Role',
        industry: parsed.jobInformation?.industry || industryCode,
        department: parsed.jobInformation?.department,
        seniority: parsed.jobInformation?.seniority || 'Mid-level',
        experienceRequired: parsed.jobInformation?.experienceRequired || '1-3 years',
        employmentType: parsed.jobInformation?.employmentType || 'Full-time',
        mainResponsibilities: parsed.jobInformation?.mainResponsibilities || [],
        keyObjectives: parsed.jobInformation?.keyObjectives || [],
      },
      skills: normalizedSkills,
      frameworksAndTools: parsed.frameworksAndTools || [],
      coreKnowledge: parsed.coreKnowledge || [],
      softSkills: parsed.softSkills || [],
      businessDomain: parsed.businessDomain || [],
      languageRequirements: parsed.languageRequirements || {
        requiredLanguage: 'English',
        expectedProficiency: 'Professional',
      },
      preferredQualifications: parsed.preferredQualifications || [],
    };
  }

  /**
   * TASK 3 – AI Interview Blueprint Generation
   * Generates a tailored interview plan based on confirmed Job Brief and candidate progress.
   */
  async generateBlueprint(
    userId: string,
    jobBrief: InterviewJobBrief,
    durationMinutes: number = 20,
    seniority: string = 'Mid-level',
    learningProfile?: UserInterviewLearningProfileDto | null
  ): Promise<InterviewBlueprint> {
    // 1. Calculate question budget based on duration:
    // 15 mins -> 3-4 questions, 20 mins -> 4-5 questions, 30 mins -> 6-7 questions
    const questionBudget = durationMinutes <= 15 ? 4 : durationMinutes <= 20 ? 5 : 7;

    const requiredSkills = (jobBrief.requiredSkills || []).filter((s) => s.includeInInterview);
    const preferredSkills = (jobBrief.preferredSkills || []).filter((s) => s.includeInInterview);
    const userAddedSkills = (jobBrief.userAddedSkills || []).filter((s) => s.includeInInterview);

    // Filter competencies from prior learning memory (Task 7.3)
    const priorDemonstrated = new Set<string>();
    const priorNeedsPractice = new Set<string>();
    if (learningProfile?.skills) {
      for (const rec of learningProfile.skills) {
        if (rec.status === 'demonstrated' || rec.status === 'strong') {
          priorDemonstrated.add(rec.name.toLowerCase());
        } else if (rec.status === 'emerging' || rec.status === 'developing') {
          priorNeedsPractice.add(rec.name.toLowerCase());
        }
      }
    }

    const systemPrompt = `You are an Interview Architecture Expert designing a structured, competency-based interview blueprint.
Goal: Distribute questions across interview phases and key topics to thoroughly assess required competencies.
Rules:
1. Respect the target question budget and duration.
2. Prioritize required skills first, then user-added skills, then preferred skills.
3. If candidate already demonstrated strong competence in a skill, do not waste time on elementary questions for it; allocate focus to untested or developing areas.
4. Output strictly valid JSON.`;

    const userPrompt = `Job Title: ${jobBrief.jobTitle} (${seniority})
Total Duration: ${durationMinutes} minutes
Target Question Budget: ${questionBudget}
Required Skills: ${requiredSkills.map((s) => s.name).join(', ') || 'Core competencies'}
User Added Skills to test: ${userAddedSkills.map((s) => s.name).join(', ') || 'None'}
Preferred Skills: ${preferredSkills.map((s) => s.name).join(', ') || 'None'}
Prior Demonstrated Skills (Skip basics): ${Array.from(priorDemonstrated).join(', ') || 'None'}
Skills Needing Deep Practice: ${Array.from(priorNeedsPractice).join(', ') || 'None'}

Generate JSON blueprint:
{
  "targetSeniority": "${seniority}",
  "targetPosition": "${jobBrief.jobTitle}",
  "totalDurationMinutes": ${durationMinutes},
  "phases": ["introduction", "technical_deep_dive", "architecture_system_design", "situational_behavioral", "candidate_qa_wrap_up"],
  "topics": [
    {
      "id": "topic-1",
      "topicName": "Introduction & Architecture",
      "targetCompetencies": ["Communication", "Architecture"],
      "priority": "high",
      "questionBudget": 1,
      "timeAllocationMinutes": 4,
      "suggestedFocus": "Past production experience and state management"
    }
  ],
  "competencies": ["React", "TypeScript", "Performance"],
  "totalQuestionBudget": ${questionBudget},
  "followUpAllowancePerQuestion": 1,
  "difficultyBaseline": ${seniority.toLowerCase().includes('senior') ? 4.0 : seniority.toLowerCase().includes('lead') ? 4.5 : 3.0}
}`;

    const res = await this.aiService.executeSmartLLM(userPrompt, {
      systemPrompt,
      jsonMode: true,
      temperature: 0.3,
    });

    let blueprint: any = null;
    if (res?.text) {
      try {
        const match = res.text.match(/\{[\s\S]*\}/);
        if (match) blueprint = JSON.parse(match[0]);
      } catch (e: any) {
        this.logger.warn(`Blueprint JSON parse error: ${e.message}`);
      }
    }

    if (!blueprint || !Array.isArray(blueprint.topics) || blueprint.topics.length === 0) {
      blueprint = this.buildFallbackBlueprint(jobBrief, durationMinutes, seniority, questionBudget);
    }

    return {
      id: `bp-${Date.now()}`,
      sessionId: undefined,
      targetSeniority: seniority,
      targetPosition: jobBrief.jobTitle,
      totalDurationMinutes: durationMinutes,
      phases: blueprint.phases || ['introduction', 'technical_deep_dive', 'architecture_system_design', 'situational_behavioral', 'candidate_qa_wrap_up'],
      topics: blueprint.topics,
      competencies: blueprint.competencies || requiredSkills.map((s) => s.name),
      totalQuestionBudget: questionBudget,
      followUpAllowancePerQuestion: 1,
      difficultyBaseline: blueprint.difficultyBaseline || 3.0,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * TASK 4 – Interview Turn Orchestrator
   * Consolidated single-pass model reasoning:
   * - Language detection & Answer normalization
   * - Content assessment (relevance, completeness, missing evidence)
   * - Follow-up / Next question decision
   * - Feedback generation
   * Eliminates 3-5 sequential LLM calls!
   */
  async orchestrateTurn(params: {
    userId: string;
    sessionId: string;
    turnNumber: number;
    currentQuestionText: string;
    candidateAnswer: string;
    isFollowUp: boolean;
    interviewLanguage: string;
    supportLanguage: string;
    jobTitle: string;
    seniority: string;
    recentTurnsSummary: string;
    knowledgeContext: string;
    blueprint?: InterviewBlueprint | null;
  }): Promise<InterviewTurnOrchestratorResult> {
    const startTime = Date.now();
    const cleanAnswer = sanitizeCandidateText(params.candidateAnswer);
    const normLang = (params.interviewLanguage || 'en').toLowerCase().split(/[-_]/)[0];

    // STABLE PROMPT PREFIX: System persona & evaluation standards at the head for Prompt Caching
    const systemPrompt = `You are an elite Senior Interviewer and Hiring Director evaluating candidates for: ${params.jobTitle} (${params.seniority}).
Interview Language: ${normLang}
Support Language: ${params.supportLanguage}

ORCHESTRATION INSTRUCTIONS:
1. Examine candidate answer:
   - Identify language used.
   - If spoken in support language (${params.supportLanguage}), provide a natural normalized translation into ${normLang}.
   - If spoken directly in ${normLang}, normalizedAnswer is identical to clean answer.
2. Assess content against question requirements:
   - relevance: "high", "medium", or "low"
   - completeness: "complete", "partial", or "inadequate"
   - Identify demonstrated competencies and missing evidence (e.g. specific tools, metrics, cache invalidation, STAR results).
3. Follow-up decision:
   - If answer is incomplete, lacks key evidence, and this turn is NOT already a follow-up: set decision to "ask_followup" and provide one sharp, professional followUpQuestion in ${normLang}.
   - Otherwise, set decision to "next_question".
4. Return strictly valid JSON matching schema.`;

    // Dynamic Context at the tail
    const userPrompt = `Question Asked: "${params.currentQuestionText}"
Candidate Answer: """${cleanAnswer}"""
Is Current Turn Follow-Up: ${params.isFollowUp ? 'YES' : 'NO'}

Recent Turns Context:
${params.recentTurnsSummary || 'First question of session.'}

Domain Knowledge:
${params.knowledgeContext ? params.knowledgeContext.slice(0, 1500) : 'None'}

Return JSON:
{
  "detectedLanguage": "${normLang}",
  "normalizedAnswer": "Answer in ${normLang}",
  "answerType": "direct",
  "contentAssessment": {
    "relevance": "high",
    "completeness": "partial",
    "demonstratedCompetencies": ["Core Concept"],
    "missingEvidence": ["Quantifiable metrics", "Implementation tools"],
    "technicalAccuracyScore": 75,
    "communicationClarityScore": 80
  },
  "decision": "ask_followup",
  "followUpQuestion": "Could you describe which specific metrics you monitored and how you validated the outcome?",
  "nextQuestion": null,
  "feedbackForUser": "Clear foundational knowledge, practice quantifying real-world performance."
}`;

    const res = await this.aiService.executeSmartLLM(userPrompt, {
      systemPrompt,
      jsonMode: true,
      temperature: 0.3,
    });

    const latencyMs = Date.now() - startTime;
    let parsed: any = null;
    if (res?.text) {
      try {
        const match = res.text.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
      } catch (e: any) {
        this.logger.warn(`Failed to parse Turn Orchestrator JSON: ${e.message}`);
      }
    }

    const isShortAnswer = cleanAnswer.split(/\s+/).length < 20;
    const isTranslated = parsed?.answerType === 'translated' || (parsed?.detectedLanguage && parsed.detectedLanguage !== normLang);

    const tokenUsage = {
      inputTokens: res?.tokenUsage ? Math.round(res.tokenUsage * 0.7) : 450,
      outputTokens: res?.tokenUsage ? Math.round(res.tokenUsage * 0.3) : 180,
      cachedInputTokens: Math.round(450 * 0.4), // Static prefix caching estimation
      estimatedCostUsd: Number(((res?.tokenUsage || 600) * 0.0000008).toFixed(6)),
    };

    if (!parsed) {
      return {
        turnNumber: params.turnNumber,
        detectedLanguage: normLang,
        normalizedAnswer: cleanAnswer,
        answerType: 'direct',
        contentAssessment: {
          relevance: 'high',
          completeness: isShortAnswer ? 'partial' : 'complete',
          demonstratedCompetencies: ['Professional Experience'],
          missingEvidence: isShortAnswer ? ['Quantified results', 'Specific tooling'] : [],
          technicalAccuracyScore: isShortAnswer ? 70 : 82,
          communicationClarityScore: 78,
        },
        decision: !params.isFollowUp && isShortAnswer ? 'ask_followup' : 'next_question',
        followUpQuestion:
          !params.isFollowUp && isShortAnswer
            ? 'Could you elaborate on the specific tools and quantifiable results you achieved?'
            : undefined,
        feedbackForUser: 'Good technical direction. Consider adding metrics and STAR examples.',
        tokenUsage,
      };
    }

    return {
      turnNumber: params.turnNumber,
      detectedLanguage: parsed.detectedLanguage || normLang,
      normalizedAnswer: parsed.normalizedAnswer || cleanAnswer,
      answerType: isTranslated ? 'translated' : 'direct',
      contentAssessment: {
        relevance: parsed.contentAssessment?.relevance || 'high',
        completeness: parsed.contentAssessment?.completeness || (isShortAnswer ? 'partial' : 'complete'),
        demonstratedCompetencies: parsed.contentAssessment?.demonstratedCompetencies || [],
        missingEvidence: parsed.contentAssessment?.missingEvidence || [],
        technicalAccuracyScore: parsed.contentAssessment?.technicalAccuracyScore || 78,
        communicationClarityScore: parsed.contentAssessment?.communicationClarityScore || 80,
      },
      decision: params.isFollowUp ? 'next_question' : parsed.decision || 'next_question',
      followUpQuestion: !params.isFollowUp && parsed.decision === 'ask_followup' ? parsed.followUpQuestion : undefined,
      nextQuestion: parsed.nextQuestion,
      feedbackForUser: parsed.feedbackForUser,
      tokenUsage,
    };
  }

  /**
   * Deduplicates and normalizes technical skills
   */
  private normalizeSkillList(skills: any[]): ExtractedSkillItem[] {
    const map = new Map<string, ExtractedSkillItem>();

    for (let i = 0; i < skills.length; i++) {
      const s = skills[i];
      const rawName = s.name || s.title || '';
      if (!rawName.trim()) continue;

      const normName = normalizeSkillName(rawName);
      const key = normName.toLowerCase();

      const existing = map.get(key);
      const isRequired = s.priority === 'required' || s.requirementType === 'required';

      if (existing) {
        // Merge attributes safely
        existing.confidence = Math.max(existing.confidence, s.confidence ?? 0.85);
        existing.importance = Math.max(existing.importance, s.importance ?? 3);
        if (isRequired) {
          existing.priority = 'required';
          existing.requirementType = 'required';
        }
      } else {
        map.set(key, {
          id: `skill-${i + 1}-${Date.now().toString(36)}`,
          name: normName,
          category: s.category || 'Framework',
          priority: isRequired ? 'required' : s.priority === 'optional' ? 'optional' : 'preferred',
          requirementType: isRequired ? 'required' : s.requirementType || 'preferred',
          source: s.source || 'job_description',
          confidence: s.confidence ?? 0.9,
          importance: s.importance ?? (isRequired ? 5 : 3),
          includeInInterview: s.includeInInterview ?? true,
          userNotes: s.userNotes,
        });
      }
    }

    return Array.from(map.values());
  }

  /**
   * Fallback heuristic parser when external AI extraction is unavailable
   */
  private buildHeuristicFallbackExtraction(
    cleanText: string,
    industryCode: string,
    positionTitle?: string
  ): any {
    const lower = cleanText.toLowerCase();

    const techCatalog = [
      { name: 'React', category: 'Framework', prio: 'required' },
      { name: 'TypeScript', category: 'Programming Language', prio: 'required' },
      { name: 'JavaScript', category: 'Programming Language', prio: 'required' },
      { name: 'HTML5', category: 'Core Knowledge', prio: 'required' },
      { name: 'CSS3', category: 'Core Knowledge', prio: 'required' },
      { name: 'REST API', category: 'Core Knowledge', prio: 'required' },
      { name: 'Git', category: 'Tooling', prio: 'required' },
      { name: 'Web Performance', category: 'Core Knowledge', prio: 'required' },
      { name: 'Testing', category: 'Tooling', prio: 'required' },
      { name: 'Docker', category: 'DevOps & Cloud', prio: 'preferred' },
      { name: 'Node.js', category: 'Framework', prio: 'preferred' },
      { name: 'PostgreSQL', category: 'Database', prio: 'preferred' },
      { name: 'Redis', category: 'Database', prio: 'preferred' },
    ];

    const detectedSkills: ExtractedSkillItem[] = [];
    for (const item of techCatalog) {
      if (lower.includes(item.name.toLowerCase()) || lower.includes(item.name.replace(/\s+/g, '').toLowerCase())) {
        detectedSkills.push({
          id: `fallback-${item.name}`,
          name: item.name,
          category: item.category,
          priority: item.prio as any,
          requirementType: item.prio as any,
          source: 'job_description',
          confidence: 0.95,
          importance: item.prio === 'required' ? 5 : 3,
          includeInInterview: true,
        });
      }
    }

    if (detectedSkills.length === 0) {
      detectedSkills.push(
        {
          id: 'def-react',
          name: 'React',
          category: 'Framework',
          priority: 'required',
          requirementType: 'required',
          source: 'job_description',
          confidence: 0.9,
          importance: 5,
          includeInInterview: true,
        },
        {
          id: 'def-ts',
          name: 'TypeScript',
          category: 'Programming Language',
          priority: 'required',
          requirementType: 'required',
          source: 'job_description',
          confidence: 0.9,
          importance: 5,
          includeInInterview: true,
        },
        {
          id: 'def-git',
          name: 'Git',
          category: 'Tooling',
          priority: 'required',
          requirementType: 'required',
          source: 'job_description',
          confidence: 0.85,
          importance: 4,
          includeInInterview: true,
        }
      );
    }

    return {
      jobInformation: {
        jobTitle: positionTitle || 'Frontend Developer',
        industry: industryCode,
        seniority: 'Mid-level',
        experienceRequired: '2-4 years',
        mainResponsibilities: ['Develop robust responsive web apps', 'Optimize frontend bundle and rendering performance'],
      },
      skills: detectedSkills,
      frameworksAndTools: ['React', 'TypeScript', 'Git', 'Vite', 'Tailwind CSS'],
      coreKnowledge: ['State Management', 'Web Performance', 'Component Architecture'],
      softSkills: ['Communication', 'Problem Solving', 'Team Collaboration'],
      businessDomain: ['Web Software Development'],
      languageRequirements: {
        requiredLanguage: 'English',
        expectedProficiency: 'Professional working proficiency',
      },
      preferredQualifications: ['Familiarity with CI/CD', 'Automated testing with Vitest/Jest'],
    };
  }

  /**
   * Deterministic Blueprint fallback
   */
  private buildFallbackBlueprint(
    jobBrief: InterviewJobBrief,
    durationMinutes: number,
    seniority: string,
    questionBudget: number
  ): any {
    const required = (jobBrief.requiredSkills || []).map((s) => s.name);
    const userAdded = (jobBrief.userAddedSkills || []).map((s) => s.name);

    return {
      phases: ['introduction', 'technical_deep_dive', 'architecture_system_design', 'situational_behavioral', 'candidate_qa_wrap_up'],
      topics: [
        {
          id: 'topic-intro',
          topicName: 'Introduction & Core Architecture',
          targetCompetencies: ['Communication', 'System Design'],
          priority: 'high',
          questionBudget: 1,
          timeAllocationMinutes: Math.round(durationMinutes * 0.2),
          suggestedFocus: `Walkthrough of past production projects using ${required.slice(0, 2).join(' and ')}`,
        },
        {
          id: 'topic-deepdive',
          topicName: 'Technical Deep-Dive & Practical Problem Solving',
          targetCompetencies: required.slice(0, 3),
          priority: 'high',
          questionBudget: Math.max(1, questionBudget - 2),
          timeAllocationMinutes: Math.round(durationMinutes * 0.5),
          suggestedFocus: `Bottlenecks, troubleshooting, and code quality in ${required.join(', ')}`,
        },
        {
          id: 'topic-behavioral',
          topicName: 'Engineering Trade-offs & Collaboration',
          targetCompetencies: ['Problem Solving', ...userAdded],
          priority: 'medium',
          questionBudget: 1,
          timeAllocationMinutes: Math.round(durationMinutes * 0.3),
          suggestedFocus: 'Balancing technical debt with feature delivery and cross-functional teamwork',
        },
      ],
      competencies: [...required, ...userAdded],
      difficultyBaseline: seniority.toLowerCase().includes('senior') ? 4.0 : 3.0,
    };
  }
}
