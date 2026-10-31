import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface RetrievalQuery {
  industryCode: string;
  positionCode?: string;
  languageCode: string;
  queryText: string;
  requesterUserId?: string;
  limit?: number;
}

export interface RetrievedChunk {
  id: string;
  content: string;
  source: 'CURATED' | 'COMMUNITY' | 'PRIVATE';
  relevanceScore: number;
  matchedKeywords: string[];
}

@Injectable()
export class InterviewRagService {
  private readonly logger = new Logger(InterviewRagService.name);

  // Prompt injection patterns to neutralize from ingested documents or user responses
  private readonly INJECTION_PATTERNS = [
    /ignore (all )?previous instructions/gi,
    /system prompt/gi,
    /you are now (an? )?unrestricted/gi,
    /disregard (the )?system/gi,
    /act as (a )?jailbroken/gi,
    /repeat the system prompt/gi,
    /reveal your instructions/gi,
  ];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Neutralize prompt injection attempts inside untrusted candidate text
   */
  sanitizeCandidateText(text: string): string {
    if (!text) return '';
    let cleaned = text;
    for (const pattern of this.INJECTION_PATTERNS) {
      cleaned = cleaned.replace(pattern, '[SANITIZED_DIRECTIVE]');
    }
    return cleaned.trim();
  }

  /**
   * Wrap candidate-provided or document-provided context into strict boundary tags
   */
  wrapAsUntrustedContext(content: string, label: string = 'REFERENCE_DATA'): string {
    const sanitized = this.sanitizeCandidateText(content);
    return `<untrusted_${label}>\n${sanitized}\n</untrusted_${label}>`;
  }

  /**
   * Hybrid RAG Retrieval with strict Multi-Tenant & Privacy Isolation (SEC-INT-001)
   */
  async retrieveRelevantKnowledge(query: RetrievalQuery): Promise<RetrievedChunk[]> {
    const { industryCode, positionCode, languageCode, queryText, requesterUserId, limit = 4 } = query;
    const tokens = this.tokenizeKeywords(queryText);

    try {
      // 1. Construct strict authorization where-clause
      // Accessible chunks:
      // - CURATED: system approved
      // - COMMUNITY: approved by admin
      // - PRIVATE: strictly owned by requesterUserId (NEVER exposed to other users)
      const orVisibilityConditions: any[] = [
        { visibility: 'CURATED' },
        { visibility: 'COMMUNITY' },
      ];

      if (requesterUserId) {
        orVisibilityConditions.push({
          visibility: 'PRIVATE',
          ownerId: requesterUserId,
        });
      }

      // 2. Fetch candidate chunks matching language & industry
      const rawChunks = await this.prisma.interviewKnowledgeChunk.findMany({
        where: {
          industryCode,
          languageCode,
          OR: orVisibilityConditions,
        },
        take: 30,
      });

      if (rawChunks.length === 0) {
        return this.getFallbackKnowledge(industryCode, tokens);
      }

      // 3. Score chunks by hybrid relevance (Keyword overlap + exact terminology)
      const scored = rawChunks.map((chunk) => {
        let score = 0;
        const matched: string[] = [];
        const contentLower = chunk.content.toLowerCase();

        for (const token of tokens) {
          if (contentLower.includes(token)) {
            score += 2;
            matched.push(token);
          }
        }

        // Boost if matches specific position
        if (positionCode && chunk.positionCode === positionCode) {
          score += 3;
        }

        return {
          id: chunk.id,
          content: this.sanitizeCandidateText(chunk.content),
          source: chunk.visibility as 'CURATED' | 'COMMUNITY' | 'PRIVATE',
          relevanceScore: score,
          matchedKeywords: matched,
        };
      });

      // 4. Sort and return top chunks
      scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
      return scored.slice(0, limit);
    } catch (err: any) {
      this.logger.warn(`RAG Retrieval fallback applied: ${err.message}`);
      return this.getFallbackKnowledge(industryCode, tokens);
    }
  }

  /**
   * Store and index newly chunked knowledge items
   */
  async indexDocumentChunks(
    documentId: string,
    ownerId: string,
    visibility: 'PRIVATE' | 'COMMUNITY',
    industryCode: string,
    languageCode: string,
    chunks: string[]
  ) {
    const created = [];
    for (const content of chunks) {
      const sanitized = this.sanitizeCandidateText(content);
      const keywords = this.tokenizeKeywords(sanitized).slice(0, 10);

      const chunk = await this.prisma.interviewKnowledgeChunk.create({
        data: {
          documentId,
          ownerId,
          visibility,
          industryCode,
          languageCode,
          content: sanitized,
          keywords,
        },
      });
      created.push(chunk);
    }
    return created;
  }

  private tokenizeKeywords(text: string): string[] {
    if (!text) return [];
    return text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !['the', 'and', 'for', 'with', 'this', 'that', 'của', 'và', 'các', 'cho'].includes(w));
  }

  private getFallbackKnowledge(industryCode: string, tokens: string[]): RetrievedChunk[] {
    const fallbackRubrics: Record<string, string> = {
      TECH: 'Technical Rubric: Evaluates problem diagnosis, clean architecture, performance tradeoffs, and quantitative outcomes.',
      BIZ: 'Business Rubric: Evaluates stakeholder management, market sizing, ROI prioritization, and cross-functional leadership.',
      FIN: 'Finance Rubric: Evaluates DCF valuation, variance analysis, regulatory compliance (IFRS/GAAP), and cash flow forecasting.',
      MKT: 'Marketing Rubric: Evaluates CAC/LTV unit economics, attribution models, conversion funnels, and organic brand narrative.',
      HOSP: 'Hospitality Rubric: Evaluates guest empathy, service recovery protocol, conflict de-escalation, and international etiquette.',
      EDU: 'Education Rubric: Evaluates pedagogical pacing, differentiated instruction, learner motivation, and formative assessment.',
    };

    const content = fallbackRubrics[industryCode] || 'General Professional Rubric: Evaluates clarity, structured problem solving, and relevance.';
    return [
      {
        id: `fallback-${industryCode}`,
        content,
        source: 'CURATED',
        relevanceScore: 1,
        matchedKeywords: tokens.slice(0, 3),
      },
    ];
  }
}
