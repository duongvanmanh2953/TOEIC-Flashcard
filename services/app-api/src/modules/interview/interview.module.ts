import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AIModule } from '../ai/ai.module';
import { InterviewController } from './interview.controller';
import { InterviewService } from './interview.service';
import { InterviewTaxonomyService } from './interview-taxonomy.service';
import { InterviewRagService } from './interview-rag.service';
import { InterviewDocumentService } from './interview-document.service';
import { InterviewBillingService } from './interview-billing.service';

@Module({
  imports: [PrismaModule, AIModule],
  controllers: [InterviewController],
  providers: [
    InterviewService,
    InterviewTaxonomyService,
    InterviewRagService,
    InterviewDocumentService,
    InterviewBillingService,
  ],
  exports: [InterviewService, InterviewTaxonomyService, InterviewRagService],
})
export class InterviewModule {}
