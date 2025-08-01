import { Injectable, Inject } from '@nestjs/common';
import { Password } from '../../../domain/value-objects/password.vo';
import { UserId } from '../../../domain/value-objects/user-id.vo';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { ITokenService } from '../../interfaces/token.service.interface';
import { IHashService } from '../../interfaces/hash.service.interface';
import { IEmailService } from '../../interfaces/email.service.interface';
import { PasswordDomainService } from '../../../domain/services/password-domain.service';
import { ResetPasswordDto } from '../../dtos/auth/reset-password.dto';
import { AuthMessageResponseDto } from '../../dtos/auth/auth-message-response.dto';
import { InvalidCredentialsException } from '../../../domain/exceptions/invalid-credentials.exception';
import { UserNotFoundException } from '../../../domain/exceptions/user-not-found.exception';
import { InvalidPasswordException } from '../../../domain/exceptions/invalid-password.exception';

// Import dependency injection tokens
import { USER_REPOSITORY, JWT_SERVICE, HASH_SERVICE, EMAIL_SERVICE } from '../../../infrastructure/infrastructure.module';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(JWT_SERVICE) private readonly tokenService: ITokenService,
    @Inject(HASH_SERVICE) private readonly hashService: IHashService,
    @Inject(EMAIL_SERVICE) private readonly emailService: IEmailService,
    private readonly passwordDomainService: PasswordDomainService,
  ) {}

  async execute(resetPasswordDto: ResetPasswordDto): Promise<AuthMessageResponseDto> {
    try {
      // Verify reset token
      const payload = await this.tokenService.verifyPasswordResetToken(resetPasswordDto.token);

      // Find user by ID
      const userId = UserId.fromString(payload.userId);
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        throw new UserNotFoundException('User not found');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new InvalidCredentialsException({ reason: 'Account is deactivated' });
      }

      // Validate new password using domain service
      try {
        this.passwordDomainService.enforcePolicy(resetPasswordDto.newPassword);
      } catch (error) {
        throw new InvalidPasswordException(
          'Password does not meet security requirements',
          { originalError: error }
        );
      }

      // Hash new password
      const hashedPassword = await this.hashService.hash(resetPasswordDto.newPassword);

      // Update user password
      user.updatePassword(Password.fromHash(hashedPassword));
      await this.userRepository.save(user);

      // Send confirmation email
      await this.emailService.sendPasswordChangedNotification(
        user.email.value,
        user.profile.firstName || 'User'
      );

      return new AuthMessageResponseDto('Password has been reset successfully.');
    } catch (error) {
      // If token verification fails or any other error occurs
      if (error instanceof InvalidPasswordException) {
        throw error;
      }
      
      throw new InvalidCredentialsException({ 
        reason: 'Invalid or expired reset token',
        originalError: error 
      });
    }
  }
}
