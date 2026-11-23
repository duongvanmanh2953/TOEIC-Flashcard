import { Controller, Get, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  ListeningLabService,
  SubmitActiveListeningDto,
  TrackPassivePlaybackDto,
  RecordFocusSessionDto,
} from './listening-lab.service';

@ApiTags('Listening Lab & Deep Focus')
@Controller('listening-lab')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ListeningLabController {
  constructor(private readonly labService: ListeningLabService) {}

  @Get('tracks')
  @ApiOperation({ summary: 'Get listening tracks by language and mode' })
  @ApiQuery({ name: 'languageId', required: false })
  @ApiQuery({ name: 'mode', required: false, enum: ['ACTIVE', 'PASSIVE'] })
  getTracks(
    @Query('languageId') languageId?: string,
    @Query('mode') mode?: 'ACTIVE' | 'PASSIVE',
  ) {
    return this.labService.getTracks(languageId, mode);
  }

  @Get('track/:id')
  @ApiOperation({ summary: 'Get track details, sentence segmentation and quizzes' })
  getTrackById(@Param('id') id: string) {
    return this.labService.getTrackById(id);
  }

  @Post('active/submit')
  @ApiOperation({ summary: 'Submit active listening comprehension and dictation results' })
  submitActiveListening(
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitActiveListeningDto,
  ) {
    return this.labService.submitActiveListening(userId, dto);
  }

  @Post('passive/track')
  @ApiOperation({ summary: 'Record passive immersion exposure time' })
  trackPassivePlayback(
    @CurrentUser('id') userId: string,
    @Body() dto: TrackPassivePlaybackDto,
  ) {
    return this.labService.trackPassivePlayback(userId, dto);
  }

  @Post('focus/record')
  @ApiOperation({ summary: 'Record deep focus session completion or state' })
  recordFocusSession(
    @CurrentUser('id') userId: string,
    @Body() dto: RecordFocusSessionDto,
  ) {
    return this.labService.recordFocusSession(userId, dto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get listening lab analytics and lock screen word of the day' })
  @ApiQuery({ name: 'languageId', required: false })
  getListeningStats(@CurrentUser('id') userId: string, @Query('languageId') languageId?: string) {
    return this.labService.getListeningStats(userId, languageId);
  }
}
