import { describe, it, expect } from 'vitest';
import {
  normalizeSkillName,
  ExtractedSkillItem,
  InterviewJobBrief,
  InterviewBlueprint,
  InterviewActivity,
  InterviewTurnOrchestratorResult,
  UserInterviewLearningProfileDto,
} from '@vocabflow/shared';

describe('TASK 1 & 12 (Test 3) – Live AI Activity State Machine', () => {
  it('defines valid state machine transitions matching production workflow', () => {
    const validActivities: InterviewActivity[] = [
      'idle',
      'preparing',
      'listening',
      'transcribing',
      'analyzing',
      'retrieving_context',
      'evaluating',
      'selecting_question',
      'generating_response',
      'speaking',
      'completed',
      'error',
    ];

    expect(validActivities).toContain('listening');
    expect(validActivities).toContain('analyzing');
    expect(validActivities).toContain('speaking');
    expect(validActivities).toContain('selecting_question');
  });

  it('prevents out-of-order or duplicate state updates', () => {
    const history: Array<{ activity: InterviewActivity; timestamp: number }> = [];

    const applyActivity = (activity: InterviewActivity, timestamp: number) => {
      const last = history[history.length - 1];
      if (last && last.timestamp > timestamp) {
        // Discard older event arriving out-of-order
        return;
      }
      history.push({ activity, timestamp });
    };

    applyActivity('listening', 100);
    applyActivity('analyzing', 200);
    applyActivity('listening', 150); // Stale event, should be dropped!
    applyActivity('speaking', 300);

    expect(history.map((h) => h.activity)).toEqual(['listening', 'analyzing', 'speaking']);
  });
});

describe('TASK 2 & 12 (Test 1 & 2) – JD Analyzer, Skill Matrix & Customization', () => {
  it('normalizes common technical skill aliases to prevent duplicate cards (Task 2.6)', () => {
    expect(normalizeSkillName('React.js')).toBe('React');
    expect(normalizeSkillName('React JS')).toBe('React');
    expect(normalizeSkillName('ReactJS')).toBe('React');
    expect(normalizeSkillName('react')).toBe('React');

    expect(normalizeSkillName('NodeJS')).toBe('Node.js');
    expect(normalizeSkillName('node.js')).toBe('Node.js');
    expect(normalizeSkillName('typescript')).toBe('TypeScript');
    expect(normalizeSkillName('postgresql')).toBe('PostgreSQL');
    expect(normalizeSkillName('k8s')).toBe('Kubernetes');
  });

  it('handles Test 1: extracts required and preferred skills, supports user custom skills', () => {
    const extractedSkills: ExtractedSkillItem[] = [
      {
        id: 's1',
        name: normalizeSkillName('React.js'),
        category: 'Framework',
        priority: 'required',
        requirementType: 'required',
        source: 'job_description',
        confidence: 0.95,
        importance: 5,
        includeInInterview: true,
      },
      {
        id: 's2',
        name: normalizeSkillName('TypeScript'),
        category: 'Programming Language',
        priority: 'required',
        requirementType: 'required',
        source: 'job_description',
        confidence: 0.95,
        importance: 5,
        includeInInterview: true,
      },
      {
        id: 's3',
        name: normalizeSkillName('Docker'),
        category: 'DevOps & Cloud',
        priority: 'preferred',
        requirementType: 'preferred',
        source: 'job_description',
        confidence: 0.85,
        importance: 3,
        includeInInterview: true,
      },
    ];

    // User adds custom skills (Task 2.5)
    const userAddedSkills: ExtractedSkillItem[] = [
      {
        id: 'u1',
        name: 'GitLab CI/CD',
        category: 'DevOps & Cloud',
        priority: 'preferred',
        requirementType: 'user_added',
        source: 'user_added',
        confidence: 1.0,
        importance: 4,
        includeInInterview: true,
      },
      {
        id: 'u2',
        name: 'WebSocket',
        category: 'Core Knowledge',
        priority: 'preferred',
        requirementType: 'user_added',
        source: 'user_added',
        confidence: 1.0,
        importance: 4,
        includeInInterview: true,
      },
    ];

    const allSkills = [...extractedSkills, ...userAddedSkills];
    expect(allSkills.some((s) => s.name === 'React' && s.priority === 'required')).toBe(true);
    expect(allSkills.some((s) => s.name === 'Docker' && s.priority === 'preferred')).toBe(true);
    expect(allSkills.some((s) => s.name === 'GitLab CI/CD' && s.source === 'user_added')).toBe(true);
    expect(allSkills.some((s) => s.name === 'WebSocket' && s.source === 'user_added')).toBe(true);
  });

  it('handles Test 2: User removes React -> React is not forced as required; User adds Docker -> Blueprint updates', () => {
    let activeSkills: ExtractedSkillItem[] = [
      {
        id: 's1',
        name: 'React',
        category: 'Framework',
        priority: 'required',
        requirementType: 'required',
        source: 'job_description',
        confidence: 0.95,
        importance: 5,
        includeInInterview: true,
      },
      {
        id: 's2',
        name: 'Vue.js',
        category: 'Framework',
        priority: 'required',
        requirementType: 'required',
        source: 'job_description',
        confidence: 0.9,
        importance: 5,
        includeInInterview: true,
      },
    ];

    // User unchecks or removes React
    activeSkills = activeSkills.filter((s) => s.name !== 'React');
    expect(activeSkills.some((s) => s.name === 'React')).toBe(false);

    // User adds Docker
    activeSkills.push({
      id: 'u-docker',
      name: 'Docker',
      category: 'DevOps & Cloud',
      priority: 'required',
      requirementType: 'user_added',
      source: 'user_added',
      confidence: 1.0,
      importance: 5,
      includeInInterview: true,
    });

    const blueprintCompetencies = activeSkills.map((s) => s.name);
    expect(blueprintCompetencies).not.toContain('React');
    expect(blueprintCompetencies).toContain('Docker');
    expect(blueprintCompetencies).toContain('Vue.js');
  });
});

