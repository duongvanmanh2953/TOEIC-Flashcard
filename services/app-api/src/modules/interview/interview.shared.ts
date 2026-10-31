/**
 * services/app-api - AI Interview Studio Types & Domain Contracts (Synchronized with @vocabflow/shared)
 */

export interface InterviewIndustryDto {
  id: string;
  code: string;
  name: string;
  nameVi: string;
  description?: string;
  icon?: string;
  orderIndex: number;
  positions?: InterviewPositionDto[];
}

export interface InterviewPositionDto {
  id: string;
  industryId: string;
  code: string;
  title: string;
  titleVi: string;
  description?: string;
  requiredSkills: string[];
  technicalTags: string[];
}

export type InterviewMode = 'REALISTIC' | 'COACH';
export type InterviewQuestionMode = 'SEQUENTIAL' | 'RANDOM' | 'ADAPTIVE';
export type InterviewerStyle = 'PROFESSIONAL' | 'FRIENDLY' | 'STRICT' | 'CHALLENGING';
export type InterviewQuestionSource = 'CURATED' | 'COMMUNITY' | 'PRIVATE' | 'AI_GENERATED';

export type InterviewerPersonaType =
  | 'HR_RECRUITER'
  | 'HIRING_MANAGER'
  | 'TECHNICAL_LEAD'
  | 'DOMAIN_EXPERT'
  | 'BEHAVIORAL_COACH';

export interface InterviewSetupConfig {
  languageId: string;
  supportLanguageId: string;
  industryCode: string;
  positionCode: string;
  positionTitle: string;
  seniorityLevel: string;
  interviewType: string;
  durationMinutes: number;
  mode: InterviewMode;
  questionMode: InterviewQuestionMode;
  interviewerStyle: InterviewerStyle;
  questionSource: InterviewQuestionSource;
  enableHints: boolean;
  enableTranslation: boolean;
  enableVoice: boolean;
  customJobDescription?: string;
}

export interface InterviewLanguageContext {
  languageSpaceId: string;
  interviewLanguage: string;
  interviewLocale: string;
  supportLanguage: string;
  uiLanguage: string;
  expectedSpeechLocales: string[];
  ttsVoiceId?: string;
  transcriptionCapability: boolean;
  translationCapability: boolean;
  pronunciationAssessmentCapability: boolean;
}

export const LANGUAGE_LOCALE_MAP: Record<string, string> = {
  en: 'en-US',
  ja: 'ja-JP',
  ko: 'ko-KR',
  zh: 'zh-CN',
  vi: 'vi-VN',
  fr: 'fr-FR',
  de: 'de-DE',
  es: 'es-ES',
};

export function getLocaleForLanguage(lang: string): string {
  const code = (lang || 'en').toLowerCase().split(/[-_]/)[0];
  return LANGUAGE_LOCALE_MAP[code] || 'en-US';
}

export function buildInterviewLanguageContext(
  interviewLang: string = 'en',
  supportLang: string = 'vi',
  uiLang: string = 'vi'
): InterviewLanguageContext {
  const normInterviewLang = (interviewLang || 'en').toLowerCase().split(/[-_]/)[0];
  const interviewLocale = getLocaleForLanguage(normInterviewLang);
  const normSupportLang = (supportLang || 'vi').toLowerCase().split(/[-_]/)[0];
  const supportLocale = getLocaleForLanguage(normSupportLang);

  return {
    languageSpaceId: normInterviewLang,
    interviewLanguage: normInterviewLang,
    interviewLocale,
    supportLanguage: normSupportLang,
    uiLanguage: (uiLang || 'vi').toLowerCase().split(/[-_]/)[0],
    expectedSpeechLocales: [interviewLocale, supportLocale],
    transcriptionCapability: true,
    translationCapability: true,
    pronunciationAssessmentCapability: true,
  };
}

export type TranslationPurpose =
  | 'question'
  | 'answer'
  | 'hint'
  | 'sample_answer'
  | 'feedback'
  | 'explanation';

