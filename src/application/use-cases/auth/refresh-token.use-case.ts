import { Injectable, Inject } from '@nestjs/common';
import { UserId } from '../../../domain/value-objects/user-id.vo';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { ITokenService } from '../../interfaces/token.service.interface';
import { RefreshTokenDto } from '../../dtos/auth/refresh-token.dto';
import { RefreshTokenResponseDto } from '../../dtos/auth/refresh-token-response.dto';
import { InvalidCredentialsException } from '../../../domain/exceptions/invalid-credentials.exception';
import { UserNotFoundException } from '../../../domain/exceptions/user-not-found.exception';

// Import dependency injection tokens
import { USER_REPOSITORY, JWT_SERVICE } from '../../../infrastructure/infrastructure.module';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(JWT_SERVICE) private readonly tokenService: ITokenService,
  ) {}

  async execute(refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
    try {
      // Verify refresh token
      const payload = await this.tokenService.verifyRefreshToken(refreshTokenDto.refreshToken);

      // Find user by ID
      const userId = UserId.fromString(payload.userId);
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new UserNotFoundException('User not found');
      }

      // Check if user is still active
      if (!user.isActive) {
        throw new InvalidCredentialsException({ reason: 'Account is deactivated' });
      }

      // Generate new tokens
      const tokenPayload = {
        userId: user.id.value,
        email: user.email.value,
        roles: user.roles.map(role => role.value),
      };

      const newAccessToken = this.tokenService.generateAccessToken(tokenPayload);
      const newRefreshToken = this.tokenService.generateRefreshToken(tokenPayload);
      const expiresIn = this.tokenService.getAccessTokenExpirationTime();

      return new RefreshTokenResponseDto(
        newAccessToken,
        newRefreshToken,
        expiresIn
      );
    } catch (error) {
      // If token verification fails or any other error occurs
      throw new InvalidCredentialsException({ 
        reason: 'Invalid or expired refresh token',
        originalError: error 
      });
    }
  }
}
