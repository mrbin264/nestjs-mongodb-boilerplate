import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the registered user',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  readonly id: string;

  @ApiProperty({
    description: 'Email address of the registered user',
    example: 'john.doe@example.com',
  })
  readonly email: string;

  @ApiProperty({
    description: 'Success message for user registration',
    example: 'User registered successfully',
  })
  readonly message: string;

  @ApiProperty({
    description: 'Whether email verification is required',
    example: true,
  })
  readonly emailVerificationRequired: boolean;

  constructor(
    id: string,
    email: string,
    message: string = 'User registered successfully',
    emailVerificationRequired: boolean = true
  ) {
    this.id = id;
    this.email = email;
    this.message = message;
    this.emailVerificationRequired = emailVerificationRequired;
  }
}
