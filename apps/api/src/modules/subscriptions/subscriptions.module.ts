import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { UsageService } from './usage.service';

@Module({
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, UsageService],
  exports: [SubscriptionsService, UsageService],
})
export class SubscriptionsModule {}