export interface TranslationRequest {
  sourceLanguage: string;
  targetLanguage: string;
  text: string;
  purpose: TranslationPurpose;
  industryCode?: string;
  positionCode?: string;
}

export interface TranslationResponse {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  purpose: TranslationPurpose;
  isCached?: boolean;
}

export interface InterviewQuestionItem {
  id: string;
  title: string;
  body: string;
  suggestedAnswer?: string;
  difficulty: number;
  seniority: string;
  interviewType: string;
  competencyTags: string[];
  language: string;
  source: InterviewQuestionSource;
  answerRubric?: {
    dimensions: string[];
    keyPoints: string[];
    starCriteria?: {
      situation?: string;
      task?: string;
      action?: string;
      result?: string;
    };
  };
}

export interface InterviewTurnResult {
  turnNumber: number;
  questionText: string;
  candidateAnswer?: string;
  isFollowUp: boolean;
  followUpParentId?: string;
  aiFeedback?: string;
  hintLevelUsed: number;
  usedSampleAnswer: boolean;
  analysis?: {
    completenessScore: number;
    missingDimensions: string[];
    technicalAccuracy: string;
    hasFollowUp: boolean;
  };
}

export interface InterviewScoreCluster {
  professionalCompetency: number; // 0-100
  communication: number; // 0-100
  languageProficiency: number; // 0-100 (0 or null if translated)
  interviewPerformance: number; // 0-100
  overallScore: number; // 0-100
  isTranslatedAnswer?: boolean;
  languageScoreNote?: string;
}

export interface InterviewQuestionReviewItem {
  turnNumber: number;
  question: string;
  questionTranslation?: string;
  candidateAnswer: string;
  normalizedAnswer?: string;
  isTranslatedAnswer?: boolean;
  detectedSourceLanguage?: string;
  followUps?: Array<{ question: string; answer: string }>;
  score: number;
  scoresCluster?: InterviewScoreCluster;
  feedback: string;
  rubricEvaluation: {
    completeness: number; // 1-5
    technicalDepth: number; // 1-5
    communicationClarity: number; // 1-5
    evidenceMetrics: number; // 1-5
  };
  missingDimensions?: string[];
  strengths?: string[];
  suggestedAnswer: string;
  translationVi?: string;
  practiceTips?: string[];
}

export interface InterviewReportData {
  sessionId: string;
  overallScore: number;
  competencyScore: number;
  communicationScore?: number;
  languageScore: number;
  performanceScore?: number;
  strengths: string[];
  weaknesses: string[];
  summaryMd: string;
  isAnyAnswerTranslated?: boolean;
  questionReviews: InterviewQuestionReviewItem[];
  learningRecommendations: Array<{
    domain: 'VOCABULARY' | 'GRAMMAR' | 'SPEAKING' | 'TECHNICAL';
    title: string;
    reason: string;
    targetUrl: string;
  }>;
}

