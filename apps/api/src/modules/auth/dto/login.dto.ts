import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'learner@vocabflow.ai' })
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
