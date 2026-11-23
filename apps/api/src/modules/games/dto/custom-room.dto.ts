import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { GameModeType, RoomVisibility, QuestionSourceType } from '@prisma/client';

export class CreateCustomRoomDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  languageId?: string = 'en';

  @IsEnum(GameModeType)
  @IsOptional()
  gameMode?: GameModeType = GameModeType.TRANSLATION_RUSH;

  @IsEnum(RoomVisibility)
  @IsOptional()
  visibility?: RoomVisibility = RoomVisibility.PUBLIC;

  @IsString()
  @IsOptional()
  password?: string;

  @IsEnum(QuestionSourceType)
  @IsOptional()
  sourceType?: QuestionSourceType = QuestionSourceType.SYSTEM_PRESET;

  @IsString()
  @IsOptional()
  sourceId?: string;

  @IsString()
  @IsOptional()
  difficulty?: string = 'INTERMEDIATE';

  @IsInt()
  @Min(5)
  @Max(50)
  @IsOptional()
  questionCount?: number = 10;

  @IsInt()
  @Min(2)
  @IsOptional()
  maxPlayers?: number = 10000;

  @IsBoolean()
  @IsOptional()
  isLiveMode?: boolean = false;

  @IsString()
  @IsOptional()
  liveProvider?: string = 'MOCK';

  @IsInt()
  @Min(5)
  @Max(60)
  @IsOptional()
  roundDurationSec?: number = 15;

  @IsBoolean()
  @IsOptional()
  allowLateJoin?: boolean = false;

  @IsBoolean()
  @IsOptional()
  penaltyForWrong?: boolean = false;

  @IsBoolean()
  @IsOptional()
  shuffleQuestions?: boolean = true;

  @IsBoolean()
  @IsOptional()
  shuffleOptions?: boolean = true;

  @IsBoolean()
  @IsOptional()
  showAnswerAfterEach?: boolean = true;
}

export class VerifyRoomPasswordDto {
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class InviteRoomPlayerDto {
  @IsString()
  @IsNotEmpty()
  inviteeUserId: string;
}

export class UpdateCustomRoomDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(GameModeType)
  @IsOptional()
  gameMode?: GameModeType;

  @IsEnum(RoomVisibility)
  @IsOptional()
  visibility?: RoomVisibility;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  difficulty?: string;

  @IsInt()
  @Min(5)
  @Max(50)
  @IsOptional()
  questionCount?: number;

  @IsInt()
  @Min(2)
  @IsOptional()
  maxPlayers?: number;

  @IsInt()
  @Min(5)
  @Max(60)
  @IsOptional()
  roundDurationSec?: number;

  @IsBoolean()
  @IsOptional()
  penaltyForWrong?: boolean;

  @IsBoolean()
  @IsOptional()
  shuffleQuestions?: boolean;

  @IsBoolean()
  @IsOptional()
  shuffleOptions?: boolean;

  @IsBoolean()
  @IsOptional()
  showAnswerAfterEach?: boolean;
}


