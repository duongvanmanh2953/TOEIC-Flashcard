import { JwtService } from '@nestjs/jwt';
import { DeviceSecurityService } from './device-security.service';
import { ForbiddenException, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from './auth.service';
import { Role, CefrLevel, Prisma } from '@prisma/client';

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
  private certificates?: { keys: Record<string, string>; expiresAt: number };
  private certificateRequest?: Promise<Record<string, string>>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly devices: DeviceSecurityService,
    private readonly jwt: JwtService,
  ) {}

  private async loadCertificates() {
    if (this.certificates && this.certificates.expiresAt > Date.now()) return this.certificates.keys;
    this.certificateRequest ??= (async () => {
      try {
        const response = await fetch(
          'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com',
          { signal: AbortSignal.timeout(5000) },
        );
        if (!response.ok) throw new Error('Google certificates unavailable');
        const keys = await response.json() as Record<string, string>;
        const maxAge = Number(response.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1] ?? 0);
        this.certificates = { keys, expiresAt: Date.now() + maxAge * 1000 };
        return keys;
      } catch {
        throw new ServiceUnavailableException('Firebase chưa thể xác minh phiên đăng nhập. Vui lòng thử lại.');
      } finally {
        this.certificateRequest = undefined;
      }
    })();
    return this.certificateRequest;
  }

  private async verifyOAuthToken(profile: OAuthUserProfile) {
    const provider = profile.provider === 'google' ? 'google.com'
      : profile.provider === 'facebook' ? 'facebook.com' : null;
    if (!provider || typeof profile.idToken !== 'string' || profile.idToken.length > 8192) {
      throw new UnauthorizedException('Thiếu Firebase ID token hợp lệ.');
    }

    let decoded: { header?: { alg?: string; kid?: string } } | null;
    try {
      decoded = this.jwt.decode(profile.idToken, { complete: true }) as typeof decoded;
    } catch {
      throw new UnauthorizedException('Firebase ID token không hợp lệ.');
    }
    const kid = decoded?.header?.kid;
    if (decoded?.header?.alg !== 'RS256' || !kid) throw new UnauthorizedException('Firebase ID token không hợp lệ.');

    const { config } = await this.authService.getFirebaseConfig();
    const projectId = config?.projectId;
    if (!projectId) throw new ServiceUnavailableException('API chưa cấu hình Firebase project ID.');

    const keys = await this.loadCertificates();
    const publicKey = Object.prototype.hasOwnProperty.call(keys, kid) ? keys[kid] : undefined;
    if (typeof publicKey !== 'string') throw new UnauthorizedException('Firebase ID token không hợp lệ.');

    try {
      const claims = await this.jwt.verifyAsync<{
        sub: string; exp: number; iat: number; auth_time: number;
        email?: string; email_verified?: boolean; name?: string; picture?: string;
        firebase?: { sign_in_provider?: string };
      }>(profile.idToken, {
        publicKey, algorithms: ['RS256'], audience: projectId,
        issuer: `https://securetoken.google.com/${projectId}`,
      });
      const now = Math.floor(Date.now() / 1000);
      if (!claims.sub || claims.sub.length > 128 || !Number.isFinite(claims.exp) ||
          !Number.isFinite(claims.iat) || claims.iat > now || !Number.isFinite(claims.auth_time) ||
          claims.auth_time > now || claims.firebase?.sign_in_provider !== provider ||
          typeof claims.email !== 'string' || !claims.email || claims.email_verified !== true) {
        throw new Error('Invalid Firebase identity');
      }
      return claims;
    } catch {
      throw new UnauthorizedException('Phiên Firebase không hợp lệ hoặc email chưa được xác minh.');
    }
  }

  /**
   * Safe Account Linking:
   * If a user with the OAuth email already exists, link and return session tokens.
   * If not, create a new verified user profile and return session tokens.
   * INVARIANT: Never allow automated OAuth takeover of ADMIN or SUPER_ADMIN accounts.
   */
  async handleOAuthUser(profile: OAuthUserProfile, deviceId?: string) {
    if (typeof deviceId !== 'string' || !deviceId.trim() || deviceId.length > 512) {
      throw new ForbiddenException('Thiếu mã thiết bị. Vui lòng cập nhật ứng dụng và đăng nhập lại.');
    }
    const identity = await this.verifyOAuthToken(profile);
    const email = identity.email!.toLowerCase();

    let user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true, streak: true, xp: true },
    });

    if (!user) {
      try {
        user = await this.prisma.user.create({
          data: {
            email,
            displayName: identity.name || email.split('@')[0],
            avatar: identity.picture,
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
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error;
        user = await this.prisma.user.findUnique({
          where: { email },
          include: { profile: true, streak: true, xp: true },
        });
      }
    }

    // Invariant SEC-001: Protect elevated administrator accounts from client-side OAuth takeover
    if (user && (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN)) {
      throw new UnauthorizedException('Tài khoản quản trị viên yêu cầu đăng nhập trực tiếp bằng mật khẩu bảo mật.');
    }

    if (!user || user.status !== 'ACTIVE') throw new UnauthorizedException('Tài khoản chưa hoạt động.');

    const tokens = await this.authService.generateTokens(user.id, user.email, user.role);
    const device = await this.devices.registerOrValidateDevice(user.id, user.role, { deviceId }, tokens.refreshToken);
    if (!device.allowed) throw new ForbiddenException({
      code: device.code || 'DEVICE_LIMIT_EXCEEDED', message: device.message,
      limit: device.limit, activeCount: device.activeCount,
    });
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
