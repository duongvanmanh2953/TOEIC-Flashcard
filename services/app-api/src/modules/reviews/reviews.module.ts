import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { AdaptiveEngineService } from './adaptive-engine.service';

@Module({
  controllers: [ReviewsController],
  providers: [ReviewsService, AdaptiveEngineService],
  exports: [ReviewsService, AdaptiveEngineService],
})
export class ReviewsModule {}
