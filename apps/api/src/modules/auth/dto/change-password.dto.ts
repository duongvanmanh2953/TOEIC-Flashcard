import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PASSWORD_REGEX, PASSWORD_STANDARD_MESSAGE } from './password-reset.dto';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Mật khẩu hiện tại' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu hiện tại' })
  currentPassword: string;

  @ApiProperty({ description: 'Mật khẩu mới' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu mới' })
  @Matches(PASSWORD_REGEX, { message: PASSWORD_STANDARD_MESSAGE })
  newPassword: string;
}

export class AdminChangePasswordDto {
  @ApiProperty({ description: 'Mật khẩu đăng nhập admin hiện tại' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu hiện tại' })
  currentPassword: string;

  @ApiProperty({ description: 'Mật khẩu mới cho admin' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu mới' })
  @Matches(PASSWORD_REGEX, { message: PASSWORD_STANDARD_MESSAGE })
  newPassword: string;
}

export class AdminUpdateKeypassDto {
  @ApiProperty({ description: 'Mã khóa bảo mật (Keypass) hiện tại' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập mã khóa bảo mật hiện tại' })
  currentKeypass: string;

  @ApiProperty({ description: 'Mã khóa bảo mật mới' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập mã khóa bảo mật mới' })
  newKeypass: string;
}

export class AdminResetAllDataDto {
  @ApiProperty({ description: 'Phải nhập chính xác chữ "RESET"' })
  @IsString()
  @IsNotEmpty({ message: 'Xác nhận chữ RESET là bắt buộc' })
  confirmText: string;

  @ApiProperty({ description: 'Mật khẩu đăng nhập Quản trị viên' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu admin' })
  adminPassword: string;

  @ApiProperty({ description: 'Mã khóa bảo mật hệ thống (Admin Keypass)' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập mã bảo mật hệ thống' })
  adminKeypass: string;
}
