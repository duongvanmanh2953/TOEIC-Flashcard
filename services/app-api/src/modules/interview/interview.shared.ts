/**
 * services/app-api - AI Interview Studio Types & Domain Contracts (Self-contained)
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

export interface InterviewTurnPayload {
  candidateAnswer: string;
  audioBlobUrl?: string;
  durationSec?: number;
  hintLevelUsed?: number;
  usedSampleAnswer?: boolean;
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

export interface InterviewReportData {
  sessionId: string;
  overallScore: number;
  competencyScore: number;
  languageScore: number;
  strengths: string[];
  weaknesses: string[];
  summaryMd: string;
  questionReviews: any[];
  learningRecommendations: any[];
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
    id: 'ind-BIZ',
    code: 'BIZ',
    name: 'Business & Management',
    nameVi: 'Kinh doanh & Quản lý',
    description: 'Corporate strategy, project delivery, product management, and business operations.',
    icon: 'Briefcase',
    orderIndex: 2,
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
    orderIndex: 3,
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
    ],
  },
  {
    id: 'ind-MKT',
    code: 'MKT',
    name: 'Marketing & Growth',
    nameVi: 'Marketing & Tăng trưởng',
    description: 'Brand strategy, performance marketing, content creation, and search engine optimization.',
    icon: 'Sparkles',
    orderIndex: 4,
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
    id: 'ind-HOSP',
    code: 'HOSP',
    name: 'Hospitality & Tourism',
    nameVi: 'Khách sạn, Du lịch & Dịch vụ Khách hàng',
    description: 'Front office management, luxury guest relations, reservation operations, and culinary hospitality.',
    icon: 'Smile',
    orderIndex: 5,
    positions: [
      {
        id: 'pos-HOSP_FRONT',
        industryId: 'ind-HOSP',
        code: 'HOSP_FRONT',
        title: 'Hotel Front Office & Receptionist',
        titleVi: 'Lễ tân Khách sạn & Bộ phận Tiền sảnh',
        description: 'Delivering exceptional guest reception, handling check-in/out, conflict resolution, and concierge requests in multilingual settings.',
        requiredSkills: ['Customer Service Excellence', 'Multilingual Communication', 'Conflict Resolution', 'Property Management Systems (PMS)'],
        technicalTags: ['Opera PMS', 'VIP Guest Protocol', 'Reservation Handling', 'Emergency Procedures'],
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
