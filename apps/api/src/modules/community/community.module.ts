import { Module } from '@nestjs/common';
import { CommunityService } from './community.service';
import { CommunityController } from './community.controller';
import { AccessKeyService } from './access-key.service';
import { AccessKeyController } from './access-key.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../../prisma/prisma.module';

import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [PrismaModule, NotificationsModule, SubscriptionsModule],
  controllers: [CommunityController, AccessKeyController],
  providers: [CommunityService, AccessKeyService],
  exports: [CommunityService, AccessKeyService],
})
export class CommunityModule {}

