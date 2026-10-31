import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InterviewRagService } from './interview-rag.service';

export interface IngestDocumentPayload {
  userId: string;
  title: string;
  fileName: string;
  fileMime: string;
  fileSize: number;
  rawText: string;
  industryCode: string;
  languageCode: string;
  isPrivate: boolean;
  contributeToCommunity?: boolean;
}

export interface ExtractedQuestion {
  title: string;
  body: string;
  suggestedAnswer?: string;
  difficulty: number;
  seniority: string;
  competencyTags: string[];
}

@Injectable()
export class InterviewDocumentService {
  private readonly logger = new Logger(InterviewDocumentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ragService: InterviewRagService,
  ) {}

  /**
   * Parse raw text and extract structured interview questions (Phần 3.2 - 3.3)
   */
  extractQuestionsFromText(text: string): ExtractedQuestion[] {
    const sanitized = this.ragService.sanitizeCandidateText(text);
    const questions: ExtractedQuestion[] = [];

    // 1. Try splitting by numbered patterns: "Question 1:", "Câu 1:", "1.", "Q1:"
    const blocks = sanitized.split(/(?=(?:(?:Question|Câu|Q|Topic)\s*\d+[:.]|\n\d+[.)]\s+))/i);

    for (const block of blocks) {
      const cleanBlock = block.trim();
      if (cleanBlock.length < 15) continue;

      // Extract Question part vs Suggested Answer part if separated by "Answer:", "Đáp án:", "Suggested Answer:"
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

    // 2. Fallback if no clear numbered patterns: split into paragraphs with question marks
    if (questions.length === 0) {
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

  /**
   * Ingest and store document with Privacy Isolation & Optional Community Contribution (Phần 4.1)
   */
  async ingestDocument(payload: IngestDocumentPayload) {
    const {
      userId,
      title,
      fileName,
      fileMime,
      fileSize,
      rawText,
      industryCode,
      languageCode,
      isPrivate,
      contributeToCommunity,
    } = payload;

    if (!rawText || rawText.trim().length === 0) {
      throw new BadRequestException('Tài liệu trống, không thể trích xuất nội dung.');
    }

    if (fileSize > 15 * 1024 * 1024) {
      throw new BadRequestException('Kích thước file vượt quá giới hạn tối đa 15MB.');
    }

    const questions = this.extractQuestionsFromText(rawText);

    // 1. Save document record
    const doc = await this.prisma.interviewDocument.create({
      data: {
        userId,
        title: title || fileName,
        fileName,
        fileMime,
        fileSize,
        extractedText: this.ragService.sanitizeCandidateText(rawText).slice(0, 200000), // Max text storage
        questionCount: questions.length,
        isPrivate: isPrivate ?? true,
        status: 'PARSED',
      },
    });

    // 2. If user voluntarily chooses Community Contribution, record audit consent & pending review
    if (contributeToCommunity) {
      await this.prisma.interviewContribution.create({
        data: {
          documentId: doc.id,
          userId,
          consentAccepted: true,
          consentVersion: '2.0.0-PROD',
          consentTimestamp: new Date(),
          status: 'PENDING',
        },
      });
    }

    // 3. Save extracted questions into database
    for (const q of questions) {
      await this.prisma.interviewQuestion.create({
        data: {
          industryCode,
          title: q.title,
          body: q.body,
          suggestedAnswer: q.suggestedAnswer,
          difficulty: q.difficulty,
          seniority: q.seniority,
          competencyTags: q.competencyTags,
          language: languageCode || 'en',
          source: contributeToCommunity ? 'COMMUNITY' : 'PRIVATE',
          sourceDocId: doc.id,
          ownerId: userId,
          isApproved: !contributeToCommunity, // Private is immediately approved for user, Community requires admin approval
        },
      });
    }

    // 4. Index chunks for RAG Retrieval (Isolated to PRIVATE for this owner unless approved)
    const chunks = rawText
      .split(/\n\s*\n/)
      .map((c) => c.trim())
      .filter((c) => c.length >= 40);

    await this.ragService.indexDocumentChunks(
      doc.id,
      userId,
      isPrivate ? 'PRIVATE' : 'COMMUNITY',
      industryCode,
      languageCode,
      chunks.slice(0, 20)
    );

    return {
      documentId: doc.id,
      title: doc.title,
      fileName: doc.fileName,
      extractedQuestionCount: questions.length,
      questions,
      isPrivate: doc.isPrivate,
      isSubmittedForCommunityReview: Boolean(contributeToCommunity),
    };
  }

  /**
   * User proposes a new industry or position taxonomy (Phần 4.2)
   */
  async submitCategoryProposal(userId: string, data: {
    proposedType: 'INDUSTRY' | 'POSITION';
    name: string;
    parentCategory?: string;
    description?: string;
    exampleQuestions?: string[];
  }) {
    if (!data.name || data.name.trim().length < 2) {
      throw new BadRequestException('Tên ngành nghề hoặc vị trí đề xuất không hợp lệ.');
    }

    return this.prisma.interviewCategoryProposal.create({
      data: {
        userId,
        proposedType: data.proposedType,
        name: data.name.trim(),
        parentCategory: data.parentCategory,
        description: data.description,
        exampleQuestions: data.exampleQuestions || [],
        status: 'PENDING',
      },
    });
  }

  /**
   * Admin Review Center: List community contributions pending approval (Phần 4.3)
   */
  async getPendingContributions() {
    return this.prisma.interviewContribution.findMany({
      where: { status: 'PENDING' },
      include: {
        document: true,
        user: { select: { id: true, displayName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Admin Review Center: Approve or reject community contribution
   */
  async reviewContribution(contributionId: string, adminUserId: string, action: 'APPROVE' | 'REJECT', notes?: string) {
    const contribution = await this.prisma.interviewContribution.findUnique({
      where: { id: contributionId },
      include: { document: true },
    });

    if (!contribution) throw new BadRequestException('Contribution not found');

    const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    await this.prisma.interviewContribution.update({
      where: { id: contributionId },
      data: {
        status,
        adminNotes: notes,
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
      },
    });

    if (action === 'APPROVE') {
      // Mark questions as approved for community
      await this.prisma.interviewQuestion.updateMany({
        where: { sourceDocId: contribution.documentId },
        data: { isApproved: true, source: 'COMMUNITY' },
      });

      // Update RAG chunks visibility to COMMUNITY
      await this.prisma.interviewKnowledgeChunk.updateMany({
        where: { documentId: contribution.documentId },
        data: { visibility: 'COMMUNITY' },
      });
    }

    return { success: true, status };
  }
}
