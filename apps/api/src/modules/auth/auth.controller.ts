import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh.dto';
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

  private setAuthCookies(res: Response, accessToken?: string, refreshToken?: string) {
    if (!res) return;
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
      path: '/',
    };

    if (accessToken) {
      res.cookie('token', accessToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
    }

    if (refreshToken) {
      res.cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });
    }
  }

  private clearAuthCookies(res: Response) {
    if (!res) return;
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
      path: '/',
    };
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
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
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

  @Public()
  @Post('migrate-guest')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Migrate guest offline favorites, custom words, and quiz history to authenticated user' })
  migrateGuest(
    @Body()
    body: {
      targetUserId: string;
      favorites?: string[];
      customWords?: any[];
      reviews?: any[];
    },
  ) {
    return this.authService.migrateGuestData(body);
  }
}
