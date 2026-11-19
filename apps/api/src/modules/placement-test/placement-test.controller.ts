import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PlacementTestService, TestAnswerItem } from './placement-test.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Placement Test & Onboarding')
@Controller('placement-test')
export class PlacementTestController {
  constructor(private readonly placementService: PlacementTestService) {}

  @Public()
  @Get('questions')
  @ApiOperation({ summary: 'Get onboarding placement test questions by language space' })
  @ApiQuery({ name: 'languageId', required: false, description: 'Target language code e.g. zh, ja, ko, en' })
  getQuestions(@Query('languageId') languageId?: string) {
    return this.placementService.getPlacementQuestions(languageId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('submit')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit placement test and compute estimated CEFR level' })
  submitTest(
    @CurrentUser('id') userId: string,
    @Body('answers') answers: TestAnswerItem[],
    @Body('languageId') languageId?: string,
  ) {
    return this.placementService.evaluatePlacementTest(userId, answers, languageId);
  }
}
