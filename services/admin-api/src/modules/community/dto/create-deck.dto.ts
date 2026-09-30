import { IsNotEmpty, IsString, IsOptional, IsArray, ValidateNested, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CefrLevel, ModerationStatus } from '@prisma/client';

export class CreateWordItemDto {
  @ApiProperty({ example: 'synergy' })
  @IsString()
  @IsNotEmpty()
  word: string;

  @ApiPropertyOptional({ example: '/ˈsɪnədʒi/' })
  @IsOptional()
  @IsString()
  phonetic?: string;

  @ApiPropertyOptional({ example: 'noun' })
  @IsOptional()
  @IsString()
  partOfSpeech?: string;

  @ApiProperty({ example: 'sự cộng hưởng, tác dụng hiệp đồng' })
  @IsString()
  @IsNotEmpty()
  meaning: string;

  @ApiPropertyOptional({ example: 'the combined power of a group of things when working together' })
  @IsOptional()
  @IsString()
  definition?: string;

  @ApiPropertyOptional({ example: 'The team synergy produced amazing project results.' })
  @IsOptional()
  @IsString()
  example?: string;

  @ApiPropertyOptional({ example: 'Sự cộng hưởng của đội ngũ đã mang lại kết quả dự án đáng kinh ngạc.' })
  @IsOptional()
  @IsString()
  exampleTranslation?: string;

  @ApiPropertyOptional({ example: 'Business English' })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional({ example: 'B1' })
  @IsOptional()
  @IsString()
  cefrLevel?: string;
}

export class CreateDeckDto {
  @ApiProperty({ example: 'Essential Startup Pitch Vocabulary' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Must-know vocabulary when pitching to investors' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Business English' })
  @IsOptional()
  @IsString()
  category?: string = 'Business English';

  @ApiPropertyOptional({ enum: CefrLevel, default: CefrLevel.B2 })
  @IsOptional()
  @IsEnum(CefrLevel)
  cefrLevel?: CefrLevel = CefrLevel.B2;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean = true;

  @ApiPropertyOptional({ example: 'Secret123!' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ type: [CreateWordItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWordItemDto)
  words: CreateWordItemDto[];
}

export class UnlockDeckDto {
  @ApiProperty({ example: 'Secret123!' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class SyncCloudDto {
  @ApiPropertyOptional({ type: [CreateWordItemDto] })
  @IsOptional()
  @IsArray()
  words?: CreateWordItemDto[];

  @ApiPropertyOptional({ type: [CreateDeckDto] })
  @IsOptional()
  @IsArray()
  decks?: any[];
}

export class UpdateDeckDto {
  @ApiPropertyOptional({ example: 'Updated Deck Title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Business English' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: CefrLevel })
  @IsOptional()
  @IsEnum(CefrLevel)
  cefrLevel?: CefrLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ example: 'NewSecret123!' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ enum: ModerationStatus })
  @IsOptional()
  @IsEnum(ModerationStatus)
  status?: ModerationStatus;
}

export class UpdateWordItemDto {
  @ApiPropertyOptional({ example: 'synergy' })
  @IsOptional()
  @IsString()
  word?: string;

  @ApiPropertyOptional({ example: '/ˈsɪnədʒi/' })
  @IsOptional()
  @IsString()
  phonetic?: string;

  @ApiPropertyOptional({ example: 'noun' })
  @IsOptional()
  @IsString()
  partOfSpeech?: string;

  @ApiPropertyOptional({ example: 'sự cộng hưởng' })
  @IsOptional()
  @IsString()
  meaning?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  definition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  example?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  exampleTranslation?: string;

  @ApiPropertyOptional({ example: 'Business English' })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional({ example: 'B1' })
  @IsOptional()
  @IsString()
  cefrLevel?: string;

  @ApiPropertyOptional({ example: 'LEARNING' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;
}

export class BulkDeleteDto {
  @ApiProperty({ example: ['id1', 'id2'] })
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
