import { IsString, IsOptional, IsArray, IsBoolean, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNoteDto {
  @ApiProperty({ description: 'Note title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Rich text or markdown note content' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Note category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Tags array', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Whether the note is pinned at the top' })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;
}

export class UpdateNoteDto {
  @ApiPropertyOptional({ description: 'Note title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Rich text or markdown note content' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'Note category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Tags array', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Whether the note is pinned at the top' })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional({ description: 'Whether the note is archived' })
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}

export enum NoteSortBy {
  LATEST = 'latest',
  OLDEST = 'oldest',
  UPDATED = 'updated',
  TITLE = 'title',
}

export class NoteQueryDto {
  @ApiPropertyOptional({ description: 'Cursor ID for high-performance pagination' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ description: 'Number of items to fetch (max 100)', default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 30;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Search keyword across title, tags and content' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by archived status', default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isArchived?: boolean = false;

  @ApiPropertyOptional({ description: 'Filter by pinned status' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional({ description: 'Filter by tag' })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({ description: 'Sort criteria', enum: NoteSortBy, default: NoteSortBy.LATEST })
  @IsOptional()
  @IsEnum(NoteSortBy)
  sortBy?: NoteSortBy = NoteSortBy.LATEST;
}

export class CreateCategoryDto {
  @ApiProperty({ description: 'Category name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Category description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Color hex code or identifier' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Lucide icon identifier' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: 'Display order position' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  position?: number;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({ description: 'Category name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Category description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Color hex code' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Lucide icon identifier' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: 'Display order position' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  position?: number;

  @ApiPropertyOptional({ description: 'Archive category' })
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}

export class ReorderCategoriesDto {
  @ApiProperty({ description: 'Ordered array of category IDs', type: [String] })
  @IsArray()
  @IsString({ each: true })
  orderedIds: string[];
}
