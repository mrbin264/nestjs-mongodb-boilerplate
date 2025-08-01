import { Injectable, Inject } from '@nestjs/common';
import { User } from '../../../domain/entities/user.entity';
import { Email } from '../../../domain/value-objects/email.vo';
import { Password } from '../../../domain/value-objects/password.vo';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { UserDomainService } from '../../../domain/services/user-domain.service';
import { PasswordDomainService } from '../../../domain/services/password-domain.service';
import { IHashService } from '../../interfaces/hash.service.interface';
import { ITokenService } from '../../interfaces/token.service.interface';
import { IEmailService } from '../../interfaces/email.service.interface';
import { RegisterUserDto } from '../../dtos/auth/register-user.dto';
import { RegisterResponseDto } from '../../dtos/auth/register-response.dto';
import { DuplicateEmailException } from '../../../domain/exceptions/duplicate-email.exception';
import { InvalidPasswordException } from '../../../domain/exceptions/invalid-password.exception';

// Import dependency injection tokens
import { 
  USER_REPOSITORY,
  HASH_SERVICE,
  JWT_SERVICE,
  EMAIL_SERVICE
} from '../../../infrastructure/infrastructure.module';

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    private readonly userDomainService: UserDomainService,
    private readonly passwordDomainService: PasswordDomainService,
    @Inject(HASH_SERVICE) private readonly hashService: IHashService,
    @Inject(JWT_SERVICE) private readonly tokenService: ITokenService,
    @Inject(EMAIL_SERVICE) private readonly emailService: IEmailService,
  ) {}

  async execute(registerDto: RegisterUserDto): Promise<RegisterResponseDto> {
    // Create value objects
    const email = Email.create(registerDto.email);
    
    // Check if email is already taken
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new DuplicateEmailException(email.value);
    }

    // Validate password using domain service
    try {
      this.passwordDomainService.enforcePolicy(registerDto.password);
    } catch (error) {
      throw new InvalidPasswordException(
        'Password does not meet security requirements',
        { originalError: error }
      );
    }

    // Hash password
    const hashedPassword = await this.hashService.hash(registerDto.password);

    // Create user entity with minimal required data
    const user = User.create({
      email,
      password: Password.fromHash(hashedPassword),
      roles: [], // Will be set after user creation or defaults to empty
      profile: {
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        ...(registerDto.phone && { phone: registerDto.phone }),
      },
    });

    // Save user
    const savedUser = await this.userRepository.save(user);

    // Generate email verification token
    const verificationToken = this.tokenService.generateEmailVerificationToken({
      userId: savedUser.id.value,
      email: savedUser.email.value,
    });

    // Send verification email
    await this.emailService.sendEmailVerification(
      savedUser.email.value,
      verificationToken,
      savedUser.profile.firstName || 'User'
    );

    return new RegisterResponseDto(
      savedUser.id.value,
      savedUser.email.value,
      'User registered successfully. Please check your email for verification.',
      true
    );
  }
}
