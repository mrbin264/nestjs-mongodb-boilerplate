import { ApiProperty } from '@nestjs/swagger';

export class AuthMessageResponseDto {
  @ApiProperty({
    description: 'Status message for authentication operations',
    examples: [
      'Password reset link sent to your email',
      'Password has been reset successfully',
      'User logged out successfully',
      'Email verification sent'
    ],
  })
  readonly message: string;

  constructor(message: string) {
    this.message = message;
  }
}
