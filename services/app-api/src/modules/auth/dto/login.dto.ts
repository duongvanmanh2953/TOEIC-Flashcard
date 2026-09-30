import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'learner@vocabflow.ai' })
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @ApiProperty({ example: 'uuid-device-id', required: false })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiProperty({ example: 'Chrome on Windows', required: false })
  @IsOptional()
  @IsString()
  deviceName?: string;

  @ApiProperty({ example: 'Windows', required: false })
  @IsOptional()
  @IsString()
  os?: string;

  @ApiProperty({ example: 'Chrome', required: false })
  @IsOptional()
  @IsString()
  browser?: string;

  @ApiProperty({ example: 'DESKTOP', required: false })
  @IsOptional()
  @IsString()
  deviceType?: string;
}
