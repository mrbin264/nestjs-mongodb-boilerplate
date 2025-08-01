import { Injectable, Inject } from '@nestjs/common';
import { UserId } from '../../../domain/value-objects/user-id.vo';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UpdateUserDto } from '../../dtos/user/update-user.dto';
import { UserResponseDto } from '../../dtos/user/user-response.dto';
import { UserNotFoundException } from '../../../domain/exceptions/user-not-found.exception';

// Import dependency injection tokens
import { USER_REPOSITORY } from '../../../infrastructure/infrastructure.module';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    // Find user by ID
    const userIdVO = UserId.fromString(userId);
    const user = await this.userRepository.findById(userIdVO);
    
    if (!user) {
      throw new UserNotFoundException('User not found');
    }

    // Update user profile
    const updatedProfile = {
      ...user.profile,
      ...(updateUserDto.firstName !== undefined && { firstName: updateUserDto.firstName }),
      ...(updateUserDto.lastName !== undefined && { lastName: updateUserDto.lastName }),
      ...(updateUserDto.phone !== undefined && { phone: updateUserDto.phone }),
      ...(updateUserDto.avatar !== undefined && { avatar: updateUserDto.avatar }),
    };

    user.updateProfile(updatedProfile);

    // Save updated user
    const savedUser = await this.userRepository.save(user);

    return new UserResponseDto({
      id: savedUser.id.value,
      email: savedUser.email.value,
      roles: savedUser.roles.map(role => ({
        id: role.value,
        name: role.value,
        permissions: [],
      })),
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
