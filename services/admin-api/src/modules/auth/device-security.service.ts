import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from './mail.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import {
  Role,
  DeviceStatus,
  SessionStatus,
  RiskEventType,
  RiskEventStatus,
  AccountRiskStatus,
} from '@prisma/client';
import { ResetOptionsDto } from './dto/change-password.dto';

export const DEVICE_LIMITS = {
  USER: 3,
  ADMIN: 2,
} as const;

export interface DeviceMetadata {
  deviceId?: string;
  deviceName?: string;
  deviceType?: string;
  os?: string;
  browser?: string;
  userAgent?: string;
  ip?: string;
}

@Injectable()
export class DeviceSecurityService {
  private readonly logger = new Logger(DeviceSecurityService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  /**
   * Helper to resolve device limit by user role
   */
  getDeviceLimit(role: string): number {
    return role === Role.ADMIN || role === Role.SUPER_ADMIN
      ? DEVICE_LIMITS.ADMIN
      : DEVICE_LIMITS.USER;
  }

  /**
   * Register or validate login device under strict concurrency protection
   */
  async registerOrValidateDevice(
    userId: string,
    role: string,
    meta: DeviceMetadata,
    refreshToken?: string,
  ): Promise<{
    allowed: boolean;
    device: any;
    limit: number;
    activeCount: number;
    code?: string;
    message?: string;
  }> {
    const rawDeviceId = (meta.deviceId || '').trim();
    const deviceId = rawDeviceId || crypto.randomUUID();
    const deviceName = meta.deviceName || 'Trình duyệt Web';
    const os = meta.os || 'Unknown OS';
    const browser = meta.browser || 'Unknown Browser';
    const userAgent = meta.userAgent || 'Unknown UA';
    const ip = meta.ip || '127.0.0.1';
    const deviceType = meta.deviceType || (/(mobile|android|iphone|ipad)/i.test(userAgent) ? 'MOBILE' : 'DESKTOP');

    const limit = this.getDeviceLimit(role);

    // Concurrency / Transactional evaluation
    return await this.prisma.$transaction(async (tx) => {
      // 1. Check if user account itself is blocked
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, displayName: true, accountRiskStatus: true, status: true },
      });

      if (!user || user.status === 'SUSPENDED' || user.accountRiskStatus === AccountRiskStatus.BLOCKED) {
        throw new ForbiddenException('Tài khoản của bạn đang bị khóa do vi phạm chính sách bảo mật.');
      }

      // 2. Check if this device record already exists for this user
      const existingDevice = await tx.userDevice.findUnique({
        where: {
          userId_deviceId: { userId, deviceId },
        },
      });

      // If device is explicitly blocked
      if (existingDevice && existingDevice.status === DeviceStatus.BLOCKED) {
        throw new ForbiddenException('Thiết bị này đã bị chặn truy cập vào hệ thống. Vui lòng liên hệ quản trị viên.');
      }

      const isAdmin = role === Role.ADMIN || role === Role.SUPER_ADMIN;

      // 3. Count currently allowed & active devices
      const activeDevices = await tx.userDevice.findMany({
        where: {
          userId,
          status: DeviceStatus.ACTIVE,
          isAllowed: true,
        },
      });

      const activeCount = activeDevices.length;
      const isAlreadyAllowed = activeDevices.some((d) => d.deviceId === deviceId);

      if (isAdmin && activeCount >= limit && !isAlreadyAllowed) {
        // Enforce limit (2 devices): gracefully revoke only the OLDEST active device
        const sorted = [...activeDevices].sort(
          (a, b) => new Date(a.lastSeenAt || a.createdAt).getTime() - new Date(b.lastSeenAt || b.createdAt).getTime(),
        );
        const oldest = sorted[0];
        if (oldest) {
          await tx.userDevice.update({
            where: { id: oldest.id },
            data: { status: DeviceStatus.REVOKED, isAllowed: false },
          });
          await tx.userSession.updateMany({
            where: { userId, deviceId: oldest.deviceId },
            data: { status: SessionStatus.REVOKED },
          });
        }
      }

      // Case A: Device already has an approved slot
      if (isAlreadyAllowed) {
        const updated = await tx.userDevice.update({
          where: { userId_deviceId: { userId, deviceId } },
          data: {
            deviceName,
            os,
            browser,
            userAgent,
            ipLastSeen: ip,
            lastSeenAt: new Date(),
          },
        });

        // Record session
        await this.createOrUpdateSession(tx, userId, deviceId, ip, userAgent, refreshToken);

        return {
          allowed: true,
          device: updated,
          limit,
          activeCount: 1,
        };
      }

      // Case B: NEW device, but user has capacity (e.g. activeCount < limit)
      if (activeCount < limit || isAdmin) {
        const newDevice = await tx.userDevice.upsert({
          where: { userId_deviceId: { userId, deviceId } },
          create: {
            userId,
            deviceId,
            deviceName,
            deviceType,
            os,
            browser,
            userAgent,
            ipLastSeen: ip,
            status: DeviceStatus.ACTIVE,
            isAllowed: true,
            isPrimary: activeCount === 0,
          },
          update: {
            deviceName,
            deviceType,
            os,
            browser,
            userAgent,
            ipLastSeen: ip,
            status: DeviceStatus.ACTIVE,
            isAllowed: true,
            lastSeenAt: new Date(),
          },
        });

        // Record session
        await this.createOrUpdateSession(tx, userId, deviceId, ip, userAgent, refreshToken);

        // Audit log
        await tx.auditLog.create({
          data: {
            actorId: userId,
            action: 'LOGIN_DEVICE_REGISTERED',
            targetType: 'USER_DEVICE',
            targetId: deviceId,
            metadata: { deviceName, os, browser, ip, activeCount: activeCount + 1, limit },
          },
        }).catch(() => {});

        return {
          allowed: true,
          device: newDevice,
          limit,
          activeCount: activeCount + 1,
        };
      }

      // Case C: DEVICE LIMIT EXCEEDED (Device #4 for user, or Device #2 for Admin)
      // DO NOT delete or replace older devices automatically!
      const pendingDevice = await tx.userDevice.upsert({
        where: { userId_deviceId: { userId, deviceId } },
        create: {
          userId,
          deviceId,
          deviceName,
          deviceType,
          os,
          browser,
          userAgent,
          ipLastSeen: ip,
          status: DeviceStatus.PENDING_REVIEW,
          isAllowed: false,
          isPrimary: false,
        },
        update: {
          deviceName,
          deviceType,
          os,
          browser,
          userAgent,
          ipLastSeen: ip,
          status: DeviceStatus.PENDING_REVIEW,
          isAllowed: false,
          lastSeenAt: new Date(),
        },
      });

      // Create Device Risk Event
      const riskEvent = await tx.deviceRiskEvent.create({
        data: {
          userId,
          deviceId,
          eventType: RiskEventType.DEVICE_LIMIT_EXCEEDED,
          status: RiskEventStatus.PENDING,
          ip,
          userAgent,
          reviewNote: `Đăng nhập vượt giới hạn thiết bị (${activeCount}/${limit} thiết bị đã dùng). Đang chờ quản trị viên duyệt hoặc người dùng đăng xuất thiết bị cũ.`,
        },
      });

      // Update User Risk Status to UNDER_REVIEW
      await tx.user.update({
        where: { id: userId },
        data: { accountRiskStatus: AccountRiskStatus.UNDER_REVIEW },
      }).catch(() => {});

      // Send Security Alert Email
      this.mailService.sendNewDeviceRiskAlert(
        user.email,
        {
          deviceName,
          os,
          browser,
          ip,
          time: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
        },
        user.displayName,
      ).catch((err) => this.logger.warn(`Failed to send risk email: ${err.message}`));

      // Audit log
      await tx.auditLog.create({
        data: {
          actorId: userId,
          action: 'LOGIN_DEVICE_LIMIT_EXCEEDED',
          targetType: 'DEVICE_RISK_EVENT',
          targetId: riskEvent.id,
          metadata: { deviceName, os, browser, ip, activeCount, limit },
        },
      }).catch(() => {});

      return {
        allowed: false,
        code: 'DEVICE_LIMIT_EXCEEDED',
        message:
          role === Role.ADMIN || role === Role.SUPER_ADMIN
            ? 'Tài khoản Quản trị viên chỉ được phép đăng nhập trên 1 thiết bị duy nhất. Thiết bị mới đã bị tạm giữ và tạo cảnh báo an ninh.'
            : 'Tài khoản của bạn đã đạt giới hạn tối đa 3 thiết bị đăng nhập. Thiết bị mới đang ở trạng thái chờ duyệt hoặc bạn có thể vào Cài đặt > Bảo mật để đăng xuất thiết bị cũ.',
        device: pendingDevice,
        limit,
        activeCount,
      };
    });
  }

  /**
   * Helper to create/refresh session record
   */
  private async createOrUpdateSession(
    tx: any,
    userId: string,
    deviceId: string,
    ip: string,
    userAgent: string,
    refreshToken?: string,
  ) {
    const refreshTokenHash = refreshToken ? crypto.createHash('sha256').update(refreshToken).digest('hex') : null;
    const expiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days policy

    await tx.userSession.create({
      data: {
        userId,
        deviceId,
        refreshTokenHash,
        ip,
        userAgent,
        status: SessionStatus.ACTIVE,
        expiresAt,
        lastSeenAt: new Date(),
      },
    }).catch(() => {});
  }

  /**
   * Get all registered devices for user
   */
  async getUserDevices(userId: string, currentDeviceId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const limit = this.getDeviceLimit(user.role);

    const devices = await this.prisma.userDevice.findMany({
      where: { userId },
      orderBy: [{ isAllowed: 'desc' }, { lastSeenAt: 'desc' }],
      include: {
        sessions: {
          where: { status: SessionStatus.ACTIVE },
          orderBy: { lastSeenAt: 'desc' },
          take: 1,
        },
      },
    });

    const activeCount = devices.filter((d) => d.status === DeviceStatus.ACTIVE && d.isAllowed).length;

    return {
      limit,
      activeCount,
      usageText: `${activeCount} / ${limit} thiết bị đã sử dụng`,
      currentDeviceId: currentDeviceId || null,
      devices: devices.map((d) => ({
        id: d.id,
        deviceId: d.deviceId,
        deviceName: d.deviceName,
        deviceType: d.deviceType,
        os: d.os || 'Unknown OS',
        browser: d.browser || 'Unknown Browser',
        ip: d.ipLastSeen || 'N/A',
        status: d.status,
        isAllowed: d.isAllowed,
        isPrimary: d.isPrimary,
        isCurrent: Boolean(currentDeviceId && d.deviceId === currentDeviceId),
        firstSeenAt: d.firstSeenAt,
        lastSeenAt: d.lastSeenAt,
      })),
    };
  }

  /**
   * Request OTP to logout another device
   */
  async requestDeviceLogoutOtp(userId: string, targetDeviceId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, displayName: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const targetDevice = await this.prisma.userDevice.findUnique({
      where: {
        userId_deviceId: { userId, deviceId: targetDeviceId },
      },
    });

    if (!targetDevice) {
      throw new NotFoundException('Không tìm thấy thiết bị cần đăng xuất.');
    }

    // Invalidate previous pending OTPs for this target device
    await this.prisma.deviceLogoutOtp.deleteMany({
      where: { userId, targetDeviceId },
    });

    // Generate numeric 6-digit OTP
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(rawOtp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.deviceLogoutOtp.create({
      data: {
        userId,
        targetDeviceId,
        otpHash,
        expiresAt,
      },
    });

    // Send email
    await this.mailService.sendDeviceLogoutOtp(user.email, rawOtp, targetDevice.deviceName, user.displayName);

    // Mask email e.g. m***@gmail.com
    const [name, domain] = user.email.split('@');
    const maskedEmail = `${name.slice(0, 1)}***@${domain}`;

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'OTP_REQUESTED_FOR_DEVICE_LOGOUT',
        targetType: 'USER_DEVICE',
        targetId: targetDeviceId,
        metadata: { targetDeviceName: targetDevice.deviceName },
      },
    }).catch(() => {});

    return {
      success: true,
      message: `Mã OTP đã được gửi đến email ${maskedEmail}. Vui lòng nhập mã để xác nhận.`,
      maskedEmail,
      expiresInSeconds: 600,
    };
  }

  /**
   * Verify OTP and logout target device
   */
  async verifyDeviceLogoutOtp(userId: string, targetDeviceId: string, otp: string) {
    const cleanOtp = (otp || '').trim();
    if (!cleanOtp) throw new BadRequestException('Vui lòng nhập mã OTP.');

    const otpRecord = await this.prisma.deviceLogoutOtp.findFirst({
      where: {
        userId,
        targetDeviceId,
        usedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new BadRequestException('Yêu cầu OTP không tồn tại hoặc đã được sử dụng. Vui lòng gửi lại mã mới.');
    }

    if (otpRecord.expiresAt < new Date()) {
      throw new BadRequestException('Mã OTP đã hết hạn. Vui lòng bấm gửi lại mã mới.');
    }

    if (otpRecord.attempts >= 5) {
      throw new BadRequestException('Bạn đã nhập sai quá 5 lần. Mã OTP này đã bị hủy vì lý do an toàn.');
    }

    const isMatch = await bcrypt.compare(cleanOtp, otpRecord.otpHash);
    if (!isMatch) {
      await this.prisma.deviceLogoutOtp.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException(`Mã OTP không chính xác (Lần thử ${otpRecord.attempts + 1}/5).`);
    }

    // OTP is valid! Mark as used
    await this.prisma.deviceLogoutOtp.update({
      where: { id: otpRecord.id },
      data: { usedAt: new Date() },
    });

    // Revoke target device and all its active sessions
    await this.prisma.$transaction(async (tx) => {
      await tx.userDevice.updateMany({
        where: { userId, deviceId: targetDeviceId },
        data: { status: DeviceStatus.REVOKED, isAllowed: false },
      });

      await tx.userSession.updateMany({
        where: { userId, deviceId: targetDeviceId, status: SessionStatus.ACTIVE },
        data: { status: SessionStatus.REVOKED, revokedAt: new Date() },
      });

      // Write audit log
      await tx.auditLog.create({
        data: {
          actorId: userId,
          action: 'DEVICE_LOGOUT_SUCCESS_VIA_OTP',
          targetType: 'USER_DEVICE',
          targetId: targetDeviceId,
          metadata: { timestamp: new Date().toISOString() },
        },
      }).catch(() => {});
    });

    return {
      success: true,
      message: 'Đã xác thực OTP thành công. Thiết bị mục tiêu đã được đăng xuất khỏi tài khoản của bạn.',
    };
  }

  /**
   * Directly revoke device (e.g. from Admin or when user revokes self device)
   */
  async revokeDevice(userId: string, targetDeviceId: string, actorId?: string) {
    const device = await this.prisma.userDevice.findUnique({
      where: { userId_deviceId: { userId, deviceId: targetDeviceId } },
    });
    if (!device) throw new NotFoundException('Thiết bị không tồn tại.');

    await this.prisma.$transaction(async (tx) => {
      await tx.userDevice.updateMany({
        where: { userId, deviceId: targetDeviceId },
        data: { status: DeviceStatus.REVOKED, isAllowed: false },
      });

      await tx.userSession.updateMany({
        where: { userId, deviceId: targetDeviceId, status: SessionStatus.ACTIVE },
        data: { status: SessionStatus.REVOKED, revokedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          actorId: actorId || userId,
          action: 'DEVICE_REVOKED',
          targetType: 'USER_DEVICE',
          targetId: targetDeviceId,
          metadata: { deviceName: device.deviceName },
        },
      }).catch(() => {});
    });

    return {
      success: true,
      message: `Đã thu hồi quyền truy cập của thiết bị "${device.deviceName}".`,
    };
  }

  /**
   * Password Change Session Invalidation:
   * Revokes ALL sessions & devices for that user, forcing re-login on all devices!
   */
  async revokeAllUserSessionsAndDevices(userId: string) {
    await this.prisma.$transaction(async (tx) => {
      // Clear refresh token
      await tx.user.update({
        where: { id: userId },
        data: { refreshToken: null },
      });

      // Revoke all sessions
      await tx.userSession.updateMany({
        where: { userId, status: SessionStatus.ACTIVE },
        data: { status: SessionStatus.REVOKED, revokedAt: new Date() },
      });

      // Mark devices as requiring re-login
      await tx.userDevice.updateMany({
        where: { userId },
        data: { status: DeviceStatus.REVOKED, isAllowed: false },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          actorId: userId,
          action: 'ALL_SESSIONS_REVOKED_PASSWORD_CHANGED',
          targetType: 'USER',
          targetId: userId,
          metadata: { timestamp: new Date().toISOString() },
        },
      }).catch(() => {});
    });
  }

  /**
   * Admin Keypass Management:
   * Keypass is stored persistent in DB (AdminSecurity table), hashed with bcrypt.
   * Changing admin password NEVER alters or deletes this key!
   */
  async getOrCreateAdminKeypass(adminUserId: string): Promise<string> {
    const existing = await this.prisma.adminSecurity.findUnique({
      where: { adminUserId },
    });

    if (existing) {
      return existing.keypassHash;
    }

    // Require explicit SERVER_MASTER_PASSWORD from server environment
    const defaultMasterKey = process.env.SERVER_MASTER_PASSWORD;
    if (!defaultMasterKey || defaultMasterKey.trim().length < 8) {
      throw new BadRequestException('Mã khóa bảo mật hệ thống (SERVER_MASTER_PASSWORD) chưa được cấu hình hoặc ngắn hơn 8 ký tự.');
    }
    const keypassHash = await bcrypt.hash(defaultMasterKey.trim(), 10);

    const created = await this.prisma.adminSecurity.create({
      data: {
        adminUserId,
        keypassHash,
      },
    });

    return created.keypassHash;
  }

  async verifyAdminKeypass(adminUserId: string, inputKeypass: string): Promise<boolean> {
    const keypassHash = await this.getOrCreateAdminKeypass(adminUserId);
    return await bcrypt.compare((inputKeypass || '').trim(), keypassHash);
  }

  async updateAdminKeypass(adminUserId: string, currentKeypass: string, newKeypass: string) {
    const isValid = await this.verifyAdminKeypass(adminUserId, currentKeypass);
    if (!isValid) {
      throw new BadRequestException('Mã khóa bảo mật quản trị (Admin Keypass) hiện tại không chính xác.');
    }

    if (!newKeypass || newKeypass.length < 8) {
      throw new BadRequestException('Mã khóa bảo mật mới phải có độ dài tối thiểu từ 8 ký tự.');
    }

    const keypassHash = await bcrypt.hash(newKeypass.trim(), 10);
    await this.prisma.adminSecurity.upsert({
      where: { adminUserId },
      create: { adminUserId, keypassHash },
      update: { keypassHash },
    });

    return {
      success: true,
      message: 'Cập nhật mã khóa bảo mật Quản trị viên (Admin Keypass) thành công!',
    };
  }

  // =========================================================================
  // ADMIN RISK MANAGEMENT
  // =========================================================================

  async getRiskyAccounts(query: {
    status?: RiskEventStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.search) {
      where.user = {
        OR: [
          { email: { contains: query.search, mode: 'insensitive' } },
          { displayName: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    const [total, events, pendingCount] = await Promise.all([
      this.prisma.deviceRiskEvent.count({ where }),
      this.prisma.deviceRiskEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
              role: true,
              accountRiskStatus: true,
              devices: {
                where: { status: DeviceStatus.ACTIVE, isAllowed: true },
                select: { id: true, deviceName: true, os: true, browser: true },
              },
            },
          },
          device: true,
        },
      }),
      this.prisma.deviceRiskEvent.count({ where: { status: RiskEventStatus.PENDING } }),
    ]);

    return {
      total,
      page,
      limit,
      pendingCount,
      items: events.map((ev) => ({
        id: ev.id,
        userId: ev.userId,
        userEmail: ev.user?.email || 'N/A',
        userName: ev.user?.displayName || 'Learner',
        userRole: ev.user?.role || 'USER',
        accountRiskStatus: ev.user?.accountRiskStatus || 'NORMAL',
        currentActiveDevicesCount: ev.user?.devices?.length || 0,
        currentDevices: ev.user?.devices || [],
        attemptedDeviceId: ev.deviceId,
        attemptedDeviceName: ev.device?.deviceName || 'Thiết bị lạ',
        os: ev.device?.os || 'Unknown OS',
        browser: ev.device?.browser || 'Unknown Browser',
        ip: ev.ip || ev.device?.ipLastSeen || 'N/A',
        eventType: ev.eventType,
        status: ev.status,
        reviewNote: ev.reviewNote,
        reviewedBy: ev.reviewedBy,
        reviewedAt: ev.reviewedAt,
        createdAt: ev.createdAt,
      })),
    };
  }

  async approveRiskEvent(eventId: string, adminId: string, note?: string) {
    const event = await this.prisma.deviceRiskEvent.findUnique({
      where: { id: eventId },
      include: { user: true },
    });
    if (!event) throw new NotFoundException('Risk event not found');

    await this.prisma.$transaction(async (tx) => {
      // Approve device
      await tx.userDevice.updateMany({
        where: { userId: event.userId, deviceId: event.deviceId },
        data: { status: DeviceStatus.ACTIVE, isAllowed: true },
      });

      // Update event
      await tx.deviceRiskEvent.update({
        where: { id: eventId },
        data: {
          status: RiskEventStatus.APPROVED,
          reviewedBy: adminId,
          reviewedAt: new Date(),
          reviewNote: note || 'Quản trị viên đã phê duyệt cấp quyền thiết bị hợp lệ.',
        },
      });

      // Check if user has other pending risk events
      const remainingPending = await tx.deviceRiskEvent.count({
        where: { userId: event.userId, status: RiskEventStatus.PENDING, id: { not: eventId } },
      });
      if (remainingPending === 0) {
        await tx.user.update({
          where: { id: event.userId },
          data: { accountRiskStatus: AccountRiskStatus.NORMAL },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'RISK_DEVICE_APPROVED',
          targetType: 'DEVICE_RISK_EVENT',
          targetId: eventId,
          metadata: { userId: event.userId, deviceId: event.deviceId, note },
        },
      }).catch(() => {});
    });

    return { success: true, message: 'Đã phê duyệt thiết bị thành công.' };
  }

  async blockRiskDevice(eventId: string, adminId: string, note?: string) {
    const event = await this.prisma.deviceRiskEvent.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new NotFoundException('Risk event not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.userDevice.updateMany({
        where: { userId: event.userId, deviceId: event.deviceId },
        data: { status: DeviceStatus.BLOCKED, isAllowed: false },
      });

      await tx.userSession.updateMany({
        where: { userId: event.userId, deviceId: event.deviceId },
        data: { status: SessionStatus.REVOKED, revokedAt: new Date() },
      });

      await tx.deviceRiskEvent.update({
        where: { id: eventId },
        data: {
          status: RiskEventStatus.BLOCKED,
          reviewedBy: adminId,
          reviewedAt: new Date(),
          reviewNote: note || 'Quản trị viên đã chặn vĩnh viễn thiết bị này.',
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'RISK_DEVICE_BLOCKED',
          targetType: 'DEVICE_RISK_EVENT',
          targetId: eventId,
          metadata: { userId: event.userId, deviceId: event.deviceId, note },
        },
      }).catch(() => {});
    });

    return { success: true, message: 'Đã chặn thiết bị thành công.' };
  }

  async exemptRiskEvent(eventId: string, adminId: string, note?: string) {
    await this.prisma.deviceRiskEvent.update({
      where: { id: eventId },
      data: {
        status: RiskEventStatus.EXEMPTED,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNote: note || 'Miễn xử lý cảnh báo bảo mật theo quyết định Quản trị viên.',
      },
    });

    return { success: true, message: 'Đã miễn xử lý cảnh báo bảo mật thành công.' };
  }

  async blockAccount(userId: string, adminId: string, reason?: string) {
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          accountRiskStatus: AccountRiskStatus.BLOCKED,
          status: 'SUSPENDED',
          refreshToken: null,
        },
      });

      // Revoke all active sessions immediately
      await tx.userSession.updateMany({
        where: { userId, status: SessionStatus.ACTIVE },
        data: { status: SessionStatus.REVOKED, revokedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'ACCOUNT_BLOCKED_BY_ADMIN',
          targetType: 'USER',
          targetId: userId,
          metadata: { reason },
        },
      }).catch(() => {});
    });

    return { success: true, message: 'Đã khóa tài khoản và hủy toàn bộ phiên làm việc thành công.' };
  }

  async getRiskAccountDetails(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        devices: { orderBy: { lastSeenAt: 'desc' } },
        sessions: { orderBy: { lastSeenAt: 'desc' }, take: 10 },
        riskEvents: { orderBy: { createdAt: 'desc' } },
        auditLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        status: user.status,
        accountRiskStatus: user.accountRiskStatus,
        createdAt: user.createdAt,
        lastActiveAt: user.lastActiveAt,
      },
      devices: user.devices,
      sessions: user.sessions,
      riskEvents: user.riskEvents,
      auditLogs: user.auditLogs,
    };
  }

  // =========================================================================
  // SYSTEM RESET: WIPE ALL BUSINESS DATA (KEEP ONLY ADMIN & SYSTEM CONSTANTS)
  // =========================================================================

  async resetAllData(
    adminUserId: string,
    confirmText: string,
    adminPasswordInput: string,
    adminKeypassInput: string,
    options?: ResetOptionsDto,
  ) {
    // 1. Strict preflight validation
    if ((confirmText || '').trim() !== 'RESET') {
      throw new BadRequestException('Vui lòng nhập chính xác chữ "RESET" để xác nhận hành động nguy hiểm.');
    }

    const admin = await this.prisma.user.findUnique({
      where: { id: adminUserId },
      include: { adminSecurity: true },
    });

    if (!admin || (admin.role !== Role.ADMIN && admin.role !== Role.SUPER_ADMIN)) {
      throw new ForbiddenException('Chỉ Quản trị viên cấp cao (ADMIN / SUPER_ADMIN) mới có quyền thực hiện Reset hệ thống.');
    }

    // 2. Verify admin login password
    const isPasswordValid = await bcrypt.compare(adminPasswordInput || '', admin.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Mật khẩu đăng nhập Quản trị viên không chính xác.');
    }

    // 3. Verify admin security keypass
    const isKeypassValid = await this.verifyAdminKeypass(adminUserId, adminKeypassInput || '');
    if (!isKeypassValid) {
      throw new UnauthorizedException('Mã khóa bảo mật hệ thống (Admin Security Key / Keypass) không chính xác.');
    }

    const opt = {
      wipeUsers: options?.wipeUsers ?? true,
      wipeRevenue: options?.wipeRevenue ?? true,
      wipeVocabulary: options?.wipeVocabulary ?? true,
      wipeGames: options?.wipeGames ?? true,
      preserveKidsGames: options?.preserveKidsGames ?? true,
      wipeExams: options?.wipeExams ?? true,
      wipeSupport: options?.wipeSupport ?? true,
      wipeDevices: options?.wipeDevices ?? true,
    };

    this.logger.warn(`[SYSTEM RESET INITIATED] Admin: ${admin.email} is executing reset with options: ${JSON.stringify(opt)}`);

    // 4. Retrieve all preserved admin IDs
    const adminUsers = await this.prisma.user.findMany({
      where: {
        OR: [{ role: Role.ADMIN }, { role: Role.SUPER_ADMIN }],
      },
      select: { id: true, email: true, role: true, displayName: true, passwordHash: true },
    });

    const adminIds = adminUsers.map((a) => a.id);

    // 5. Transactional Execution
    await this.prisma.$transaction(
      async (tx) => {
        // Record audit start
        await tx.auditLog.create({
          data: {
            actorId: adminUserId,
            action: 'SYSTEM_RESET_STARTED',
            targetType: 'DATABASE',
            targetId: 'GRANULAR_WIPE',
            metadata: { adminEmail: admin.email, options: opt, timestamp: new Date().toISOString() },
          },
        }).catch(() => {});

        // A. Operational, Support, Messaging & Feedback
        if (opt.wipeSupport) {
          await tx.supportMessage.deleteMany({});
          await tx.supportConversation.deleteMany({});
          await tx.feedbackVote.deleteMany({});
          await tx.feedback.deleteMany({});
          await tx.adminAnnouncement.deleteMany({});
          await tx.notification.deleteMany({});
          await tx.aIInteraction.deleteMany({});
          await tx.aIEvaluation.deleteMany({});
          await tx.bankAccessGrant.deleteMany({});
          await tx.chatMessage.deleteMany({});
          await tx.conversationParticipant.deleteMany({});
          await tx.conversation.deleteMany({});
        }

        // B. Revenue & Orders
        if (opt.wipeRevenue) {
          await tx.paymentOrder.deleteMany({});
          await tx.subscription.deleteMany({});
          await tx.entitlementUsage.deleteMany({});
        }

        // C. Exams, Attempts, Questions
        if (opt.wipeExams) {
          await tx.examAnswer.deleteMany({});
          await tx.examAttempt.deleteMany({});
          await tx.examSaved.deleteMany({});
          await tx.examLike.deleteMany({});
          await tx.examDislike.deleteMany({});
          await tx.examComment.deleteMany({});
          await tx.examOption.deleteMany({});
          await tx.examQuestion.deleteMany({});
          await tx.exam.deleteMany({});
          await tx.customQuizAttempt.deleteMany({});
          await tx.customQuiz.deleteMany({});
          await tx.deckComment.deleteMany({});
          await tx.deckLike.deleteMany({});
          await tx.deckDislike.deleteMany({});
          await tx.deckClone.deleteMany({});
          await tx.communityWord.deleteMany({});
          await tx.communityDeck.deleteMany({});
        }

        // D. Games & Rooms
        if (opt.wipeGames) {
          await tx.gameResult.deleteMany({});
          if (opt.preserveKidsGames) {
            // Keep questions and resources for kids, delete adult / general content
            await tx.gameQuestion.deleteMany({
              where: {
                NOT: {
                  OR: [
                    { category: { contains: 'kid', mode: 'insensitive' } },
                    { tags: { has: 'kids' } },
                  ],
                },
              },
            });
            await tx.learningResource.deleteMany({
              where: {
                NOT: {
                  OR: [
                    { category: { contains: 'kid', mode: 'insensitive' } },
                    { tags: { has: 'kids' } },
                  ],
                },
              },
            });
          } else {
            await tx.gameQuestion.deleteMany({});
            await tx.learningResource.deleteMany({});
          }
        }

        // E. Learning & Memory Brain (Progress, Sessions, Reviews, Captures, Journeys, Confusion)
        if (opt.wipeUsers) {
          await tx.reviewEvent.deleteMany({});
          await tx.studySession.deleteMany({});
          await tx.userVocabulary.deleteMany({});
          await tx.learningGoal.deleteMany({});
          await tx.userAchievement.deleteMany({});
          await tx.vocabularyCaptureItem.deleteMany({});
          await tx.vocabularyCapture.deleteMany({});
          await tx.wordJourneyEvent.deleteMany({});
          await tx.vocabularyConfusionPair.deleteMany({});
        }

        // F. Complete Vocabulary & Dictionary Wipe (Topics, Items, Relations, Examples, Meanings, Words)
        if (opt.wipeVocabulary) {
          await tx.vocabularyConfusionPair.deleteMany({});
          await tx.wordJourneyEvent.deleteMany({});
          await tx.vocabularyCaptureItem.deleteMany({});
          await tx.vocabularyCapture.deleteMany({});
          await tx.userVocabulary.deleteMany({});
          await tx.reviewEvent.deleteMany({});
          await tx.exercise.deleteMany({});
          await tx.vocabularyTopicItem.deleteMany({});
          await tx.vocabularyTopic.deleteMany({});
          await tx.wordRelation.deleteMany({});
          await tx.exampleSentence.deleteMany({});
          await tx.vocabularyMeaning.deleteMany({});
          await tx.vocabulary.deleteMany({});
        }

        // G. Security: Devices, Sessions, Risk Events, Logout OTPs
        if (opt.wipeDevices) {
          await tx.deviceLogoutOtp.deleteMany({});
          await tx.deviceRiskEvent.deleteMany({});
          await tx.userSession.deleteMany({});
          await tx.userDevice.deleteMany({});
        }

        // H. Delete all non-admin Users
        if (opt.wipeUsers) {
          await tx.userStreak.deleteMany({});
          await tx.userXP.deleteMany({});
          await tx.userEncryptionKey.deleteMany({
            where: { userId: { notIn: adminIds } },
          });
          await tx.userProfile.deleteMany({
            where: { userId: { notIn: adminIds } },
          });
          await tx.user.deleteMany({
            where: { id: { notIn: adminIds } },
          });

          // Restore clean Profile, Streak, and XP for preserved Admins
          for (const adm of adminUsers) {
            await tx.userStreak.upsert({
              where: { userId: adm.id },
              create: { userId: adm.id, currentStreak: 0, longestStreak: 0 },
              update: { currentStreak: 0, longestStreak: 0 },
            }).catch(() => {});

            await tx.userXP.upsert({
              where: { userId: adm.id },
              create: { userId: adm.id, totalXP: 0, currentLevel: 1 },
              update: { totalXP: 0, currentLevel: 1 },
            }).catch(() => {});

            await tx.userProfile.upsert({
              where: { userId: adm.id },
              create: {
                userId: adm.id,
                nativeLanguage: 'vi',
                englishLevel: 'B1',
                targetLevel: 'C1',
                learningGoal: 'System Administrator',
              },
              update: {},
            }).catch(() => {});

            // Ensure Admin Keypass is strictly preserved
            await this.getOrCreateAdminKeypass(adm.id);
          }
        }

        // Record audit completion
        await tx.auditLog.create({
          data: {
            actorId: adminUserId,
            action: 'SYSTEM_RESET_COMPLETED',
            targetType: 'DATABASE',
            targetId: 'GRANULAR_WIPE',
            metadata: {
              preservedAdmins: adminUsers.map((a) => a.email),
              options: opt,
              timestamp: new Date().toISOString(),
            },
          },
        }).catch(() => {});
      },
      { timeout: 60000 },
    );

    // 6. FINAL VERIFICATION: Check remaining records
    const [
      remainingNonAdminUsers,
      remainingSessions,
      remainingDevices,
      remainingExams,
      remainingDecks,
      remainingOrders,
      remainingUserVocabs,
    ] = await Promise.all([
      this.prisma.user.count({ where: { id: { notIn: adminIds } } }),
      this.prisma.userSession.count(),
      this.prisma.userDevice.count(),
      this.prisma.exam.count(),
      this.prisma.communityDeck.count(),
      this.prisma.paymentOrder.count(),
      this.prisma.userVocabulary.count(),
    ]);

    if (
      (opt.wipeUsers && remainingNonAdminUsers > 0) ||
      (opt.wipeDevices && remainingSessions > 0) ||
      (opt.wipeExams && remainingExams > 0) ||
      (opt.wipeRevenue && remainingOrders > 0) ||
      (opt.wipeVocabulary && remainingUserVocabs > 0)
    ) {
      throw new Error(
        `RESET_VERIFICATION_FAILED: Dữ liệu nghiệp vụ được chọn chưa được dọn sạch hoàn toàn!`,
      );
    }

    this.logger.log('✅ SYSTEM RESET SUCCESSFULLY VERIFIED: Selected data domains wiped cleanly.');

    return {
      success: true,
      message: 'Hệ thống đã được thiết lập lại thành công! Dữ liệu được chọn đã được xóa sạch an toàn, chỉ giữ lại tài khoản Quản trị viên và mã bảo mật Keypass.',
      verification: {
        nonAdminUsers: remainingNonAdminUsers,
        activeSessions: remainingSessions,
        devices: remainingDevices,
        exams: remainingExams,
        communityDecks: remainingDecks,
        orders: remainingOrders,
        userVocabularies: remainingUserVocabs,
        preservedAdmins: adminUsers.map((a) => a.email),
      },
    };
  }
}
