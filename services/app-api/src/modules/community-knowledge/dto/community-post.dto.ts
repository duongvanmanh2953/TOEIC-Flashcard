import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsNotEmpty,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommunityPostStatus, CommunityReactionType, CommunityCommentStatus } from '@prisma/client';

export class CreateCommunityPostDto {
  @ApiProperty({ description: 'Title of the knowledge post' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Rich text or markdown content' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: 'Topic ID' })
  @IsOptional()
  @IsString()
  topicId?: string;

  @ApiPropertyOptional({ description: 'Tags array', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Language of post', default: 'en' })
  @IsOptional()
  @IsString()
  language?: string = 'en';

  @ApiPropertyOptional({ description: 'Save as draft without submitting for review', default: false })
  @IsOptional()
  @IsBoolean()
  isDraft?: boolean = false;
}

export class UpdateCommunityPostDto {
  @ApiPropertyOptional({ description: 'Title of the knowledge post' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Rich text or markdown content' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'Topic ID' })
  @IsOptional()
  @IsString()
  topicId?: string;

  @ApiPropertyOptional({ description: 'Tags array', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Language of post' })
  @IsOptional()
  @IsString()
  language?: string;
}

export enum CommunitySortBy {
  LATEST = 'latest',
  POPULAR = 'popular',
  TRENDING = 'trending',
  MOST_DISCUSSED = 'most_discussed',
  MOST_SAVED = 'most_saved',
  OLDEST = 'oldest',
}

export class CommunityPostQueryDto {
  @ApiPropertyOptional({ description: 'Cursor ID for high-speed pagination' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Topic ID filter' })
  @IsOptional()
  @IsString()
  topicId?: string;

  @ApiPropertyOptional({ description: 'Tag filter' })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({ description: 'Search keywords across title, summary and tags' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Sort criteria', enum: CommunitySortBy, default: CommunitySortBy.LATEST })
  @IsOptional()
  @IsEnum(CommunitySortBy)
  sortBy?: CommunitySortBy = CommunitySortBy.LATEST;

  @ApiPropertyOptional({ description: 'Language filter' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: 'Filter by specific author ID' })
  @IsOptional()
  @IsString()
  authorId?: string;
}

export class ReactionDto {
  @ApiProperty({ description: 'Reaction type: LIKE, DISLIKE, or NONE', enum: ['LIKE', 'DISLIKE', 'NONE'] })
  @IsString()
  type: 'LIKE' | 'DISLIKE' | 'NONE';
}

export class CreateCommentDto {
  @ApiProperty({ description: 'Comment text content' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: 'Parent comment ID for nested replies' })
  @IsOptional()
  @IsString()
  parentId?: string;
}

export class UpdateCommentDto {
  @ApiProperty({ description: 'Updated comment text content' })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class CommentQueryDto {
  @ApiPropertyOptional({ description: 'Cursor ID for comment pagination' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Parent comment ID (leave empty for root comments)' })
  @IsOptional()
  @IsString()
  parentId?: string;
}

export class RejectPostDto {
  @ApiProperty({ description: 'Reason for rejecting post' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class UpdateTrainingStatusDto {
  @ApiProperty({ description: 'Whether this post is eligible for AI training dataset' })
  @IsBoolean()
  isTrainingEligible: boolean;

  @ApiPropertyOptional({ description: 'Training status (e.g. READY, PROCESSED, EXCLUDED)' })
  @IsOptional()
  @IsString()
  trainingStatus?: string;

  @ApiPropertyOptional({ description: 'Quality score rating (0.0 - 5.0)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  qualityScore?: number;
}

export class CreateTopicDto {
  @ApiProperty({ description: 'Topic display name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Unique slug for URL' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ description: 'Description of the topic' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Lucide icon name' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: 'Accent color hex' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Display order position' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  position?: number;
}

export class UpdateTopicDto {
  @ApiPropertyOptional({ description: 'Topic display name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Description of the topic' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Lucide icon name' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: 'Accent color hex' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Display order position' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  position?: number;

  @ApiPropertyOptional({ description: 'Is topic active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
