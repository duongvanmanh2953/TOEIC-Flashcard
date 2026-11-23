import { Controller, Get, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { LearningJourneyService, ProfileInputDto, SubmitLessonDto } from './learning-journey.service';

@ApiTags('Personalized Learning Journey & Roadmap')
@Controller('learning-journey')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LearningJourneyController {
  constructor(private readonly journeyService: LearningJourneyService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get learning profile for current language' })
  @ApiQuery({ name: 'languageId', required: false })
  getProfile(@CurrentUser('id') userId: string, @Query('languageId') languageId?: string) {
    return this.journeyService.getLearningProfile(userId, languageId);
  }

  @Post('profile')
  @ApiOperation({ summary: 'Create or update learning profile and preferences' })
  upsertProfile(@CurrentUser('id') userId: string, @Body() dto: ProfileInputDto) {
    return this.journeyService.upsertLearningProfile(userId, dto);
  }

  @Get('roadmap')
  @ApiOperation({ summary: 'Get active personalized roadmap instance' })
  @ApiQuery({ name: 'languageId', required: false })
  getRoadmap(@CurrentUser('id') userId: string, @Query('languageId') languageId?: string) {
    return this.journeyService.getRoadmap(userId, languageId);
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Get AI recommended roadmaps tailored for language space' })
  @ApiQuery({ name: 'languageId', required: false })
  getRecommendations(@Query('languageId') languageId?: string) {
    return this.journeyService.getRoadmapRecommendations(languageId);
  }

  @Post('apply-preset')
  @ApiOperation({ summary: 'Apply an AI recommended roadmap or custom configuration' })
  applyPreset(
    @CurrentUser('id') userId: string,
    @Body()
    dto: {
      languageId: string;
      presetId?: string;
      customTitle?: string;
      targetLevel?: string;
      learningGoal?: string;
      dailyStudyMinutes?: number;
    },
  ) {
    return this.journeyService.applyRoadmapPreset(userId, dto);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Regenerate roadmap based on new goals/profile' })
  @ApiQuery({ name: 'languageId', required: false })
  generateRoadmap(@CurrentUser('id') userId: string, @Query('languageId') languageId?: string) {
    return this.journeyService.generatePersonalizedRoadmap(userId, languageId);
  }

  @Post('lesson/:roadmapId/submit')
  @ApiOperation({ summary: 'Submit lesson or checkpoint activity results' })
  submitLesson(
    @CurrentUser('id') userId: string,
    @Param('roadmapId') roadmapId: string,
    @Body() dto: SubmitLessonDto,
  ) {
    return this.journeyService.submitLessonProgress(userId, roadmapId, dto);
  }

  @Get('daily-plan')
  @ApiOperation({ summary: 'Get personalized daily study plan' })
  @ApiQuery({ name: 'languageId', required: false })
  getDailyPlan(@CurrentUser('id') userId: string, @Query('languageId') languageId?: string) {
    return this.journeyService.getDailyPlan(userId, languageId);
  }
}
