import { IsString, MinLength, MaxLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Password reset token received via email',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2MGYxYjJlNGQxYTJjM2I0ZTVmNmE3YjgiLCJ0eXBlIjoicmVzZXQiLCJpYXQiOjE2MjM3NjY0MDAsImV4cCI6MTYyMzc3MDAwMH0.xyz789abc',
  })
  @IsString()
  @IsNotEmpty({ message: 'Reset token is required' })
  readonly token!: string;

  @ApiProperty({
    description: 'New password (minimum 8 characters)',
    example: 'NewSecurePassword123!',
    minLength: 8,
    maxLength: 128,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  readonly newPassword!: string;
}
