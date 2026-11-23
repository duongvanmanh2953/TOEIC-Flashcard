import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { LearningJourneyController } from './learning-journey.controller';
import { LearningJourneyService } from './learning-journey.service';

@Module({
  imports: [PrismaModule],
  controllers: [LearningJourneyController],
  providers: [LearningJourneyService],
  exports: [LearningJourneyService],
})
export class LearningJourneyModule {}
