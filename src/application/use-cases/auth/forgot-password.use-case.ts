import { Injectable, Inject } from '@nestjs/common';
import { Email } from '../../../domain/value-objects/email.vo';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { ITokenService } from '../../interfaces/token.service.interface';
import { IEmailService } from '../../interfaces/email.service.interface';
import { ForgotPasswordDto } from '../../dtos/auth/forgot-password.dto';
import { AuthMessageResponseDto } from '../../dtos/auth/auth-message-response.dto';

// Import dependency injection tokens
import { USER_REPOSITORY, JWT_SERVICE, EMAIL_SERVICE } from '../../../infrastructure/infrastructure.module';

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(JWT_SERVICE) private readonly tokenService: ITokenService,
    @Inject(EMAIL_SERVICE) private readonly emailService: IEmailService,
  ) {}

  async execute(forgotPasswordDto: ForgotPasswordDto): Promise<AuthMessageResponseDto> {
    // Create value objects
    const email = Email.create(forgotPasswordDto.email);

    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    
    // For security reasons, always return success message
    // even if user doesn't exist to prevent email enumeration
    if (!user) {
      return new AuthMessageResponseDto(
        'If an account with that email exists, a password reset link has been sent.'
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return new AuthMessageResponseDto(
        'If an account with that email exists, a password reset link has been sent.'
      );
    }

    // Generate password reset token
    const resetToken = this.tokenService.generatePasswordResetToken({
      userId: user.id.value,
      email: user.email.value,
    });

    // Send password reset email
    await this.emailService.sendPasswordReset(
      user.email.value,
      resetToken,
      user.profile.firstName || 'User'
    );

    return new AuthMessageResponseDto(
      'If an account with that email exists, a password reset link has been sent.'
    );
  }
}
