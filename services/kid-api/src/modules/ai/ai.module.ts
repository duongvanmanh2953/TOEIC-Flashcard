import { Module } from '@nestjs/common';
import { AIService } from './ai.service';
import { AIController } from './ai.controller';
import { PromptService } from './prompt.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [SubscriptionsModule],
  controllers: [AIController],
  providers: [AIService, PromptService],
  exports: [AIService, PromptService],
})
export class AIModule {}
