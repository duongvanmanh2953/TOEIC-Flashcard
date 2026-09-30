import { IsNotEmpty, IsString, IsInt, IsBoolean, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitAnswerDto {
  @ApiProperty({ description: 'Vocabulary ID being tested' })
  @IsString()
  @IsNotEmpty()
  vocabularyId: string;

  @ApiProperty({ description: 'User answer string' })
  @IsString()
  @IsNotEmpty()
  answer: string;

  @ApiProperty({ description: 'Time taken in milliseconds', example: 2400 })
  @IsInt()
  @Min(0)
  responseTimeMs: number;

  @ApiProperty({ description: 'User confidence rating 1 (guessing) to 5 (absolute)', example: 4 })
  @IsInt()
  @Min(1)
  @Max(5)
  confidence: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  hintUsed?: boolean = false;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  skipped?: boolean = false;
}
