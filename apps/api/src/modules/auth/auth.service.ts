import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { CefrLevel, Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        displayName: dto.displayName,
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
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        profile: true,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user,
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        profile: true,
        streak: true,
        xp: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    // Update lastActiveAt
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
        profile: user.profile,
        streak: user.streak,
        xp: user.xp,
      },
      ...tokens,
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_REFRESH_SECRET || 'leximind_jwt_super_secure_refresh_token_secret_2026',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Access denied');
      }

      const isMatch = await bcrypt.compare(token, user.refreshToken);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role);
      await this.updateRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch {
      throw new UnauthorizedException('Expired or invalid refresh token');
    }
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { success: true, message: 'Logged out successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatar: true,
        role: true,
        profile: true,
        streak: true,
        xp: true,
        subscriptions: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const activeSub = user.subscriptions?.[0] || null;
    return {
      ...user,
      subscription: activeSub
        ? {
            id: activeSub.id,
            tier: activeSub.plan?.tier || 'FREE',
            planName: activeSub.plan?.name || 'Free',
            currentPeriodEnd: activeSub.currentPeriodEnd,
          }
        : null,
    };
  }

  async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET || 'leximind_jwt_super_secure_access_token_secret_2026',
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET || 'leximind_jwt_super_secure_refresh_token_secret_2026',
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 mins in seconds
    };
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashed },
    });
  }

  async migrateGuestData(payload: {
    targetUserId: string;
    favorites?: string[];
    customWords?: any[];
    reviews?: any[];
  }) {
    const { targetUserId, favorites, customWords } = payload;
    if (!targetUserId) return { success: false, message: 'Invalid target user' };

    try {
      const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
      if (!user) return { success: false, message: 'User not found' };

      if (favorites && favorites.length > 0) {
        for (const word of favorites) {
          if (typeof word === 'string') {
            const vocab = await this.prisma.vocabulary.findFirst({
              where: { word: word.toLowerCase() },
            });
            if (vocab) {
              await this.prisma.userVocabulary.upsert({
                where: {
                  userId_vocabularyId: {
                    userId: targetUserId,
                    vocabularyId: vocab.id,
                  },
                },
                update: { isFavorite: true },
                create: {
                  userId: targetUserId,
                  vocabularyId: vocab.id,
                  status: 'LEARNING',
                  isFavorite: true,
                  nextReviewAt: new Date(),
                },
              });
            }
          }
        }
      }

      if (customWords && customWords.length > 0) {
        for (const item of customWords) {
          if (item?.word) {
            const vocab = await this.prisma.vocabulary.findFirst({
              where: { word: item.word.toLowerCase() },
            });
            if (vocab) {
              await this.prisma.userVocabulary.upsert({
                where: {
                  userId_vocabularyId: {
                    userId: targetUserId,
                    vocabularyId: vocab.id,
                  },
                },
                update: {},
                create: {
                  userId: targetUserId,
                  vocabularyId: vocab.id,
                  status: 'LEARNING',
                  nextReviewAt: new Date(),
                },
              });
            }
          }
        }
      }

      return {
        success: true,
        migratedCount: (favorites?.length || 0) + (customWords?.length || 0),
        message: 'Guest data migrated successfully',
      };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Migration notice' };
    }
  }
}
