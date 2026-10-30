import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CefrLevel } from '@prisma/client';

export class QueryVocabDto {
  @ApiPropertyOptional({ description: 'Search keyword for word or meaning' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Language ID e.g. en, ja, ko, zh' })
  @IsOptional()
  @IsString()
  languageId?: string;

  @ApiPropertyOptional({ enum: CefrLevel })
  @IsOptional()
  @IsEnum(CefrLevel)
  cefrLevel?: CefrLevel;

  @ApiPropertyOptional({ enum: CefrLevel, description: 'Alias for cefrLevel' })
  @IsOptional()
  @IsEnum(CefrLevel)
  cefr?: CefrLevel;

  @ApiPropertyOptional({ description: 'Topic slug e.g. salaries-benefits' })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional({ description: 'Part of speech e.g. n., v., adj.' })
  @IsOptional()
  @IsString()
  partOfSpeech?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({ default: 'word' })
  @IsOptional()
  @IsString()
  sortBy: string = 'word';

  @ApiPropertyOptional({ default: 'asc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'asc';
}
