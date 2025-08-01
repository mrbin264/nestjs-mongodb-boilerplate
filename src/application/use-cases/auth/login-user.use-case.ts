import { Injectable, Inject } from '@nestjs/common';
import { Email } from '../../../domain/value-objects/email.vo';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { IHashService } from '../../interfaces/hash.service.interface';
import { ITokenService } from '../../interfaces/token.service.interface';
import { LoginUserDto } from '../../dtos/auth/login-user.dto';
import { LoginResponseDto } from '../../dtos/auth/login-response.dto';
import { InvalidCredentialsException } from '../../../domain/exceptions/invalid-credentials.exception';
import { UserNotFoundException } from '../../../domain/exceptions/user-not-found.exception';

// Import dependency injection tokens
import { 
  USER_REPOSITORY,
  HASH_SERVICE,
  JWT_SERVICE
} from '../../../infrastructure/infrastructure.module';

@Injectable()
export class LoginUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(HASH_SERVICE) private readonly hashService: IHashService,
    @Inject(JWT_SERVICE) private readonly tokenService: ITokenService,
  ) {}

  async execute(loginDto: LoginUserDto): Promise<LoginResponseDto> {
    // Create value objects
    const email = Email.create(loginDto.email);

    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UserNotFoundException('User not found');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new InvalidCredentialsException({ reason: 'Account is deactivated' });
    }

    // Verify password
    const isPasswordValid = await this.hashService.compare(
      loginDto.password,
      user.password.hashedValue
    );

    if (!isPasswordValid) {
      throw new InvalidCredentialsException({ reason: 'Invalid password' });
    }

    // Prepare token payload
    const tokenPayload = {
      userId: user.id.value,
      email: user.email.value,
      roles: user.roles.map(role => role.value),
    };

    // Generate tokens
    const accessToken = this.tokenService.generateAccessToken(tokenPayload);
    const refreshToken = this.tokenService.generateRefreshToken(tokenPayload);
    const expiresIn = this.tokenService.getAccessTokenExpirationTime();

    // Update last login time
    // Note: This would typically be handled by the infrastructure layer
    // For now, we'll skip this to keep the use case pure

    return new LoginResponseDto(
      accessToken,
      refreshToken,
      expiresIn,
      {
        id: user.id.value,
        email: user.email.value,
        roles: user.roles.map(role => role.value),
        profile: {
          ...(user.profile.firstName && { firstName: user.profile.firstName }),
          ...(user.profile.lastName && { lastName: user.profile.lastName }),
          ...(user.profile.avatar && { avatar: user.profile.avatar }),
          ...(user.profile.phone && { phone: user.profile.phone }),
        },
        emailVerified: user.emailVerified,
      }
    );
  }
}
