import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from './auth.service';
import { Role, CefrLevel } from '@prisma/client';

export interface OAuthUserProfile {
  provider: 'google' | 'facebook';
  providerId: string;
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
   * Safe Account Linking:
   * If a user with the OAuth email already exists, link and return session tokens.
   * If not, create a new verified user profile and return session tokens.
   */
  async handleOAuthUser(profile: OAuthUserProfile) {
    if (!profile.email) {
      throw new UnauthorizedException('OAuth provider did not supply a valid verified email address.');
    }

    const email = profile.email.toLowerCase();

    let user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true, streak: true, xp: true },
    });

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
