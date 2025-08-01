import { Injectable, Inject } from '@nestjs/common';
import { UserId } from '../../../domain/value-objects/user-id.vo';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { ProfileResponseDto } from '../../dtos/profile/profile-response.dto';
import { UserNotFoundException } from '../../../domain/exceptions/user-not-found.exception';

// Import dependency injection tokens
import { USER_REPOSITORY } from '../../../infrastructure/infrastructure.module';

@Injectable()
export class GetProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string): Promise<ProfileResponseDto> {
    const userIdVO = UserId.fromString(userId);
    const user = await this.userRepository.findById(userIdVO);
    
    if (!user) {
      throw new UserNotFoundException('User not found');
    }

    return new ProfileResponseDto({
      id: user.id.value,
      email: user.email.value,
      profile: {
        ...(user.profile.firstName && { firstName: user.profile.firstName }),
        ...(user.profile.lastName && { lastName: user.profile.lastName }),
        ...(user.profile.avatar && { avatar: user.profile.avatar }),
        ...(user.profile.phone && { phone: user.profile.phone }),
      },
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }
}
