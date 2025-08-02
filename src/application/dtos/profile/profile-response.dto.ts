import { ApiProperty } from '@nestjs/swagger';

export class ProfileResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  readonly id: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
  })
  readonly email: string;

  @ApiProperty({
    description: 'User profile information',
    example: {
      firstName: 'John',
      lastName: 'Doe',
      avatar: 'https://example.com/avatars/john-doe.jpg',
      phone: '+1-555-123-4567'
    },
  })
  readonly profile: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    phone?: string;
  };

  @ApiProperty({
    description: 'Whether the user\'s email is verified',
    example: true,
  })
  readonly emailVerified: boolean;

  @ApiProperty({
    description: 'When the user was created',
    example: '2024-01-15T10:30:00.000Z',
  })
  readonly createdAt: Date;

  @ApiProperty({
    description: 'When the user was last updated',
    example: '2024-01-15T14:45:00.000Z',
  })
  readonly updatedAt: Date;

  constructor(data: {
    id: string;
    email: string;
    profile: {
      firstName?: string;
      lastName?: string;
      avatar?: string;
      phone?: string;
    };
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = data.id;
    this.email = data.email;
    this.profile = data.profile;
    this.emailVerified = data.emailVerified;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
