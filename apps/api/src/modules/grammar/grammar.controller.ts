import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { GrammarService, SubmitExerciseDto } from './grammar.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('grammar')
export class GrammarController {
  constructor(private readonly grammarService: GrammarService) {}

  @Public()
  @Get('categories')
  async getCategories(
    @Request() req: any,
    @Query('languageId') languageId?: string,
  ) {
    const userId = req.user?.id || req.user?.sub;
    const categories = await this.grammarService.getCategories(userId, languageId || 'en');
    return {
      success: true,
      data: categories,
    };
  }

  @Public()
  @Get('topics/:topicId')
  async getTopicDetail(
    @Request() req: any,
    @Param('topicId') topicId: string,
  ) {
    const userId = req.user?.id || req.user?.sub;
    const topic = await this.grammarService.getTopicDetail(topicId, userId);
    return {
      success: true,
      data: topic,
    };
  }

  @Post('topics/:topicId/submit-exercise')
  @UseGuards(JwtAuthGuard)
  async submitExercise(
    @Request() req: any,
    @Param('topicId') topicId: string,
    @Body('submissions') submissions: SubmitExerciseDto[],
  ) {
    const userId = req.user?.id || req.user?.sub;
    const result = await this.grammarService.submitExercise(userId, topicId, submissions || []);
    return {
      success: true,
      data: result,
      message: 'Đã hoàn thành bài tập ngữ pháp và cập nhật điểm FSRS!',
    };
  }
}
