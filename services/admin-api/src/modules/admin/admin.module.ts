import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminAssetsController } from './admin-assets.controller';
import { FeedbackModule } from '../feedback/feedback.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [FeedbackModule, SubscriptionsModule, AuthModule],
  controllers: [AdminController, AdminAssetsController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
