import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Get onboarding placement test questions' })
  getQuestions() {
    return this.placementService.getPlacementQuestions();
  }

  @UseGuards(JwtAuthGuard)
  @Post('submit')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit placement test and compute estimated CEFR level' })
  submitTest(
    @CurrentUser('id') userId: string,
    @Body('answers') answers: TestAnswerItem[],
  ) {
    return this.placementService.evaluatePlacementTest(userId, answers);
  }
}
