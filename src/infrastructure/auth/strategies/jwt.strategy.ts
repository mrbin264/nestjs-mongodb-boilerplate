import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Inject } from '@nestjs/common';

// Domain entities
import { User } from '@/domain/entities/user.entity';

// Domain value objects
import { UserId } from '@/domain/value-objects/user-id.vo';

// Repository interface
import { IUserRepository } from '@/domain/repositories/user.repository.interface';
import { USER_REPOSITORY } from '@/infrastructure/infrastructure.module';

// JWT Payload interface
interface JwtPayload {
  sub: string; // User ID
  email: string;
  roles: string[];
  emailVerified: boolean;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('auth.jwtSecret'),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const { sub: userId } = payload;

    // Create UserId value object from string
    const userIdVO = UserId.fromString(userId);

    // Get user from database
    const user = await this.userRepository.findById(userIdVO);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    return user;
  }
}
