import { IsNotEmpty, IsString, IsOptional, IsArray, ValidateNested, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CefrLevel } from '@prisma/client';

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

  @ApiProperty({ type: [CreateWordItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWordItemDto)
  words: CreateWordItemDto[];
}
