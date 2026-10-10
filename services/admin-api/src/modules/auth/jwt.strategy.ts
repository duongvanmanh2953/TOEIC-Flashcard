import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { DeviceStatus, Role } from '@prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: any) => {
          if (req?.cookies?.token) return req.cookies.token;
          const cookieStr = req?.headers?.cookie;
          if (cookieStr) {
            const match = cookieStr.match(/(?:^|;\s*)token=([^;]+)/);
            if (match) return decodeURIComponent(match[1]);
          }
          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET as string,
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: { sub: string; email: string; role: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatar: true,
        role: true,
        status: true,
        profile: true,
        refreshToken: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Tài khoản không tồn tại hoặc đã bị vô hiệu hóa.');
    }

    // Invalidate immediately if user was logged out or password changed
    if (!user.refreshToken) {
      throw new UnauthorizedException('Phiên đăng nhập đã hết hiệu lực do tài khoản đã đổi mật khẩu hoặc đăng xuất. Vui lòng đăng nhập lại.');
    }

    const deviceId = req?.headers?.['x-device-id'] || req?.body?.deviceId;
    if (deviceId) {
      const device = await this.prisma.userDevice.findUnique({
        where: { userId_deviceId: { userId: user.id, deviceId: String(deviceId) } },
        select: { id: true, status: true, isAllowed: true },
      });

      if (device && device.status === DeviceStatus.BLOCKED) {
        throw new UnauthorizedException('Thiết bị này đã bị chặn truy cập vào hệ thống.');
      }

      // If device was previously rotated to REVOKED, re-activate it since user has a valid unexpired JWT
      if (device && (device.status === DeviceStatus.REVOKED || !device.isAllowed)) {
        await this.prisma.userDevice.update({
          where: { id: device.id },
          data: { status: DeviceStatus.ACTIVE, isAllowed: true, lastSeenAt: new Date() },
        }).catch(() => {});
      }
    }

    // For Admin: allow up to 2 active devices; gracefully rotate oldest if exceeding
    if (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) {
      if (deviceId) {
        const activeAdminDevices = await this.prisma.userDevice.findMany({
          where: { userId: user.id, status: DeviceStatus.ACTIVE, isAllowed: true },
          orderBy: { lastSeenAt: 'desc' },
          select: { id: true, deviceId: true },
        });

        const isKnownDevice = activeAdminDevices.some((d) => d.deviceId === deviceId);
        if (!isKnownDevice && activeAdminDevices.length >= 2) {
          const oldest = activeAdminDevices[activeAdminDevices.length - 1];
          if (oldest) {
            await this.prisma.userDevice.update({
              where: { id: oldest.id },
              data: { status: DeviceStatus.REVOKED, isAllowed: false },
            }).catch(() => {});
          }
        }
      }
    }

    return user;
  }
}