export const PREDEFINED_TAXONOMY: InterviewIndustryDto[] = [
  {
    id: 'ind-TECH',
    code: 'TECH',
    name: 'Technology',
    nameVi: 'Công nghệ thông tin & Phần mềm',
    description: 'Software Engineering, AI/ML, DevOps, Cloud, and Data Systems.',
    icon: 'Cpu',
    orderIndex: 1,
    positions: [
      {
        id: 'pos-TECH_FE',
        industryId: 'ind-TECH',
        code: 'TECH_FE',
        title: 'Frontend Developer',
        titleVi: 'Kỹ sư Phát triển Frontend (React, Vue, TypeScript)',
        description: 'Building high-performance, accessible, and responsive user interfaces with modern web standards.',
        requiredSkills: ['React', 'TypeScript', 'State Management', 'Web Performance', 'REST/GraphQL APIs', 'CSS Architecture'],
        technicalTags: ['Next.js', 'Vite', 'Tailwind CSS', 'Redux/Zustand', 'DOM & Canvas', 'Jest/Vitest'],
      },
      {
        id: 'pos-TECH_BE',
        industryId: 'ind-TECH',
        code: 'TECH_BE',
        title: 'Backend Developer',
        titleVi: 'Kỹ sư Phát triển Backend (Node.js, Go, Python, Java)',
        description: 'Architecting resilient distributed microservices, database schemas, and high-throughput APIs.',
        requiredSkills: ['Node.js/NestJS', 'PostgreSQL', 'Redis Caching', 'Microservices Architecture', 'Docker & Kubernetes', 'System Design'],
        technicalTags: ['Prisma ORM', 'RabbitMQ/Kafka', 'OAuth2/JWT', 'REST & gRPC', 'Event-Driven Design', 'CI/CD Pipelines'],
      },
      {
        id: 'pos-TECH_QA',
        industryId: 'ind-TECH',
        code: 'TECH_QA',
        title: 'QA / Automation Test Engineer',
        titleVi: 'Kỹ sư Đảm bảo Chất lượng & Kiểm thử Tự động',
        description: 'Designing test suites, automated end-to-end regression pipelines, API test frameworks, and defect tracking.',
        requiredSkills: ['Test Automation', 'Selenium / Playwright', 'Postman / REST Assured', 'CI/CD Integration', 'Bug Triaging'],
        technicalTags: ['Cypress', 'Playwright', 'Vitest', 'Performance Testing', 'Security Scanning'],
      },
      {
        id: 'pos-TECH_AI',
        industryId: 'ind-TECH',
        code: 'TECH_AI',
        title: 'AI / Machine Learning Engineer',
        titleVi: 'Kỹ sư Trí tuệ nhân tạo & RAG (LLMs, PyTorch, Vector DBs)',
        description: 'Engineering Large Language Model applications, RAG pipelines, fine-tuning, and model inference optimization.',
        requiredSkills: ['Python', 'PyTorch/TensorFlow', 'Vector Databases', 'Prompt Engineering', 'RAG Architecture', 'Model Evaluation'],
        technicalTags: ['LangChain/LlamaIndex', 'Qdrant/pgvector', 'HuggingFace', 'Embeddings', 'Transformer Architectures'],
      },
    ],
  },
  {
    id: 'ind-HOSP',
    code: 'HOSP',
    name: 'Hospitality & Tourism',
    nameVi: 'Khách sạn, Du lịch & Dịch vụ Khách hàng',
    description: 'Front office management, luxury guest relations, reservation operations, and culinary hospitality.',
    icon: 'Smile',
    orderIndex: 2,
    positions: [
      {
        id: 'pos-HOSP_FRONT',
        industryId: 'ind-HOSP',
        code: 'HOSP_FRONT',
        title: 'Hotel Front Office & Receptionist',
        titleVi: 'Lễ tân Khách sạn & Bộ phận Tiền sảnh',
        description: 'Delivering exceptional guest reception, handling check-in/out, conflict resolution, and concierge requests in multilingual settings.',
        requiredSkills: ['Guest Communication', 'Reservation Handling', 'Check-in/Check-out', 'Complaint Resolution', 'Hotel PMS', 'Service Recovery'],
        technicalTags: ['Opera PMS', 'VIP Guest Protocol', 'Overbooking Recovery', 'Shift Handover', 'Night Audit'],
      },
      {
        id: 'pos-HOSP_FB',
        industryId: 'ind-HOSP',
        code: 'HOSP_FB',
        title: 'F&B Operations Supervisor',
        titleVi: 'Giám sát Vận hành Nhà hàng & Dịch vụ Ẩm thực',
        description: 'Supervising restaurant floor service, wine and menu consultation, hygiene standards, and team scheduling.',
        requiredSkills: ['Food & Beverage Service', 'Inventory & Cost Control', 'Team Leadership', 'Hygiene HACCP', 'Customer Satisfaction'],
        technicalTags: ['POS Systems', 'Table Turnover', 'Upselling', 'VIP Dining Protocols'],
      },
    ],
  },
  {
    id: 'ind-BIZ',
    code: 'BIZ',
    name: 'Business & Management',
    nameVi: 'Kinh doanh & Quản lý',
    description: 'Corporate strategy, project delivery, product management, and business operations.',
    icon: 'Briefcase',
    orderIndex: 3,
    positions: [
      {
        id: 'pos-BIZ_PM',
        industryId: 'ind-BIZ',
        code: 'BIZ_PM',
        title: 'Product Manager',
        titleVi: 'Giám đốc Sản phẩm (Product Management)',
        description: 'Driving product vision, discovery, market research, roadmap prioritization, and cross-functional leadership.',
        requiredSkills: ['Product Strategy', 'User Discovery', 'Agile/Scrum', 'Data-Informed Prioritization', 'Stakeholder Alignment'],
        technicalTags: ['A/B Testing', 'OKRs & KPIs', 'PRDs & User Stories', 'Mixpanel / Amplitude', 'GTM Strategy'],
      },
      {
        id: 'pos-BIZ_BA',
        industryId: 'ind-BIZ',
        code: 'BIZ_BA',
        title: 'Business Analyst',
        titleVi: 'Chuyên viên Phân tích Nghiệp vụ (Business Analysis)',
        description: 'Bridging business stakeholders and engineering teams with detailed requirement specifications.',
        requiredSkills: ['Requirement Gathering', 'Process Modeling (BPMN)', 'UML & Wireframing', 'SQL Querying', 'User Acceptance Testing'],
        technicalTags: ['Jira / Confluence', 'Data Flow Diagrams', 'Gap Analysis', 'Feasibility Studies'],
      },
    ],
  },
  {
    id: 'ind-FIN',
    code: 'FIN',
    name: 'Finance & Banking',
    nameVi: 'Tài chính & Ngân hàng',
    description: 'Financial accounting, corporate audit, investment analysis, and retail banking.',
    icon: 'TrendingUp',
    orderIndex: 4,
    positions: [
      {
        id: 'pos-FIN_ANALYST',
        industryId: 'ind-FIN',
        code: 'FIN_ANALYST',
        title: 'Financial Analyst',
        titleVi: 'Chuyên viên Phân tích Tài chính',
        description: 'Conducting financial modeling, forecasting, variance analysis, and evaluating capital investments.',
        requiredSkills: ['Financial Modeling', 'DCF Valuation', 'Excel Mastery', 'Ratio Analysis', 'Management Reporting'],
        technicalTags: ['Balance Sheet / P&L', 'CAPEX Planning', 'Power BI / Tableau', 'Bloomberg Terminal'],
      },
      {
        id: 'pos-FIN_ACC',
        industryId: 'ind-FIN',
        code: 'FIN_ACC',
        title: 'Senior Corporate Accountant',
        titleVi: 'Kế toán Tổng hợp & Báo cáo Tài chính',
        description: 'Managing general ledger, corporate tax compliance, statutory reporting, and internal controls.',
        requiredSkills: ['General Ledger (GL)', 'IFRS & VAS Standards', 'Tax Filing', 'Audit Preparation', 'ERP Accounting'],
        technicalTags: ['SAP / Oracle ERP', 'Reconciliation', 'Cash Flow Management', 'Fixed Assets'],
      },
    ],
  },
  {
    id: 'ind-MKT',
    code: 'MKT',
    name: 'Marketing & Growth',
    nameVi: 'Marketing & Tăng trưởng',
    description: 'Brand strategy, performance marketing, content creation, and search engine optimization.',
    icon: 'Sparkles',
    orderIndex: 5,
    positions: [
      {
        id: 'pos-MKT_DIGITAL',
        industryId: 'ind-MKT',
        code: 'MKT_DIGITAL',
        title: 'Digital Marketing Specialist',
        titleVi: 'Chuyên viên Digital Marketing & Tăng trưởng',
        description: 'Executing multi-channel acquisition campaigns, paid ads, funnel optimization, and conversion rate growth.',
        requiredSkills: ['Performance Ads (Meta/Google)', 'Conversion Rate Optimization', 'Analytics & Attribution', 'Funnel Design'],
        technicalTags: ['Google Analytics 4', 'Tag Manager', 'ROAS Optimization', 'Email Automation'],
      },
    ],
  },
  {
    id: 'ind-EDU',
    code: 'EDU',
    name: 'Education & Academic Teaching',
    nameVi: 'Giáo dục & Đào tạo Ngôn ngữ',
    description: 'Language instruction, curriculum development, classroom management, and student assessment.',
    icon: 'GraduationCap',
    orderIndex: 6,
    positions: [
      {
        id: 'pos-EDU_TEACHER',
        industryId: 'ind-EDU',
        code: 'EDU_TEACHER',
        title: 'English Language Teacher',
        titleVi: 'Giáo viên Tiếng Anh / Giảng viên Học thuật',
        description: 'Delivering interactive language lessons, preparing students for standardized tests (IELTS, TOEIC), and fostering learner autonomy.',
        requiredSkills: ['Pedagogy & Lesson Planning', 'Classroom Management', 'IELTS/TOEIC Prep', 'Assessment & Feedback', 'Differentiated Instruction'],
        technicalTags: ['TESOL/CELTA', 'CEFR Standards', 'Interactive Learning', 'EdTech Tools'],
      },
    ],
  },
];

