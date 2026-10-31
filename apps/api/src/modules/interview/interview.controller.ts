import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { InterviewService } from './interview.service';
import { InterviewTaxonomyService } from './interview-taxonomy.service';
import { InterviewDocumentService } from './interview-document.service';
import { InterviewBillingService } from './interview-billing.service';
import { InterviewSetupConfig } from '@vocabflow/shared';

@ApiTags('AI Interview Studio')
@Controller('interview')
export class InterviewController {
  constructor(
    private readonly interviewService: InterviewService,
    private readonly taxonomyService: InterviewTaxonomyService,
    private readonly documentService: InterviewDocumentService,
    private readonly billingService: InterviewBillingService,
  ) {}

  @Public()
  @Get('taxonomy')
  @ApiOperation({ summary: 'Get all interview industries and positions' })
  getTaxonomy() {
    return this.taxonomyService.getAllIndustries();
  }

  @UseGuards(JwtAuthGuard)
  @Get('billing/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check candidate quota & billing entitlement' })
  getBillingStatus(@CurrentUser('id') userId: string) {
    return this.billingService.checkEntitlement(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('setup')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initialize and start a new 1:1 AI Interview session' })
  createSession(
    @CurrentUser('id') userId: string,
    @Body() config: InterviewSetupConfig
  ) {
    return this.interviewService.createSession(userId, config);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sessions/:id/turn')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit candidate answer for current turn and evaluate follow-up' })
  submitTurnAnswer(
    @CurrentUser('id') userId: string,
    @Param('id') sessionId: string,
    @Body('turnNumber') turnNumber: number,
    @Body('answer') answer: string,
    @Body('durationSec') durationSec?: number
  ) {
    return this.interviewService.submitTurnAnswer(
      userId,
      sessionId,
      turnNumber,
      answer,
      durationSec || 0
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('sessions/:id/hint')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request progressive hint (Level 1: Keywords, Level 2: Outline, Level 3: Sample Answer)' })
  requestHint(
    @CurrentUser('id') userId: string,
    @Param('id') sessionId: string,
    @Body('turnNumber') turnNumber: number,
    @Body('hintLevel') hintLevel: 1 | 2 | 3
  ) {
    return this.interviewService.requestHint(userId, sessionId, turnNumber, hintLevel);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sessions/:id/translate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Translate interview question or hint into support language' })
  translateContent(
    @CurrentUser('id') userId: string,
    @Body('text') text: string,
    @Body('targetLang') targetLang?: string
  ) {
    return this.interviewService.translateContent(userId, text, targetLang || 'vi');
  }

  @UseGuards(JwtAuthGuard)
  @Post('sessions/:id/finish')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Finish interview session and generate comprehensive evaluation report' })
  finishSession(
    @CurrentUser('id') userId: string,
    @Param('id') sessionId: string
  ) {
    return this.interviewService.finishSession(userId, sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('documents/upload')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload DOCX/PDF/TXT, extract structured questions and index for RAG' })
  uploadDocument(
    @CurrentUser('id') userId: string,
    @Body()
    payload: {
      title: string;
      fileName: string;
      fileMime: string;
      fileSize: number;
      rawText: string;
      industryCode: string;
      languageCode: string;
      isPrivate: boolean;
      contributeToCommunity?: boolean;
    }
  ) {
    return this.documentService.ingestDocument({
      ...payload,
      userId,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('proposals')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit community proposal for new Industry or Position taxonomy' })
  submitProposal(
    @CurrentUser('id') userId: string,
    @Body()
    data: {
      proposedType: 'INDUSTRY' | 'POSITION';
      name: string;
      parentCategory?: string;
      description?: string;
      exampleQuestions?: string[];
    }
  ) {
    return this.documentService.submitCategoryProposal(userId, data);
  }
}
