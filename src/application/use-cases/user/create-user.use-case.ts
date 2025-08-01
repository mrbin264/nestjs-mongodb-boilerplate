import { Injectable, Inject } from '@nestjs/common';
import { User } from '../../../domain/entities/user.entity';
import { Email } from '../../../domain/value-objects/email.vo';
import { Password } from '../../../domain/value-objects/password.vo';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserDomainService } from '../../../domain/services/user-domain.service';
import { PasswordDomainService } from '../../../domain/services/password-domain.service';
import { IHashService } from '../../interfaces/hash.service.interface';
import { CreateUserDto } from '../../dtos/user/create-user.dto';
import { UserResponseDto } from '../../dtos/user/user-response.dto';
import { DuplicateEmailException } from '../../../domain/exceptions/duplicate-email.exception';
import { InvalidPasswordException } from '../../../domain/exceptions/invalid-password.exception';

// Import dependency injection tokens
import { USER_REPOSITORY, HASH_SERVICE } from '../../../infrastructure/infrastructure.module';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    private readonly userDomainService: UserDomainService,
    private readonly passwordDomainService: PasswordDomainService,
    @Inject(HASH_SERVICE) private readonly hashService: IHashService,
  ) {}

  async execute(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Create value objects
    const email = Email.create(createUserDto.email);

    // Check if email is already taken
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new DuplicateEmailException(email.value);
    }

    // Validate password using domain service
    try {
      this.passwordDomainService.enforcePolicy(createUserDto.password);
    } catch (error) {
      throw new InvalidPasswordException(
        'Password does not meet security requirements',
        { originalError: error }
      );
    }

    // Hash password
    const hashedPassword = await this.hashService.hash(createUserDto.password);

    // Create user entity
    const user = User.create({
      email,
      password: Password.fromHash(hashedPassword),
      roles: [], // Roles will be assigned separately if provided
      profile: {
        ...(createUserDto.firstName && { firstName: createUserDto.firstName }),
        ...(createUserDto.lastName && { lastName: createUserDto.lastName }),
        ...(createUserDto.phone && { phone: createUserDto.phone }),
        ...(createUserDto.avatar && { avatar: createUserDto.avatar }),
      },
    });

    // Save user
    const savedUser = await this.userRepository.save(user);

    return new UserResponseDto({
      id: savedUser.id.value,
      email: savedUser.email.value,
      roles: savedUser.roles.map(role => ({
        id: role.value, // Using value as ID for now
        name: role.value,
        permissions: [], // Will be populated when role management is implemented
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
