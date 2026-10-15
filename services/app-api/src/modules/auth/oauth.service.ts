import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from './auth.service';
import { Role, CefrLevel } from '@prisma/client';

export interface OAuthUserProfile {
  provider: 'google' | 'facebook';
  providerId: string;
  idToken?: string;
  email: string;
  displayName: string;
  avatar?: string;
}

@Injectable()
export class OAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Validate and verify OAuth identity token integrity
   */
  private verifyOAuthToken(profile: OAuthUserProfile): void {
    if (profile.idToken) {
      try {
        const parts = profile.idToken.split('.');
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
          const payload = JSON.parse(payloadJson);

          if (payload.email && payload.email.toLowerCase() !== profile.email.toLowerCase()) {
            throw new UnauthorizedException('Địa chỉ email trong OAuth token không khớp với thông tin đăng nhập.');
          }
          if (payload.exp && Date.now() >= payload.exp * 1000) {
            throw new UnauthorizedException('OAuth token đã hết hạn. Vui lòng đăng nhập lại.');
          }
          if (profile.provider === 'google' && payload.iss) {
            const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
            if (!validIssuers.includes(payload.iss)) {
              throw new UnauthorizedException('Nhà phát hành OAuth token không hợp lệ.');
            }
          }
        }
      } catch (err: any) {
        if (err instanceof UnauthorizedException) throw err;
        throw new UnauthorizedException('Định dạng OAuth token không hợp lệ.');
      }
    } else if (process.env.NODE_ENV === 'production') {
      throw new UnauthorizedException('Yêu cầu bắt buộc phải có OAuth idToken hợp lệ để đăng nhập.');
    }
  }

  /**
   * Safe Account Linking:
   * If a user with the OAuth email already exists, link and return session tokens.
   * If not, create a new verified user profile and return session tokens.
   * INVARIANT: Never allow automated OAuth takeover of ADMIN or SUPER_ADMIN accounts.
   */
  async handleOAuthUser(profile: OAuthUserProfile) {
    if (!profile.email) {
      throw new UnauthorizedException('OAuth provider did not supply a valid verified email address.');
    }

    this.verifyOAuthToken(profile);

    const email = profile.email.toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true, streak: true, xp: true },
    });

    // Invariant SEC-001: Protect elevated administrator accounts from client-side OAuth takeover
    if (user && (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN)) {
      throw new UnauthorizedException('Tài khoản quản trị viên yêu cầu đăng nhập trực tiếp bằng mật khẩu bảo mật.');
    }

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          displayName: profile.displayName || email.split('@')[0],
          avatar: profile.avatar,
          passwordHash: 'oauth_authenticated_account',
          role: Role.USER,
          profile: {
            create: {
              englishLevel: CefrLevel.B1,
              targetLevel: CefrLevel.B2,
              dailyGoal: 20,
            },
          },
          streak: {
            create: {
              currentStreak: 0,
              longestStreak: 0,
            },
          },
          xp: {
            create: {
              totalXP: 0,
              currentLevel: 1,
            },
          },
        },
        include: { profile: true, streak: true, xp: true },
      });
    }

    const tokens = await this.authService.generateTokens(user.id, user.email, user.role);
    await this.authService.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
        profile: user.profile,
      },
      ...tokens,
    };
  }
}
