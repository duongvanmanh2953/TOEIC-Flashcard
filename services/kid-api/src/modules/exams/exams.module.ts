import { Module } from '@nestjs/common';
import { ExamsController } from './exams.controller';
import { ExamsService } from './exams.service';
import { ExamScoringService } from './exam-scoring.service';
import { ExamAnalyticsService } from './exam-analytics.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisCacheModule } from '../../common/cache/redis-cache.module';

@Module({
  imports: [PrismaModule, RedisCacheModule],
  controllers: [ExamsController],
  providers: [ExamsService, ExamScoringService, ExamAnalyticsService],
  exports: [ExamsService, ExamScoringService, ExamAnalyticsService],
})
export class ExamsModule {}
