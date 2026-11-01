import {
  Controller,
  Get,
  Post,
  Delete,
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
import { InterviewAnalyzerService } from './interview-analyzer.service';
import { InterviewLearningService } from './interview-learning.service';
import {
  InterviewSetupConfig,
  TranslationPurpose,
  InterviewActivity,
  InterviewJobBrief,
} from './interview.shared';

@ApiTags('AI Interview Studio')
@Controller('interview')
export class InterviewController {
  constructor(
    private readonly interviewService: InterviewService,
    private readonly taxonomyService: InterviewTaxonomyService,
    private readonly documentService: InterviewDocumentService,
    private readonly billingService: InterviewBillingService,
    private readonly analyzerService: InterviewAnalyzerService,
    private readonly learningService: InterviewLearningService,
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
  @ApiOperation({ summary: 'Check candidate quota & billing entitlement (Fail-Closed)' })
  getBillingStatus(@CurrentUser('id') userId: string) {
    return this.billingService.checkEntitlement(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('opening-script')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate dynamic opening script matching role and interview language' })
  getOpeningScript(
    @Query('industryCode') industryCode: string,
    @Query('positionCode') positionCode: string,
    @Query('positionTitle') positionTitle: string,
    @Query('seniorityLevel') seniorityLevel: string,
    @Query('interviewType') interviewType: string,
    @Query('languageId') languageId: string,
    @Query('interviewerStyle') interviewerStyle?: string
  ) {
    return this.interviewService.getOpeningScript({
      industryCode: industryCode || 'TECH',
      positionCode,
      positionTitle: positionTitle || 'Candidate',
      seniorityLevel: seniorityLevel || 'Mid-level',
      interviewType: interviewType || 'General Professional',
      languageId: languageId || 'en',
      interviewerStyle,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('setup')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initialize and start a new 1:1 AI Interview session (Pro exclusive)' })
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
    @Body('durationSec') durationSec?: number,
    @Body('isTranslated') isTranslated?: boolean,
    @Body('detectedSourceLanguage') detectedSourceLanguage?: string,
    @Body('originalTranscript') originalTranscript?: string
  ) {
    return this.interviewService.submitTurnAnswer(
      userId,
      sessionId,
      turnNumber,
      answer,
      durationSec || 0,
      {
        isTranslated,
        detectedSourceLanguage,
        originalTranscript,
      }
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
  @ApiOperation({ summary: 'Centralized translation service with direction & purpose' })
  translateContent(
    @CurrentUser('id') userId: string,
    @Param('id') sessionId: string,
    @Body('text') text: string,
    @Body('targetLang') targetLang?: string,
    @Body('sourceLang') sourceLang?: string,
    @Body('purpose') purpose?: TranslationPurpose
  ) {
    return this.interviewService.translateContent(
      userId,
      text,
      targetLang || 'vi',
      sourceLang,
      purpose || 'question'
    );
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

  // ===========================================================================
  // AI INTERVIEW STUDIO V2 ENDPOINTS
  // ===========================================================================

  @UseGuards(JwtAuthGuard)
  @Post('jd/analyze')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Analyze Job Description, extract requirements & editable skill matrix (Step 2)' })
  analyzeJobDescription(
    @CurrentUser('id') userId: string,
    @Body()
    payload: {
      rawText: string;
      industryCode?: string;
      positionTitle?: string;
    }
  ) {
    return this.analyzerService.analyzeJobDescription(
      userId,
      payload.rawText,
      payload.industryCode || 'TECH',
      payload.positionTitle
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('blueprint/generate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate personalized interview blueprint based on job brief and duration' })
  async generateBlueprint(
    @CurrentUser('id') userId: string,
    @Body()
    payload: {
      jobBrief: InterviewJobBrief;
      durationMinutes?: number;
      seniority?: string;
    }
  ) {
    const profile = await this.learningService.getOrCreateProfile(userId);
    return this.analyzerService.generateBlueprint(
      userId,
      payload.jobBrief,
      payload.durationMinutes || 20,
      payload.seniority || 'Mid-level',
      profile
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('sessions/:id/activity')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Emit and update real-time interview activity state' })
  updateActivity(
    @Param('id') sessionId: string,
    @Body('activity') activity: InterviewActivity
  ) {
    return this.interviewService.updateSessionActivity(sessionId, activity);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions/:id/activity')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current interview activity state' })
  getActivity(@Param('id') sessionId: string) {
    return this.interviewService.getSessionActivity(sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('learning-profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user interview learning memory & mastery profile' })
  getLearningProfile(@CurrentUser('id') userId: string) {
    return this.learningService.getOrCreateProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('learning-profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reset interview learning memory for user privacy control' })
  resetLearningProfile(@CurrentUser('id') userId: string) {
    return this.learningService.resetProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('learning-profile/toggle')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle adaptive personalization ON/OFF' })
  togglePersonalization(
    @CurrentUser('id') userId: string,
    @Body('enabled') enabled: boolean
  ) {
    return this.learningService.setPersonalizationEnabled(userId, enabled);
  }
}
