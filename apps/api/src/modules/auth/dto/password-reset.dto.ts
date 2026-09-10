import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Quy chuẩn mật khẩu bảo mật VocabFlow AI:
 * - Độ dài: từ 8 đến 64 ký tự
 * - Ít nhất 1 chữ cái in hoa (A-Z)
 * - Ít nhất 1 chữ cái in thường (a-z)
 * - Ít nhất 1 chữ số (0-9)
 * - Ít nhất 1 ký tự đặc biệt (!@#$%^&*()_+-=[]{}|;:,.<>?)
 * - Không chứa khoảng trắng
 */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[^\s]{8,64}$/;
export const PASSWORD_STANDARD_MESSAGE =
  'Mật khẩu phải từ 8 đến 64 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt (!@#$%^&*...). Không chứa khoảng trắng.';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'learner@vocabflow.ai', description: 'Địa chỉ email tài khoản cần khôi phục mật khẩu' })
  @IsEmail({}, { message: 'Địa chỉ email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;
}

export class VerifyResetOtpDto {
  @ApiProperty({ example: 'learner@vocabflow.ai', description: 'Địa chỉ email tài khoản' })
  @IsEmail({}, { message: 'Địa chỉ email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty({ example: '123456', description: 'Mã xác thực OTP gồm đúng 6 chữ số gửi qua email' })
  @IsString({ message: 'Mã xác thực phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Mã xác thực OTP không được để trống' })
  @Matches(/^\d{6}$/, { message: 'Mã xác thực OTP phải gồm đúng 6 chữ số' })
  otp: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'learner@vocabflow.ai' })
  @IsEmail({}, { message: 'Địa chỉ email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty({ example: '123456', description: 'Mã xác thực 6 chữ số gửi qua email' })
  @IsString({ message: 'Mã xác thực phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Mã xác thực không được để trống' })
  @Matches(/^\d{6}$/, { message: 'Mã xác thực OTP phải gồm đúng 6 chữ số' })
  otp: string;

  @ApiProperty({ example: 'VocabFlow@2026', description: 'Mật khẩu mới đáp ứng quy chuẩn bảo mật' })
  @IsString({ message: 'Mật khẩu mới phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @Matches(PASSWORD_REGEX, { message: PASSWORD_STANDARD_MESSAGE })
  newPassword: string;
}
