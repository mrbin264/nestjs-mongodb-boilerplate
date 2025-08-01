import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository, UserQueryOptions } from '../../../domain/repositories/user.repository.interface';
import { UserQueryDto } from '../../dtos/user/user-query.dto';
import { UserResponseDto } from '../../dtos/user/user-response.dto';
import { ResponseDto } from '../../dtos/common/response.dto';

// Import dependency injection tokens
import { USER_REPOSITORY } from '../../../infrastructure/infrastructure.module';

@Injectable()
export class GetUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async execute(queryDto: UserQueryDto): Promise<ResponseDto<{
    users: UserResponseDto[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }>> {
    const queryOptions: UserQueryOptions = {
      ...(queryDto.limit && { limit: queryDto.limit }),
      ...(queryDto.offset !== undefined && { offset: queryDto.offset }),
      ...(queryDto.sortBy && { sortBy: queryDto.sortBy as 'email' | 'createdAt' | 'updatedAt' | 'lastLoginAt' }),
      ...(queryDto.sortOrder && { sortOrder: queryDto.sortOrder as 'asc' | 'desc' }),
      ...(queryDto.search && { search: queryDto.search }),
      ...(queryDto.emailVerified !== undefined && { emailVerified: queryDto.emailVerified }),
    };

    const result = await this.userRepository.findMany(queryOptions);

    const users = result.users.map(user => new UserResponseDto({
      id: user.id.value,
      email: user.email.value,
      roles: user.roles.map(role => ({
        id: role.value,
        name: role.value,
        permissions: [],
      })),
      profile: {
        ...(user.profile.firstName && { firstName: user.profile.firstName }),
        ...(user.profile.lastName && { lastName: user.profile.lastName }),
        ...(user.profile.avatar && { avatar: user.profile.avatar }),
        ...(user.profile.phone && { phone: user.profile.phone }),
      },
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return ResponseDto.success({
      users,
      pagination: {
        total: result.total,
        limit: queryOptions.limit || 10,
        offset: queryOptions.offset || 0,
        hasMore: result.hasMore,
      }
    }, 'Users retrieved successfully');
  }
}
