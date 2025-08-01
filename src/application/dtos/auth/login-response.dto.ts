import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  readonly accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  readonly refreshToken: string;

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer',
    default: 'Bearer',
  })
  readonly tokenType: string = 'Bearer';

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 900,
  })
  readonly expiresIn: number;

  @ApiProperty({
    description: 'User information',
    example: {
      id: '507f1f77bcf86cd799439011',
      email: 'user@example.com',
      roles: ['user'],
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        avatar: 'https://example.com/avatar.jpg',
        phone: '+1234567890',
      },
      emailVerified: true,
    },
  })
  readonly user: {
    id: string;
    email: string;
    roles: string[];
    profile: {
      firstName?: string;
      lastName?: string;
      avatar?: string;
      phone?: string;
    };
    emailVerified: boolean;
  };

  constructor(
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
    user: {
      id: string;
      email: string;
      roles: string[];
      profile: {
        firstName?: string;
        lastName?: string;
        avatar?: string;
        phone?: string;
      };
      emailVerified: boolean;
    }
  ) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.expiresIn = expiresIn;
    this.user = user;
  }
}
