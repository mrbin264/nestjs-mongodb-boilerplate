import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { Inject } from '@nestjs/common';

// Domain entities
import { User } from '@/domain/entities/user.entity';

// Domain value objects
import { Email } from '@/domain/value-objects/email.vo';

// Repository interface
import { IUserRepository } from '@/domain/repositories/user.repository.interface';
import { USER_REPOSITORY } from '@/infrastructure/infrastructure.module';

// Hash service interface
import { IHashService } from '@/application/services/hash.service.interface';
import { HASH_SERVICE } from '@/infrastructure/infrastructure.module';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(HASH_SERVICE)
    private readonly hashService: IHashService,
  ) {
    super({
      usernameField: 'email', // Use email as username field
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<User> {
    try {
      // Create Email value object
      const emailVO = Email.create(email);

      // Find user by email
      const user = await this.userRepository.findByEmail(emailVO);

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('User account is disabled');
      }

      // Verify password
      const isPasswordValid = await this.hashService.compare(password, user.password.hashedValue);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Return user entity for request context
      return user;
    } catch (error) {
      // Log error and throw generic unauthorized exception for security
      // TODO: Use proper logging service instead of console
      // eslint-disable-next-line no-console
      console.error('Local strategy validation error:', error);
      throw new UnauthorizedException('Invalid credentials');
    }
  }
}
