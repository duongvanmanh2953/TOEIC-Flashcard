import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SecurityController } from './security.controller';
import { DeviceSecurityService } from './device-security.service';
import { JwtStrategy } from './jwt.strategy';
import { OAuthService } from './oauth.service';
import { MailService } from './mail.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
  ],
  controllers: [AuthController, SecurityController],
  providers: [AuthService, DeviceSecurityService, JwtStrategy, OAuthService, MailService],
  exports: [AuthService, DeviceSecurityService, JwtStrategy, PassportModule, OAuthService, MailService],
})
export class AuthModule {}