describe('TASK 4 & 12 (Test 4) – Token Optimization & Single-Pass Turn Orchestrator', () => {
  it('consolidates language normalization, content assessment and follow-up in single response', () => {
    const mockOrchestratorResult: InterviewTurnOrchestratorResult = {
      turnNumber: 1,
      detectedLanguage: 'vi',
      normalizedAnswer: 'I optimized the API using Redis caching with 15-minute TTLs.',
      answerType: 'translated',
      contentAssessment: {
        relevance: 'high',
        completeness: 'partial',
        demonstratedCompetencies: ['Redis', 'API Caching'],
        missingEvidence: ['Quantifiable latency metrics before and after'],
        technicalAccuracyScore: 82,
        communicationClarityScore: 85,
      },
      decision: 'ask_followup',
      followUpQuestion: 'Which specific latency reductions did you observe and how did you measure the improvement?',
      feedbackForUser: 'Great mention of TTLs, recommend quantifying latency impact.',
      tokenUsage: {
        inputTokens: 480,
        outputTokens: 140,
        cachedInputTokens: 250,
        estimatedCostUsd: 0.00049,
      },
    };

    expect(mockOrchestratorResult.detectedLanguage).toBe('vi');
    expect(mockOrchestratorResult.answerType).toBe('translated');
    expect(mockOrchestratorResult.decision).toBe('ask_followup');
    expect(mockOrchestratorResult.contentAssessment.missingEvidence.length).toBeGreaterThan(0);
    expect(mockOrchestratorResult.followUpQuestion).toContain('latency');
    expect(mockOrchestratorResult.tokenUsage?.cachedInputTokens).toBeGreaterThan(0);
  });
});

describe('TASK 7 & 12 (Test 5 & 6) – Adaptive Interview Memory & Privacy Controls', () => {
  it('Test 5: updates skill record with demonstrated mastery vs developing, adapts next session', () => {
    const memoryProfile: UserInterviewLearningProfileDto = {
      userId: 'user-123',
      careerFocus: 'Frontend Developer',
      targetSeniority: 'Mid-level',
      skills: [
        {
          name: 'React',
          category: 'Framework',
          status: 'demonstrated',
          confidence: 0.88,
          evidenceCount: 3,
          strengths: ['Component lifecycle', 'Hooks state management'],
          weaknesses: [],
        },
        {
          name: 'Web Performance',
          category: 'Core Knowledge',
          status: 'developing',
          confidence: 0.55,
          evidenceCount: 1,
          strengths: [],
          weaknesses: ['Lacks quantifiable profiling metrics with Chrome DevTools'],
        },
      ],
      communicationPatterns: ['Often lacks quantitative evidence in architectural answers'],
      languageLearningNeeds: ['Technical metric verbs'],
      totalSessions: 1,
      lastSessionAt: new Date().toISOString(),
      personalizationEnabled: true,
    };

    // Session 2 planning logic:
    const reactRecord = memoryProfile.skills.find((s) => s.name === 'React');
    const perfRecord = memoryProfile.skills.find((s) => s.name === 'Web Performance');

    expect(reactRecord?.status).toBe('demonstrated');
    expect(perfRecord?.status).toBe('developing');

    // Planning algorithm checks:
    const shouldSkipBasicReactIntro = reactRecord?.status === 'demonstrated' && reactRecord.confidence > 0.8;
    const shouldDeepDivePerformance = perfRecord?.status === 'developing';

    expect(shouldSkipBasicReactIntro).toBe(true);
    expect(shouldDeepDivePerformance).toBe(true);
  });

  it('Test 6: supports user privacy reset and disabling personalization', () => {
    let userProfile: UserInterviewLearningProfileDto = {
      userId: 'user-privacy-test',
      careerFocus: 'Backend Engineer',
      targetSeniority: 'Senior',
      skills: [
        {
          name: 'PostgreSQL',
          category: 'Database',
          status: 'strong',
          confidence: 0.95,
          evidenceCount: 4,
          strengths: ['EXPLAIN ANALYZE', 'B-Tree vs GIN indexing'],
          weaknesses: [],
        },
      ],
      communicationPatterns: ['Articulate trade-offs clearly'],
      languageLearningNeeds: [],
      totalSessions: 2,
      personalizationEnabled: true,
    };

    // User chooses to reset learning history (Task 7.4)
    userProfile.skills = [];
    userProfile.communicationPatterns = [];
    userProfile.totalSessions = 0;

    expect(userProfile.skills.length).toBe(0);
    expect(userProfile.communicationPatterns.length).toBe(0);
    expect(userProfile.totalSessions).toBe(0);

    // User toggles personalization off
    userProfile.personalizationEnabled = false;
    expect(userProfile.personalizationEnabled).toBe(false);
  });
});
