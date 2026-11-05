import { IsOptional, IsEnum, IsInt, Min, Max, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SessionType } from '@prisma/client';

export class StartSessionDto {
  @ApiPropertyOptional({ enum: SessionType, default: SessionType.SMART_REVIEW })
  @IsOptional()
  @IsEnum(SessionType)
  type?: SessionType = SessionType.SMART_REVIEW;

  @ApiPropertyOptional({ default: 10, description: 'Number of words in this session' })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(50)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Filter review words by language space ID (e.g. en, zh, ja, ko)' })
  @IsOptional()
  @IsString()
  languageId?: string;
}
