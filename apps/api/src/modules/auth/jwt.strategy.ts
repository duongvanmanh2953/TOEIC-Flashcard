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
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Tài khoản không tồn tại hoặc đã bị vô hiệu hóa.');
    }

    const deviceId = req?.headers?.['x-device-id'] || req?.body?.deviceId;
    if (deviceId) {
      const device = await this.prisma.userDevice.findUnique({
        where: { userId_deviceId: { userId: user.id, deviceId: String(deviceId) } },
        select: { status: true, isAllowed: true },
      });

      if (device && (!device.isAllowed || device.status === DeviceStatus.REVOKED || device.status === DeviceStatus.BLOCKED)) {
        throw new UnauthorizedException('Phiên đăng nhập trên thiết bị này đã bị thu hồi hoặc đăng xuất từ nơi khác.');
      }
    }

    // For Admin: Admin only allowed 1 active device/token at any given time
    if (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) {
      if (deviceId) {
        const activeAdminDevices = await this.prisma.userDevice.findMany({
          where: { userId: user.id, status: DeviceStatus.ACTIVE, isAllowed: true },
          orderBy: { lastSeenAt: 'desc' },
          select: { deviceId: true },
        });

        // If there's an active device and it doesn't match this request's device, reject
        if (activeAdminDevices.length > 0 && activeAdminDevices[0].deviceId !== deviceId) {
          throw new UnauthorizedException('Tài khoản Quản trị viên chỉ được phép đăng nhập trên 1 thiết bị duy nhất. Phiên làm việc trên máy này đã hết hiệu lực.');
        }
      }
    }

    return user;
  }
}
