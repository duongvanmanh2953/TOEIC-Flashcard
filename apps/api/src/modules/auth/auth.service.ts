import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  ForgotPasswordDto,
  VerifyResetOtpDto,
  ResetPasswordDto,
  PASSWORD_REGEX,
  PASSWORD_STANDARD_MESSAGE,
} from './dto/password-reset.dto';
import { MailService } from './mail.service';
import * as bcrypt from 'bcrypt';
import { CefrLevel, Role, SubscriptionTier } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
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
        subscriptions: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
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

    const activeSub = user.subscriptions?.[0] || null;
    const isPro =
      user.role === Role.PREMIUM_USER ||
      user.role === Role.ADMIN ||
      user.role === Role.SUPER_ADMIN ||
      activeSub?.plan?.tier === SubscriptionTier.PRO;
    const isPlus = !isPro && activeSub?.plan?.tier === SubscriptionTier.PLUS;
    const tier = isPro ? 'PRO' : isPlus ? 'PLUS' : 'FREE';

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
        tier,
        subscription: isPro
          ? {
              id: activeSub?.id || 'pro-active',
              tier: 'PRO',
              planName: activeSub?.plan?.name || 'VocabFlow Pro (Unlimited)',
              currentPeriodEnd: activeSub?.currentPeriodEnd || new Date('2099-12-31T23:59:59.000Z'),
            }
          : activeSub
          ? {
              id: activeSub.id,
              tier: activeSub.plan?.tier || 'FREE',
              planName: activeSub.plan?.name || 'Free',
              currentPeriodEnd: activeSub.currentPeriodEnd,
            }
          : {
              tier: 'FREE',
              planName: 'Free',
            },
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
        secret: process.env.JWT_REFRESH_SECRET as string,
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
    const isPro =
      user.role === Role.PREMIUM_USER ||
      user.role === Role.ADMIN ||
      user.role === Role.SUPER_ADMIN ||
      activeSub?.plan?.tier === SubscriptionTier.PRO;
    const isPlus = !isPro && activeSub?.plan?.tier === SubscriptionTier.PLUS;
    const tier = isPro ? 'PRO' : isPlus ? 'PLUS' : 'FREE';

    return {
      ...user,
      tier,
      subscription: isPro
        ? {
            id: activeSub?.id || 'pro-active',
            tier: 'PRO',
            planName: activeSub?.plan?.name || 'VocabFlow Pro (Unlimited)',
            currentPeriodEnd: activeSub?.currentPeriodEnd || new Date('2099-12-31T23:59:59.000Z'),
          }
        : activeSub
        ? {
            id: activeSub.id,
            tier: activeSub.plan?.tier || 'FREE',
            planName: activeSub.plan?.name || 'Free',
            currentPeriodEnd: activeSub.currentPeriodEnd,
          }
        : {
            tier: 'FREE',
            planName: 'Free',
          },
    };
  }

  async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET as string,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET as string,
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

  /**
   * Request password reset OTP via email
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản liên kết với địa chỉ email này.');
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: otp,
        resetPasswordExpires: expiresAt,
      },
    });

    // Send email via Nodemailer & Resend SMTP
    const mailResult = await this.mailService.sendPasswordResetOtp(user.email, otp, user.displayName);

    return {
      success: true,
      message: mailResult.message,
      email: user.email,
    };
  }

  /**
   * Verify whether the entered OTP key is correct and active (Step 2 before allowing password change)
   */
  async verifyResetOtp(dto: VerifyResetOtpDto) {
    const email = dto.email.toLowerCase().trim();
    const otp = dto.otp.trim();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản liên kết với email này.');
    }

    if (!user.resetPasswordToken || user.resetPasswordToken !== otp) {
      throw new BadRequestException('Mã xác thực OTP không chính xác. Vui lòng kiểm tra lại mã đã nhận trong email.');
    }

    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Mã xác thực OTP đã hết hạn (chỉ có hiệu lực trong 15 phút). Vui lòng gửi lại yêu cầu mã mới.');
    }

    return {
      success: true,
      valid: true,
      message: 'Mã xác thực OTP chính xác! Bạn có thể đặt mật khẩu mới ngay bây giờ.',
    };
  }

  /**
   * Verify OTP and reset password (Step 3 with strict password security standard)
   */
  async resetPassword(dto: ResetPasswordDto) {
    const email = dto.email.toLowerCase().trim();
    const otp = dto.otp.trim();

    // Verify strong password standard in service
    if (!PASSWORD_REGEX.test(dto.newPassword)) {
      throw new BadRequestException(PASSWORD_STANDARD_MESSAGE);
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản với email này.');
    }

    if (!user.resetPasswordToken || user.resetPasswordToken !== otp) {
      throw new BadRequestException('Mã xác thực OTP không chính xác.');
    }

    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Mã xác thực OTP đã hết hạn (chỉ có hiệu lực trong 15 phút). Vui lòng gửi lại mã mới.');
    }

    // Hash new password securely
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    // Update user password and clear reset token
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
      include: {
        profile: true,
        streak: true,
        xp: true,
      },
    });

    // Generate new authentication tokens
    const tokens = await this.generateTokens(updatedUser.id, updatedUser.email, updatedUser.role);
    await this.updateRefreshToken(updatedUser.id, tokens.refreshToken);

    return {
      success: true,
      message: 'Đặt lại mật khẩu thành công! Chào mừng bạn quay lại VocabFlow AI.',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
      },
      ...tokens,
    };
  }
}
