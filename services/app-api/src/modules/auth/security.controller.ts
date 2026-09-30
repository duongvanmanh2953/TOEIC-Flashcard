import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Headers,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DeviceSecurityService, DeviceMetadata } from './device-security.service';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, RiskEventStatus } from '@prisma/client';
import { Request } from 'express';

@ApiTags('Security & Device Management')
@Controller('security')
export class SecurityController {
  constructor(
    private readonly deviceSecurityService: DeviceSecurityService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Helper to parse device metadata from express request
   */
  private extractDeviceMeta(req: Request, body?: any, deviceIdHeader?: string): DeviceMetadata {
    const rawUa = req.headers['user-agent'] || '';
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket?.remoteAddress ||
      '127.0.0.1';

    let os = 'Unknown OS';
    if (/windows/i.test(rawUa)) os = 'Windows';
    else if (/macintosh|mac os x/i.test(rawUa)) os = 'macOS';
    else if (/iphone|ipad|ipod/i.test(rawUa)) os = 'iOS';
    else if (/android/i.test(rawUa)) os = 'Android';
    else if (/linux/i.test(rawUa)) os = 'Linux';

    let browser = 'Unknown Browser';
    if (/edg/i.test(rawUa)) browser = 'Microsoft Edge';
    else if (/chrome|crios/i.test(rawUa)) browser = 'Chrome';
    else if (/firefox|fxios/i.test(rawUa)) browser = 'Firefox';
    else if (/safari/i.test(rawUa)) browser = 'Safari';

    const deviceId = body?.deviceId || deviceIdHeader || req.headers['x-device-id'] || undefined;
    const deviceName = body?.deviceName || `${browser} trên ${os}`;

    return {
      deviceId: typeof deviceId === 'string' ? deviceId : undefined,
      deviceName,
      os,
      browser,
      userAgent: rawUa,
      ip,
    };
  }

  // =========================================================================
  // USER DEVICE MANAGEMENT
  // =========================================================================

  @UseGuards(JwtAuthGuard)
  @Get('devices')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of active and allowed login devices for current user' })
  getUserDevices(
    @CurrentUser('id') userId: string,
    @Headers('x-device-id') currentDeviceId?: string,
  ) {
    return this.deviceSecurityService.getUserDevices(userId, currentDeviceId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('devices/register')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Explicitly register or heartbeat current device' })
  registerDevice(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Req() req: Request,
    @Body() body: any,
    @Headers('x-device-id') deviceIdHeader?: string,
  ) {
    const meta = this.extractDeviceMeta(req, body, deviceIdHeader);
    return this.deviceSecurityService.registerOrValidateDevice(userId, role, meta);
  }

  @UseGuards(JwtAuthGuard)
  @Post('device-logout/request-otp')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request email OTP code before logging out another device' })
  requestDeviceLogoutOtp(
    @CurrentUser('id') userId: string,
    @Body('targetDeviceId') targetDeviceId: string,
  ) {
    if (!targetDeviceId) {
      throw new BadRequestException('Vui lòng chỉ định thiết bị cần đăng xuất (targetDeviceId).');
    }
    return this.deviceSecurityService.requestDeviceLogoutOtp(userId, targetDeviceId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('device-logout/verify-otp')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP code and revoke target device session' })
  verifyDeviceLogoutOtp(
    @CurrentUser('id') userId: string,
    @Body('targetDeviceId') targetDeviceId: string,
    @Body('otp') otp: string,
  ) {
    if (!targetDeviceId || !otp) {
      throw new BadRequestException('Vui lòng cung cấp targetDeviceId và mã OTP.');
    }
    return this.deviceSecurityService.verifyDeviceLogoutOtp(userId, targetDeviceId, otp);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('devices/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke and remove a device record' })
  revokeDevice(
    @CurrentUser('id') userId: string,
    @Param('id') targetDeviceId: string,
  ) {
    return this.deviceSecurityService.revokeDevice(userId, targetDeviceId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('devices/:id/logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Alias to revoke/logout device' })
  logoutDevice(
    @CurrentUser('id') userId: string,
    @Param('id') targetDeviceId: string,
  ) {
    return this.deviceSecurityService.revokeDevice(userId, targetDeviceId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('devices/:id/revoke')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Alias to revoke device' })
  revokeDeviceAlias(
    @CurrentUser('id') userId: string,
    @Param('id') targetDeviceId: string,
  ) {
    return this.deviceSecurityService.revokeDevice(userId, targetDeviceId);
  }
}
