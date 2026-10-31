import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface PredefinedIndustry {
  code: string;
  name: string;
  nameVi: string;
  description: string;
  icon: string;
  orderIndex: number;
  positions: Array<{
    code: string;
    title: string;
    titleVi: string;
    description: string;
    requiredSkills: string[];
    technicalTags: string[];
  }>;
}

export const PREDEFINED_TAXONOMY: PredefinedIndustry[] = [
  {
    code: 'TECH',
    name: 'Technology',
    nameVi: 'Công nghệ thông tin & Phần mềm',
    description: 'Software Engineering, AI/ML, DevOps, Cloud, and Data Systems.',
    icon: 'Cpu',
    orderIndex: 1,
    positions: [
      {
        code: 'TECH_FE',
        title: 'Frontend Developer',
        titleVi: 'Kỹ sư Phát triển Frontend (React, Vue, TypeScript)',
        description: 'Building high-performance, accessible, and responsive user interfaces with modern web standards.',
        requiredSkills: ['React', 'TypeScript', 'State Management', 'Web Performance', 'REST/GraphQL APIs', 'CSS Architecture'],
        technicalTags: ['Next.js', 'Vite', 'Tailwind CSS', 'Redux/Zustand', 'DOM & Canvas', 'Jest/Vitest'],
      },
      {
        code: 'TECH_BE',
        title: 'Backend Developer',
        titleVi: 'Kỹ sư Phát triển Backend (Node.js, Go, Python, Java)',
        description: 'Architecting resilient distributed microservices, database schemas, and high-throughput APIs.',
        requiredSkills: ['Node.js/NestJS', 'PostgreSQL', 'Redis Caching', 'Microservices Architecture', 'Docker & Kubernetes', 'System Design'],
        technicalTags: ['Prisma ORM', 'RabbitMQ/Kafka', 'OAuth2/JWT', 'REST & gRPC', 'Event-Driven Design', 'CI/CD Pipelines'],
      },
      {
        code: 'TECH_AI',
        title: 'AI / Machine Learning Engineer',
        titleVi: 'Kỹ sư Trí tuệ nhân tạo & RAG (LLMs, PyTorch, Vector DBs)',
        description: 'Engineering Large Language Model applications, RAG pipelines, fine-tuning, and model inference optimization.',
        requiredSkills: ['Python', 'PyTorch/TensorFlow', 'Vector Databases', 'Prompt Engineering', 'RAG Architecture', 'Model Evaluation'],
        technicalTags: ['LangChain/LlamaIndex', 'Qdrant/pgvector', 'HuggingFace', 'Embeddings', 'Transformer Architectures'],
      },
      {
        code: 'TECH_MOBILE',
        title: 'Mobile App Developer',
        titleVi: 'Kỹ sư Phát triển Ứng dụng Di động (Flutter, React Native, Swift)',
        description: 'Creating cross-platform and native mobile experiences with offline storage and native performance.',
        requiredSkills: ['React Native / Flutter', 'Mobile UX Patterns', 'Push Notifications', 'Native Bridges', 'App Store / Play Store Deployment'],
        technicalTags: ['Expo', 'SQLite', 'Redux', 'Biometric Auth', 'WebSocket Realtime'],
      },
      {
        code: 'TECH_QA',
        title: 'QA / Automation Test Engineer',
        titleVi: 'Kỹ sư Kiểm thử Chất lượng Phần mềm (Manual & Automation)',
        description: 'Designing end-to-end testing frameworks, regression pipelines, and performance benchmark suites.',
        requiredSkills: ['Test Automation', 'Selenium / Playwright / Cypress', 'API Testing', 'Performance Testing', 'CI/CD Integration'],
        technicalTags: ['Postman', 'k6/JMeter', 'BDD / Cucumber', 'Bug Life Cycle', 'Coverage Reports'],
      },
    ],
  },
  {
    code: 'BIZ',
    name: 'Business & Management',
    nameVi: 'Kinh doanh & Quản lý',
    description: 'Corporate strategy, project delivery, product management, and business operations.',
    icon: 'Briefcase',
    orderIndex: 2,
    positions: [
      {
        code: 'BIZ_PM',
        title: 'Product Manager',
        titleVi: 'Giám đốc Sản phẩm (Product Management)',
        description: 'Driving product vision, discovery, market research, roadmap prioritization, and cross-functional leadership.',
        requiredSkills: ['Product Strategy', 'User Discovery', 'Agile/Scrum', 'Data-Informed Prioritization', 'Stakeholder Alignment'],
        technicalTags: ['A/B Testing', 'OKRs & KPIs', 'PRDs & User Stories', 'Mixpanel / Amplitude', 'GTM Strategy'],
      },
      {
        code: 'BIZ_BA',
        title: 'Business Analyst',
        titleVi: 'Chuyên viên Phân tích Nghiệp vụ (Business Analysis)',
        description: 'Bridging business stakeholders and engineering teams with detailed requirement specifications.',
        requiredSkills: ['Requirement Gathering', 'Process Modeling (BPMN)', 'UML & Wireframing', 'SQL Querying', 'User Acceptance Testing'],
        technicalTags: ['Jira / Confluence', 'Data Flow Diagrams', 'Gap Analysis', 'Feasibility Studies'],
      },
      {
        code: 'BIZ_BD',
        title: 'Business Development Specialist',
        titleVi: 'Chuyên viên Phát triển Đối tác & Kinh doanh B2B',
        description: 'Identifying market opportunities, leading contract negotiations, and nurturing long-term strategic alliances.',
        requiredSkills: ['B2B Sales', 'Contract Negotiation', 'Lead Qualification', 'Market Expansion', 'Client Relationship Management'],
        technicalTags: ['Salesforce / HubSpot', 'Cold Outreach', 'Pitch Decks', 'Revenue Modeling'],
      },
    ],
  },
  {
    code: 'FIN',
    name: 'Finance & Banking',
    nameVi: 'Tài chính & Ngân hàng',
    description: 'Financial accounting, corporate audit, investment analysis, and retail banking.',
    icon: 'TrendingUp',
    orderIndex: 3,
    positions: [
      {
        code: 'FIN_ANALYST',
        title: 'Financial Analyst',
        titleVi: 'Chuyên viên Phân tích Tài chính',
        description: 'Conducting financial modeling, forecasting, variance analysis, and evaluating capital investments.',
        requiredSkills: ['Financial Modeling', 'DCF Valuation', 'Excel Mastery', 'Ratio Analysis', 'Management Reporting'],
        technicalTags: ['Balance Sheet / P&L', 'CAPEX Planning', 'Power BI / Tableau', 'Bloomberg Terminal'],
      },
      {
        code: 'FIN_AUDITOR',
        title: 'Internal & External Auditor',
        titleVi: 'Kiểm toán viên Nội bộ / Độc lập',
        description: 'Evaluating internal controls, regulatory compliance, risk management, and financial statement accuracy.',
        requiredSkills: ['Audit Standards (ISA)', 'Internal Controls (COSO)', 'Risk Assessment', 'Compliance', 'Audit Trail Testing'],
        technicalTags: ['IFRS / GAAP', 'Fraud Risk Management', 'Working Papers', 'Sampling Techniques'],
      },
    ],
  },
  {
    code: 'MKT',
    name: 'Marketing & Growth',
    nameVi: 'Marketing & Tăng trưởng',
    description: 'Brand strategy, performance marketing, content creation, and search engine optimization.',
    icon: 'Sparkles',
    orderIndex: 4,
    positions: [
      {
        code: 'MKT_DIGITAL',
        title: 'Digital Marketing & Growth Specialist',
        titleVi: 'Chuyên viên Digital Marketing & Tăng trưởng',
        description: 'Executing multi-channel acquisition campaigns, paid ads, funnel optimization, and conversion rate growth.',
        requiredSkills: ['Performance Ads (Meta/Google)', 'Conversion Rate Optimization', 'Analytics & Attribution', 'Funnel Design'],
        technicalTags: ['Google Analytics 4', 'Tag Manager', 'ROAS Optimization', 'Email Automation'],
      },
      {
        code: 'MKT_CONTENT',
        title: 'Content Strategist & Copywriter',
        titleVi: 'Chuyên viên Chiến lược Nội dung & Truyền thông',
        description: 'Crafting compelling narratives, brand voice, thought leadership content, and SEO-optimized messaging.',
        requiredSkills: ['Copywriting', 'SEO Content Strategy', 'Brand Storytelling', 'Content Calendar Management', 'Editorial Quality'],
        technicalTags: ['Ahrefs / SEMrush', 'Long-form Articles', 'Social Media Campaigns', 'Video Scripts'],
      },
    ],
  },
  {
    code: 'HOSP',
    name: 'Hospitality & Tourism',
    nameVi: 'Khách sạn, Du lịch & Dịch vụ Khách hàng',
    description: 'Front office management, luxury guest relations, reservation operations, and culinary hospitality.',
    icon: 'Smile',
    orderIndex: 5,
    positions: [
      {
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
    code: 'EDU',
    name: 'Education & Academic Teaching',
    nameVi: 'Giáo dục & Đào tạo Ngôn ngữ',
    description: 'Language instruction, curriculum development, classroom management, and student assessment.',
    icon: 'GraduationCap',
    orderIndex: 6,
    positions: [
      {
        code: 'EDU_TEACHER',
        title: 'English Language Teacher / Lecturer',
        titleVi: 'Giáo viên Tiếng Anh / Giảng viên Học thuật',
        description: 'Delivering interactive language lessons, preparing students for standardized tests (IELTS, TOEIC), and fostering learner autonomy.',
        requiredSkills: ['Pedagogy & Lesson Planning', 'Classroom Management', 'IELTS/TOEIC Prep', 'Assessment & Feedback', 'Differentiated Instruction'],
        technicalTags: ['TESOL/CELTA', 'CEFR Standards', 'Interactive Learning', 'EdTech Tools'],
      },
    ],
  },
];

@Injectable()
export class InterviewTaxonomyService implements OnModuleInit {
  private readonly logger = new Logger(InterviewTaxonomyService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedTaxonomyIfEmpty();
  }

  /**
   * Automatically seed initial industries and positions into database if not present
   */
  async seedTaxonomyIfEmpty() {
    try {
      const count = await this.prisma.interviewIndustry.count();
      if (count === 0) {
        this.logger.log('Seeding Interview Taxonomy (Industries & Positions)...');
        for (const ind of PREDEFINED_TAXONOMY) {
          const createdInd = await this.prisma.interviewIndustry.create({
            data: {
              code: ind.code,
              name: ind.name,
              nameVi: ind.nameVi,
              description: ind.description,
              icon: ind.icon,
              orderIndex: ind.orderIndex,
            },
          });

          for (const pos of ind.positions) {
            await this.prisma.interviewPosition.create({
              data: {
                industryId: createdInd.id,
                code: pos.code,
                title: pos.title,
                titleVi: pos.titleVi,
                description: pos.description,
                requiredSkills: pos.requiredSkills,
                technicalTags: pos.technicalTags,
              },
            });
          }
        }
        this.logger.log('Seeded Interview Taxonomy successfully.');
      }
    } catch (err: any) {
      this.logger.warn(`Taxonomy seeding skipped or already present: ${err.message}`);
    }
  }

  /**
   * Retrieve all industries with active positions
   */
  async getAllIndustries() {
    try {
      const dbIndustries = await this.prisma.interviewIndustry.findMany({
        orderBy: { orderIndex: 'asc' },
        include: {
          positions: {
            orderBy: { title: 'asc' },
          },
        },
      });

      if (dbIndustries.length > 0) {
        return dbIndustries;
      }
    } catch {
      // Fallback to in-memory predefined taxonomy if DB table is initializing
    }

    return PREDEFINED_TAXONOMY.map((ind, idx) => ({
      id: `ind-${ind.code}`,
      code: ind.code,
      name: ind.name,
      nameVi: ind.nameVi,
      description: ind.description,
      icon: ind.icon,
      orderIndex: idx + 1,
      positions: ind.positions.map((p) => ({
        id: `pos-${p.code}`,
        industryId: `ind-${ind.code}`,
        code: p.code,
        title: p.title,
        titleVi: p.titleVi,
        description: p.description,
        requiredSkills: p.requiredSkills,
        technicalTags: p.technicalTags,
      })),
    }));
  }

  /**
   * Find specific position by code or ID
   */
  async findPosition(positionCodeOrId: string) {
    try {
      const found = await this.prisma.interviewPosition.findFirst({
        where: {
          OR: [{ code: positionCodeOrId }, { id: positionCodeOrId }, { title: { contains: positionCodeOrId, mode: 'insensitive' } }],
        },
        include: { industry: true },
      });
      if (found) return found;
    } catch {}

    for (const ind of PREDEFINED_TAXONOMY) {
      for (const pos of ind.positions) {
        if (pos.code === positionCodeOrId || pos.title.toLowerCase().includes(positionCodeOrId.toLowerCase())) {
          return {
            id: `pos-${pos.code}`,
            industryId: `ind-${ind.code}`,
            code: pos.code,
            title: pos.title,
            titleVi: pos.titleVi,
            description: pos.description,
            requiredSkills: pos.requiredSkills,
            technicalTags: pos.technicalTags,
            industry: {
              id: `ind-${ind.code}`,
              code: ind.code,
              name: ind.name,
              nameVi: ind.nameVi,
            },
          };
        }
      }
    }
    return null;
  }
}
