import { Module } from '@nestjs/common';
import { CommunityKnowledgeController } from './community-knowledge.controller';
import { CommunityKnowledgeService } from './community-knowledge.service';
import { TrainingDataService } from './training-data.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisCacheModule } from '../../common/cache/redis-cache.module';

@Module({
  imports: [PrismaModule, RedisCacheModule],
  controllers: [CommunityKnowledgeController],
  providers: [CommunityKnowledgeService, TrainingDataService],
  exports: [CommunityKnowledgeService, TrainingDataService],
})
export class CommunityKnowledgeModule {}
