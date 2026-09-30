import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExamStatus, QuestionType, QuestionDifficulty } from '@prisma/client';

export class CreateOptionDto {
  @IsString()
  @IsNotEmpty()
  key: string; // A, B, C, D...

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

export class CreateQuestionDto {
  @IsOptional()
  @IsNumber()
  questionNumber?: number;

  @IsString()
  @IsNotEmpty()
  questionText: string;

  @IsOptional()
  @IsString()
  questionHtml?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  audioUrl?: string;

  @IsOptional()
  @IsEnum(QuestionType)
  questionType?: QuestionType;

  @IsNotEmpty()
  correctAnswer: any; // e.g. ["B"] or ["A", "C"] or "completed"

  @IsOptional()
  @IsArray()
  acceptedAnswers?: string[];

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsString()
  sourceExplanation?: string;

  @IsOptional()
  optionExplanations?: Record<string, string>;

  @IsOptional()
  @IsString()
  grammarType?: string;

  @IsOptional()
  @IsString()
  partOfSpeech?: string;

  @IsOptional()
  @IsEnum(QuestionDifficulty)
  difficulty?: QuestionDifficulty;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  skill?: string;

  @IsOptional()
  @IsNumber()
  points?: number;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsArray()
  vocabularyIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  options?: CreateOptionDto[];

  @IsOptional()
  @IsNumber()
  rowNumber?: number;

  @IsOptional()
  @IsArray()
  warnings?: string[];
}

export class CreateExamDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsString()
  languageId?: string;

  @IsOptional()
  @IsString()
  examType?: string; // TOEIC, IELTS, HSK, JLPT, TOPIK, SAT, THPT, GENERAL_QUIZ, CUSTOM

  @IsOptional()
  @IsString()
  section?: string;

  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  durationMinutes?: number;

  @IsOptional()
  @IsNumber()
  totalScore?: number;

  @IsOptional()
  @IsNumber()
  passingScore?: number;

  @IsOptional()
  @IsEnum(ExamStatus)
  status?: ExamStatus;

  @IsOptional()
  @IsBoolean()
  isProtected?: boolean;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions?: CreateQuestionDto[];
}

export class UpdateExamDto extends CreateExamDto {}

export class AnswerItemDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsNotEmpty()
  selectedAnswer: any; // e.g. ["B"] or ["A", "C"] or "completed"

  @IsOptional()
  @IsNumber()
  timeSpentSeconds?: number;
}

export class SubmitExamAttemptDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerItemDto)
  answers: AnswerItemDto[];
}
