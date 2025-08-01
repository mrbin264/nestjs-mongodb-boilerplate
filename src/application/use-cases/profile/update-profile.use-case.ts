import { Injectable, Inject } from '@nestjs/common';
import { UserId } from '../../../domain/value-objects/user-id.vo';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UpdateProfileDto } from '../../dtos/profile/update-profile.dto';
import { ProfileResponseDto } from '../../dtos/profile/profile-response.dto';
import { UserNotFoundException } from '../../../domain/exceptions/user-not-found.exception';

// Import dependency injection tokens
import { USER_REPOSITORY } from '../../../infrastructure/infrastructure.module';

@Injectable()
export class UpdateProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string, updateProfileDto: UpdateProfileDto): Promise<ProfileResponseDto> {
    // Find user by ID
    const userIdVO = UserId.fromString(userId);
    const user = await this.userRepository.findById(userIdVO);
    
    if (!user) {
      throw new UserNotFoundException('User not found');
    }

    // Update user profile
    const updatedProfile = {
      ...user.profile,
      ...(updateProfileDto.firstName !== undefined && { firstName: updateProfileDto.firstName }),
      ...(updateProfileDto.lastName !== undefined && { lastName: updateProfileDto.lastName }),
      ...(updateProfileDto.phone !== undefined && { phone: updateProfileDto.phone }),
      ...(updateProfileDto.avatar !== undefined && { avatar: updateProfileDto.avatar }),
    };

    user.updateProfile(updatedProfile);

    // Save updated user
    const savedUser = await this.userRepository.save(user);

    return new ProfileResponseDto({
      id: savedUser.id.value,
      email: savedUser.email.value,
      profile: {
        ...(savedUser.profile.firstName && { firstName: savedUser.profile.firstName }),
        ...(savedUser.profile.lastName && { lastName: savedUser.profile.lastName }),
        ...(savedUser.profile.avatar && { avatar: savedUser.profile.avatar }),
        ...(savedUser.profile.phone && { phone: savedUser.profile.phone }),
      },
      emailVerified: savedUser.emailVerified,
      createdAt: savedUser.createdAt,
      updatedAt: savedUser.updatedAt,
    });
  }
}
