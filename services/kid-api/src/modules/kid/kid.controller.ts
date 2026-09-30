import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { KidService, KidProgressDto } from './kid.service';

@ApiTags('Kid Learning & Gamification')
@Controller('kid')
export class KidController {
  constructor(private readonly kidService: KidService) {}

  @Public()
  @Get('progress')
  @ApiOperation({ summary: 'Get current kid progress' })
  async getProgress(@Query('childId') childId?: string) {
    const data = await this.kidService.getProgress(childId || 'guest');
    return { success: true, data };
  }

  @Public()
  @Post('progress')
  @ApiOperation({ summary: 'Update kid learning progress' })
  async updateProgress(@Body() dto: KidProgressDto, @Query('childId') childId?: string) {
    const data = await this.kidService.updateProgress(childId || 'guest', dto);
    return { success: true, data, message: 'Tiến độ học tập của bé đã được cập nhật' };
  }

  @Public()
  @Get('curriculum')
  @ApiOperation({ summary: 'Get kid curriculum worlds metadata' })
  getCurriculum() {
    const data = this.kidService.getCurriculumOverview();
    return { success: true, data };
  }
}
