import { Injectable, Inject } from '@nestjs/common';
import { Password } from '../../../domain/value-objects/password.vo';
import { UserId } from '../../../domain/value-objects/user-id.vo';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { IHashService } from '../../interfaces/hash.service.interface';
import { IEmailService } from '../../interfaces/email.service.interface';
import { PasswordDomainService } from '../../../domain/services/password-domain.service';
import { ChangePasswordDto } from '../../dtos/profile/change-password.dto';
import { AuthMessageResponseDto } from '../../dtos/auth/auth-message-response.dto';
import { UserNotFoundException } from '../../../domain/exceptions/user-not-found.exception';
import { InvalidCredentialsException } from '../../../domain/exceptions/invalid-credentials.exception';
import { InvalidPasswordException } from '../../../domain/exceptions/invalid-password.exception';

// Import dependency injection tokens
import { USER_REPOSITORY, HASH_SERVICE, EMAIL_SERVICE } from '../../../infrastructure/infrastructure.module';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(HASH_SERVICE) private readonly hashService: IHashService,
    @Inject(EMAIL_SERVICE) private readonly emailService: IEmailService,
    private readonly passwordDomainService: PasswordDomainService,
  ) {}

  async execute(userId: string, changePasswordDto: ChangePasswordDto): Promise<AuthMessageResponseDto> {
    // Find user by ID
    const userIdVO = UserId.fromString(userId);
    const user = await this.userRepository.findById(userIdVO);
    
    if (!user) {
      throw new UserNotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await this.hashService.compare(
      changePasswordDto.currentPassword,
      user.password.hashedValue
    );

    if (!isCurrentPasswordValid) {
      throw new InvalidCredentialsException({ reason: 'Current password is incorrect' });
    }

    // Validate new password using domain service
    try {
      this.passwordDomainService.enforcePolicy(changePasswordDto.newPassword);
    } catch (error) {
      throw new InvalidPasswordException(
        'New password does not meet security requirements',
        { originalError: error }
      );
    }

    // Hash new password
    const hashedNewPassword = await this.hashService.hash(changePasswordDto.newPassword);

    // Update user password
    user.updatePassword(Password.fromHash(hashedNewPassword));
    await this.userRepository.save(user);

    // Send confirmation email
    await this.emailService.sendPasswordChangedNotification(
      user.email.value,
      user.profile.firstName || 'User'
    );

    return new AuthMessageResponseDto('Password changed successfully.');
  }
}
