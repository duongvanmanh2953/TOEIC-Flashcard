import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ScriptsService, VerifyStrokeDto } from './scripts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('scripts')
export class ScriptsController {
  constructor(private readonly scriptsService: ScriptsService) {}

  @Public()
  @Get('systems')
  async getScriptSystems() {
    const systems = await this.scriptsService.getScriptSystems();
    return {
      success: true,
      data: systems,
    };
  }

  @Public()
  @Get(':scriptCode/characters')
  async getCharactersByScript(
    @Request() req: any,
    @Param('scriptCode') scriptCode: string,
  ) {
    const userId = req.user?.id || req.user?.sub;
    const data = await this.scriptsService.getCharactersByScript(scriptCode, userId);
    return {
      success: true,
      data,
    };
  }

  @Post('characters/:characterId/verify-stroke')
  @UseGuards(JwtAuthGuard)
  async verifyStroke(
    @Request() req: any,
    @Param('characterId') characterId: string,
    @Body() dto: VerifyStrokeDto,
  ) {
    const userId = req.user?.id || req.user?.sub;
    const result = await this.scriptsService.verifyStroke(userId, characterId, dto);
    return {
      success: true,
      data: result,
    };
  }

  @Post('characters/:characterId/record-attempt')
  @UseGuards(JwtAuthGuard)
  async recordAttempt(
    @Request() req: any,
    @Param('characterId') characterId: string,
    @Body()
    body: {
      preMorphScore: number;
      strokesCount: number;
      mistakesCount: number;
      mode: string;
    },
  ) {
    const userId = req.user?.id || req.user?.sub;
    const result = await this.scriptsService.recordPracticeSession(userId, characterId, body);
    return {
      success: true,
      data: result,
    };
  }

  @Public()
  @Post('handwriting/recognize')
  async recognizeHandwriting(
    @Body()
    body: {
      languageCode: string;
      locale?: string;
      targetText?: string;
      strokes: Array<{
        id: string;
        index: number;
        points: Array<{ x: number; y: number; t?: number; pressure?: number }>;
      }>;
    },
  ) {
    const result = await this.scriptsService.recognizeHandwriting(body);
    return {
      success: result.success !== false,
      data: result,
    };
  }
}