export const MULTILINGUAL_CURATED_QUESTIONS: Record<
  string,
  Record<string, Array<{ title: string; body: string; competencies: string[] }>>
> = {
  TECH: {
    en: [
      {
        title: 'Introduction & System Architecture',
        body: 'Could you introduce yourself, your technical background, and walk me through the architecture and state management of a production system you recently engineered?',
        competencies: ['Communication', 'Architecture', 'State Management'],
      },
      {
        title: 'Performance Optimization & Troubleshooting',
        body: 'Describe a challenging production bottleneck (latency, rendering, or memory leak) you diagnosed. Which profiling tools did you use and what were the measurable results?',
        competencies: ['Problem Solving', 'Profiling', 'Metrics'],
      },
      {
        title: 'API Resilience & Distributed Caching',
        body: 'How do you design high-reliability API communication between client and server, accounting for network failures, cache invalidation, and data consistency?',
        competencies: ['System Design', 'Caching', 'Reliability'],
      },
      {
        title: 'Technical Tradeoffs & Code Maintainability',
        body: 'Tell me about a time you had to balance urgent product delivery deadlines against technical debt. How did you structure your decision and align with stakeholders?',
        competencies: ['Decision Making', 'Communication', 'Pragmatism'],
      },
    ],
    ja: [
      {
        title: '自己紹介とシステム設計経験',
        body: '自己紹介をお願いします。これまでの開発経験と、最近携わった本番システムのアーキテクチャおよび状態管理の設計について教えてください。',
        competencies: ['コミュニケーション', 'アーキテクチャ', '設計'],
      },
      {
        title: 'パフォーマンス改善とトラブルシューティング',
        body: '本番環境で直面した最も困難なパフォーマンス上の課題（レンダリング遅延やAPIレスポンス等）と、それをどのように分析・解決したか具体的に教えてください。',
        competencies: ['問題解決', 'パフォーマンス最適化', '定量的成果'],
      },
      {
        title: 'API設計とキャッシュ整合性',
        body: '障害に強いクライアント・サーバー間の通信やキャッシュの整合性を保つために、普段どのような工夫や設計原則を取り入れていますか？',
        competencies: ['API設計', 'キャッシュ', '信頼性'],
      },
    ],
    ko: [
      {
        title: '자기소개 및 아키텍처 경험',
        body: '간단한 자기소개와 함께, 최근 구축하거나 운영했던 프로덕션 시스템의 아키텍처 및 상태 관리 방식에 대해 설명해 주세요.',
        competencies: ['커뮤니케이션', '시스템 설계', '기술 역량'],
      },
      {
        title: '성능 최적화 및 문제 해결',
        body: '실제 운영 환경에서 경험했던 성능 병목 현상을 진단하고 정량적으로 개선했던 사례를 말씀해 주세요.',
        competencies: ['문제 해결', '성능 튜닝', '데이터 분석'],
      },
    ],
    zh: [
      {
        title: '自我介绍与架构经验',
        body: '请您做一个简短的自我介绍，并向我们详细介绍一下您最近负责的一个线上系统的整体架构与状态管理方案。',
        competencies: ['沟通表达', '架构设计', '技术功底'],
      },
      {
        title: '性能优化与故障排查',
        body: '请分享一次您在线上排查并解决严重性能瓶颈（如渲染卡顿、API延迟或内存泄漏）的经历，您采用了哪些工具以及取得了怎样的量化成果？',
        competencies: ['问题排查', '性能优化', '量化成果'],
      },
    ],
  },
  HOSP: {
    en: [
      {
        title: 'Front Office Reception & Early Arrival',
        body: 'Could you introduce yourself and describe how you handle a VIP guest arriving three hours prior to standard check-in time when their assigned room is not yet ready?',
        competencies: ['Guest Communication', 'Hospitality Protocol', 'Composure'],
      },
      {
        title: 'Complaint Resolution & Service Recovery',
        body: 'Tell me about a situation where an angry guest complained about an unexpected billing error or noisy neighbors. What exact steps did you take to resolve their frustration?',
        competencies: ['Conflict Resolution', 'Empathy', 'Service Recovery'],
      },
      {
        title: 'Property Management & Inter-department Coordination',
        body: 'During peak departure hours, how do you utilize your hotel PMS to coordinate with housekeeping and ensure rapid room turnaround without sacrificing inspection quality?',
        competencies: ['Opera PMS', 'Cross-department Coordination', 'Efficiency'],
      },
    ],
    ja: [
      {
        title: 'フロントレセプションとアーリーチェックイン対応',
        body: '自己紹介をお願いします。また、チェックイン時間より数時間早く到着されたVIPのお客様に対し、お部屋の清掃が完了していない場合、どのように最善の接客を行いますか？',
        competencies: ['接客対応', 'ホスピタリティ', '柔軟性'],
      },
      {
        title: 'クレーム対応とサービスリカバリー',
        body: '宿泊料金の請求ミスやお部屋の不備でお怒りのお客様に対し、誠意を持って対応し信頼を回復した経験があれば教えてください。',
        competencies: ['クレーム処理', '共感力', 'リカバリー'],
      },
    ],
    ko: [
      {
        title: '호텔 프런트 오피스 고객 응대',
        body: '자기소개와 함께, 정규 체크인 시간 이전에 도착하신 VIP 고객에게 객실이 아직 준비되지 않았을 때 어떻게 응대하시겠습니까?',
        competencies: ['고객 서비스', '프로토콜', '유연성'],
      },
    ],
    zh: [
      {
        title: '酒店前厅接待与突发状况应对',
        body: '请您做自我介绍，并谈谈如果遇到一位提前数小时到店且预订房间尚未打扫完毕的贵宾（VIP），您会如何安抚并提供高水准的接待服务？',
        competencies: ['宾客服务', '沟通协调', '服务补救'],
      },
    ],
  },
  BIZ: {
    en: [
      {
        title: 'Strategic Roadmap & Prioritization',
        body: 'How do you prioritize competing feature requests when leadership, sales, and engineering stakeholders possess directly conflicting high-priority demands?',
        competencies: ['Stakeholder Management', 'Roadmap Prioritization', 'Data-driven Thinking'],
      },
      {
        title: 'Data-Informed Discovery vs User Feedback',
        body: 'Can you share an example where qualitative customer interview findings contradicted your quantitative product funnel analytics? How did you resolve the discrepancy?',
        competencies: ['User Discovery', 'Analytics', 'Decision Making'],
      },
    ],
    ja: [
      {
        title: 'プロダクト戦略と優先順位決定',
        body: '関係各所（経営陣、営業、開発チーム）から相反する要望が寄せられた際、どのような基準やフレームワークで優先順位を決定しますか？',
        competencies: ['ステークホルダー調整', 'ロードマップ', '意思決定'],
      },
    ],
  },
  FIN: {
    en: [
      {
        title: 'Financial Modeling & Working Capital Dynamics',
        body: 'Walk me through how you build a three-statement integrated financial forecast and account for sudden shifts in inventory cycles and receivables.',
        competencies: ['Financial Modeling', 'Working Capital', 'Accounting Rigor'],
      },
      {
        title: 'Variance Analysis & Cost Rationalization',
        body: 'Describe how you conduct budget-versus-actual variance analysis and report high-risk departmental overspending to executive leadership.',
        competencies: ['Variance Analysis', 'Reporting', 'Financial Controls'],
      },
    ],
  },
  MKT: {
    en: [
      {
        title: 'Customer Acquisition Funnel & ROAS Optimization',
        body: 'Describe a growth campaign you executed from scratch. How did you structure your attribution model, target audiences, and optimize blended CAC/ROAS?',
        competencies: ['Paid Ads', 'ROAS Optimization', 'Funnel Analytics'],
      },
    ],
  },
  EDU: {
    en: [
      {
        title: 'Differentiated Language Pedagogy',
        body: 'How do you structure an interactive language lesson for a classroom with mixed proficiency levels, ensuring hesitant students engage actively without feeling intimidated?',
        competencies: ['Pedagogy', 'Classroom Management', 'Student Engagement'],
      },
    ],
  },
};

