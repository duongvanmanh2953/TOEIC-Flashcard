import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  Req,
  Headers,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh.dto';
import { ForgotPasswordDto, VerifyResetOtpDto, ResetPasswordDto } from './dto/password-reset.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OAuthService } from './oauth.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private oauthService: OAuthService,
  ) {}

  private getCookieOptions() {
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieDomain = process.env.COOKIE_DOMAIN || (isProduction ? '.vocalflow.site' : undefined);
    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
      path: '/',
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    };
  }

  private setAuthCookies(res: Response, accessToken?: string, refreshToken?: string) {
    if (!res) return;
    const cookieOptions = this.getCookieOptions();
    const fifteenDaysMs = 15 * 24 * 60 * 60 * 1000; // 15 days policy

    if (accessToken) {
      res.cookie('token', accessToken, {
        ...cookieOptions,
        maxAge: fifteenDaysMs,
      });
    }

    if (refreshToken) {
      res.cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: fifteenDaysMs,
      });
    }
  }

  private clearAuthCookies(res: Response) {
    if (!res) return;
    const cookieOptions = this.getCookieOptions();
    res.clearCookie('token', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new learner account' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Headers('x-device-id') deviceIdHeader: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawUa = req.headers['user-agent'] || '';
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket?.remoteAddress ||
      '127.0.0.1';

    let os = dto.os;
    if (!os) {
      if (/windows/i.test(rawUa)) os = 'Windows';
      else if (/macintosh|mac os x/i.test(rawUa)) os = 'macOS';
      else if (/iphone|ipad|ipod/i.test(rawUa)) os = 'iOS';
      else if (/android/i.test(rawUa)) os = 'Android';
      else if (/linux/i.test(rawUa)) os = 'Linux';
      else os = 'Web Client';
    }

    let browser = dto.browser;
    if (!browser) {
      if (/edg/i.test(rawUa)) browser = 'Microsoft Edge';
      else if (/chrome|crios/i.test(rawUa)) browser = 'Chrome';
      else if (/firefox|fxios/i.test(rawUa)) browser = 'Firefox';
      else if (/safari/i.test(rawUa)) browser = 'Safari';
      else browser = 'Web Browser';
    }

    const deviceId = dto.deviceId || deviceIdHeader || undefined;
    const deviceName = dto.deviceName || `${browser} trên ${os}`;

    const enrichedDto: LoginDto = {
      ...dto,
      deviceId,
      deviceName,
      os,
      browser,
      deviceType: dto.deviceType || (/(mobile|android|iphone|ipad)/i.test(rawUa) ? 'MOBILE' : 'DESKTOP'),
    };

    const result = await this.authService.login(enrichedDto);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh expired access token' })
  async refreshToken(
    @Body() dto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.refreshToken(dto.refreshToken);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  async logout(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.clearAuthCookies(res);
    return this.authService.logout(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile with streak and level' })
  getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }

  @Public()
  @Post('oauth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate via Google or Facebook OAuth' })
  async oauthLogin(
    @Body()
    body: {
      provider: 'google' | 'facebook';
      providerId: string;
      email: string;
      displayName: string;
      avatar?: string;
    },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result: any = await this.oauthService.handleOAuthUser(body);
    this.setAuthCookies(res, result?.accessToken, result?.refreshToken);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('migrate-guest')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Migrate guest offline favorites, custom words, and quiz history to authenticated user' })
  migrateGuest(
    @CurrentUser('id') currentUserId: string,
    @Body()
    body: {
      targetUserId?: string;
      favorites?: string[];
      customWords?: any[];
      reviews?: any[];
    },
  ) {
    return this.authService.migrateGuestData({
      ...body,
      targetUserId: currentUserId,
    });
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset OTP code sent via Nodemailer email' })
  @ApiResponse({ status: 200, description: 'OTP sent to email successfully' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('verify-reset-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify that the entered OTP key is correct and valid' })
  @ApiResponse({ status: 200, description: 'OTP is verified and valid' })
  verifyResetOtp(@Body() dto: VerifyResetOtpDto) {
    return this.authService.verifyResetOtp(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and set a new password' })
  @ApiResponse({ status: 200, description: 'Password reset successful, returns new JWT session' })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.resetPassword(dto);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password and revoke all active sessions across all devices' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.clearAuthCookies(res);
    return this.authService.changePassword(userId, dto);
  }

  @Public()
  @Get('firebase-config')
  @ApiOperation({ summary: 'Get active public Firebase client configuration' })
  async getFirebaseConfig() {
    return this.authService.getFirebaseConfig();
  }
}

