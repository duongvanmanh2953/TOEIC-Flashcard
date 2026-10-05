import { IsNotEmpty, IsString, IsOptional, IsArray, ValidateNested, IsBoolean, IsEnum } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CefrLevel, ModerationStatus } from '@prisma/client';

export function transformToCefrLevel(value: any): CefrLevel {
  if (!value) return CefrLevel.B1;
  const clean = String(value).trim().toUpperCase();
  if (Object.values(CefrLevel).includes(clean as CefrLevel)) {
    return clean as CefrLevel;
  }
  if (clean.includes('TẤT CẢ') || clean.includes('ALL') || clean.includes('TỰ DO') || clean.includes('FREE')) return CefrLevel.ALL;
  if (clean.includes('TOPIK 1') || clean.includes('1급') || clean.includes('SƠ CẤP 1') || clean.includes('N5') || clean.includes('HSK 1') || clean.includes('350')) return CefrLevel.A1;
  if (clean.includes('TOPIK 2') || clean.includes('2급') || clean.includes('SƠ CẤP 2') || clean.includes('SƠ CẤP') || clean.includes('N4') || clean.includes('HSK 2') || clean.includes('450')) return CefrLevel.A2;
  if (clean.includes('TOPIK 3') || clean.includes('3급') || clean.includes('TRUNG CẤP 1') || clean.includes('TRUNG CẤP') || clean.includes('N3') || clean.includes('HSK 3') || clean.includes('500') || clean.includes('600')) return CefrLevel.B1;
  if (clean.includes('TOPIK 4') || clean.includes('4급') || clean.includes('TRUNG CẤP 2') || clean.includes('N2') || clean.includes('HSK 4') || clean.includes('650') || clean.includes('750')) return CefrLevel.B2;
  if (clean.includes('TOPIK 5') || clean.includes('5급') || clean.includes('CAO CẤP 1') || clean.includes('CAO CẤP') || clean.includes('N1') || clean.includes('HSK 5') || clean.includes('800') || clean.includes('850')) return CefrLevel.C1;
  if (clean.includes('TOPIK 6') || clean.includes('6급') || clean.includes('CAO CẤP 2') || clean.includes('HSK 6') || clean.includes('900') || clean.includes('950')) return CefrLevel.C2;
  if (clean.includes('4.5') || clean.includes('5.0')) return CefrLevel.B1;
  if (clean.includes('5.5') || clean.includes('6.0') || clean.includes('6.5')) return CefrLevel.B2;
  if (clean.includes('7.0') || clean.includes('7.5') || clean.includes('8.0')) return CefrLevel.C1;
  if (clean.includes('8.5') || clean.includes('9.0')) return CefrLevel.C2;
  return CefrLevel.B1;
}

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
  @Transform(({ value }) => transformToCefrLevel(value))
  @IsEnum(CefrLevel)
  cefrLevel?: CefrLevel = CefrLevel.B2;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean = true;

  @ApiPropertyOptional({ example: 'en', default: 'en' })
  @IsOptional()
  @IsString()
  languageId?: string = 'en';

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isOfficial?: boolean = false;

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
  @Transform(({ value }) => (value !== undefined ? transformToCefrLevel(value) : undefined))
  @IsEnum(CefrLevel)
  cefrLevel?: CefrLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ example: 'en' })
  @IsOptional()
  @IsString()
  languageId?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isOfficial?: boolean;

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
