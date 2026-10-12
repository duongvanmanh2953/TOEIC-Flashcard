import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateTrainingStatusDto } from './dto/community-post.dto';
import { CommunityPostStatus, CommunityCommentStatus } from '@prisma/client';

export interface DatasetExportOptions {
  topicId?: string;
  language?: string;
  minQualityScore?: number;
  limit?: number;
}

@Injectable()
export class TrainingDataService {
  private readonly logger = new Logger(TrainingDataService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves high-quality approved community knowledge records eligible for AI training/fine-tuning.
   */
  async getEligiblePosts(options: DatasetExportOptions = {}) {
    const { topicId, language, minQualityScore = 0.5, limit = 500 } = options;

    return await this.prisma.communityPost.findMany({
      where: {
        status: CommunityPostStatus.APPROVED,
        deletedAt: null,
        isTrainingEligible: true,
        qualityScore: { gte: minQualityScore },
        ...(topicId ? { topicId } : {}),
        ...(language ? { language } : {}),
      },
      take: limit,
      orderBy: [
        { qualityScore: 'desc' },
        { likeCount: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        topic: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        author: {
          select: {
            id: true,
            displayName: true,
          },
        },
        comments: {
          where: {
            status: CommunityCommentStatus.ACTIVE,
            deletedAt: null,
            isTrainingEligible: true,
          },
          take: 5,
          orderBy: { likeCount: 'desc' },
          select: {
            id: true,
            content: true,
            likeCount: true,
            createdAt: true,
          },
        },
      },
    });
  }

  /**
   * Generates a standard JSONL string structured for LLM instruction fine-tuning / evaluation.
   */
  async exportDatasetJsonl(options: DatasetExportOptions = {}): Promise<string> {
    const posts = await this.getEligiblePosts(options);

    const jsonlLines = posts.map((post) => {
      const topicName = post.topic?.name || 'English Learning';
      const prompt = `Topic: ${topicName}\nTitle: ${post.title}\nTags: ${post.tags.join(', ')}`;

      let assistantResponse = post.content;
      if (post.comments && post.comments.length > 0) {
        const topNotes = post.comments
          .filter((c) => c.likeCount > 0)
          .map((c) => `- Community insight: ${c.content}`)
          .join('\n');
        if (topNotes) {
          assistantResponse += `\n\n### Community Insights & Additional Notes:\n${topNotes}`;
        }
      }

      const record = {
        messages: [
          {
            role: 'system',
            content:
              'You are VocabFlow AI, an elite English education and linguistic knowledge tutor specializing in TOEIC, grammar, nuanced vocabulary, and natural usage.',
          },
          {
            role: 'user',
            content: `Explain and provide deep learning knowledge on:\n${prompt}`,
          },
          {
            role: 'assistant',
            content: assistantResponse,
          },
        ],
        provenance: {
          source: 'community_knowledge',
          postId: post.id,
          authorId: post.authorId,
          topicSlug: post.topic?.slug || 'general',
          language: post.language,
          qualityScore: post.qualityScore,
          metrics: {
            likes: post.likeCount,
            comments: post.commentCount,
            saves: post.saveCount,
            shares: post.shareCount,
          },
          approvedAt: post.moderatedAt,
          exportedAt: new Date().toISOString(),
        },
      };

      return JSON.stringify(record);
    });

    return jsonlLines.join('\n');
  }

  /**
   * Updates training eligibility and quality score for a community post.
   */
  async updatePostTrainingEligibility(postId: string, dto: UpdateTrainingStatusDto) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const updated = await this.prisma.communityPost.update({
      where: { id: postId },
      data: {
        isTrainingEligible: dto.isTrainingEligible,
        trainingStatus: dto.trainingStatus || post.trainingStatus,
        qualityScore: dto.qualityScore !== undefined ? dto.qualityScore : post.qualityScore,
      },
    });

    return updated;
  }
}