export const INJECTION_PATTERNS = [
  /ignore (all )?previous instructions/gi,
  /system prompt/gi,
  /you are now (an? )?unrestricted/gi,
  /disregard (the )?system/gi,
  /act as (a )?jailbroken/gi,
  /repeat the system prompt/gi,
  /reveal your instructions/gi,
];

export function sanitizeCandidateText(text: string): string {
  if (!text) return '';
  let cleaned = text;
  for (const pattern of INJECTION_PATTERNS) {
    cleaned = cleaned.replace(pattern, '[SANITIZED_DIRECTIVE]');
  }
  return cleaned.trim();
}

export function wrapAsUntrustedContext(content: string, label: string = 'REFERENCE_DATA'): string {
  const sanitized = sanitizeCandidateText(content);
  return `<untrusted_${label}>\n${sanitized}\n</untrusted_${label}>`;
}

export function extractQuestionsFromText(text: string) {
  const sanitized = sanitizeCandidateText(text);
  const questions: Array<{
    title: string;
    body: string;
    suggestedAnswer?: string;
    difficulty: number;
    seniority: string;
    competencyTags: string[];
  }> = [];

  const isNumbered = /(?:(?:Question|Câu|Q|Topic)\s*\d+[:.]|\n\d+[.)]\s+)/i.test(sanitized);

  if (isNumbered) {
    const blocks = sanitized.split(/(?=(?:(?:Question|Câu|Q|Topic)\s*\d+[:.]|\n\d+[.)]\s+))/i);

    for (const block of blocks) {
      const cleanBlock = block.trim();
      if (cleanBlock.length < 15) continue;

      const parts = cleanBlock.split(/(?:Suggested Answer|Answer|Đáp án|Sample Answer)[:\n]/i);
      const questionPart = parts[0]?.trim();
      const answerPart = parts[1]?.trim();

      if (questionPart && questionPart.length >= 10) {
        const firstLine = questionPart.split('\n')[0].replace(/^[\d.)\s:QQuestionCâuTopic]+/i, '').trim();
        questions.push({
          title: firstLine.slice(0, 120) || 'Interview Question',
          body: questionPart,
          suggestedAnswer: answerPart,
          difficulty: 3.0,
          seniority: 'Mid-level',
          competencyTags: ['Technical Knowledge', 'Problem Solving'],
        });
      }
    }
  } else {
    const paragraphs = sanitized.split(/\n\s*\n/);
    for (const p of paragraphs) {
      const trimmed = p.trim();
      if (trimmed.includes('?') && trimmed.length >= 20) {
        questions.push({
          title: trimmed.slice(0, 100),
          body: trimmed,
          difficulty: 3.0,
          seniority: 'Mid-level',
          competencyTags: ['General Professional'],
        });
      }
    }
  }

  return questions;
}
