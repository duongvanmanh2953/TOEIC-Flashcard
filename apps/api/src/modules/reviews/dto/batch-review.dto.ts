import { IsNotEmpty, IsString, IsInt, IsBoolean, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewItemDto {
  @ApiProperty({ description: 'Vocabulary ID being reviewed' })
  @IsString()
  @IsNotEmpty()
  vocabularyId: string;

  @ApiPropertyOptional({ description: 'Word text' })
  @IsOptional()
  @IsString()
  word?: string;

  @ApiPropertyOptional({ description: 'SRS rating: AGAIN, HARD, GOOD, EASY' })
  @IsOptional()
  @IsString()
  rating?: string;

  @ApiPropertyOptional({ description: 'Exercise type' })
  @IsOptional()
  @IsString()
  exerciseType?: string;

  @ApiPropertyOptional({ description: 'User answer string' })
  @IsOptional()
  @IsString()
  answer?: string;

  @ApiProperty({ description: 'Whether the recall or exercise was correct' })
  @IsBoolean()
  isCorrect: boolean;

  @ApiPropertyOptional({ description: 'User confidence 1 to 5', default: 3 })
  @IsOptional()
  @IsInt()
  confidence?: number;

  @ApiPropertyOptional({ description: 'Response time in ms', default: 1500 })
  @IsOptional()
  @IsInt()
  responseTimeMs?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  hintUsed?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  skipped?: boolean;
}

export class BatchReviewDto {
  @ApiPropertyOptional({ description: 'Existing session ID if initiated via API' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ description: 'Study mode: learn | assess | flashcard | smart', default: 'smart' })
  @IsOptional()
  @IsString()
  studyMode?: string;

  @ApiPropertyOptional({ description: 'Language code e.g. en, zh, ja' })
  @IsOptional()
  @IsString()
  languageId?: string;

  @ApiPropertyOptional({ description: 'Total active study duration in seconds' })
  @IsOptional()
  @IsInt()
  durationSeconds?: number;

  @ApiPropertyOptional({ description: 'Idempotency key to prevent double XP/Streak' })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @ApiProperty({ type: [ReviewItemDto], description: 'List of review records' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewItemDto)
  reviews: ReviewItemDto[];
}

