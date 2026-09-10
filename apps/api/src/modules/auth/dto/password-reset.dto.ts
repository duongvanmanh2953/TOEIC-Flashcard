import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'learner@vocabflow.ai', description: 'Địa chỉ email tài khoản cần khôi phục mật khẩu' })
  @IsEmail({}, { message: 'Địa chỉ email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'learner@vocabflow.ai' })
  @IsEmail({}, { message: 'Địa chỉ email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty({ example: '123456', description: 'Mã xác thực 6 chữ số gửi qua email' })
  @IsString()
  @IsNotEmpty({ message: 'Mã xác thực không được để trống' })
  otp: string;

  @ApiProperty({ example: 'newPassword123', description: 'Mật khẩu mới tối thiểu 6 ký tự' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  newPassword: string;
}
