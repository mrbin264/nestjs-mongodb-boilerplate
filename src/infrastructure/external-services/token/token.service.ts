import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { 
  ITokenService,
  TokenPayload,
  EmailVerificationPayload,
  PasswordResetPayload
} from '../../../application/interfaces/token.service.interface';

@Injectable()
export class TokenService implements ITokenService {
  constructor(
    private readonly nestJwtService: NestJwtService,
    private readonly configService: ConfigService,
  ) {}

  generateAccessToken(payload: TokenPayload): string {
    const secret = this.configService.get<string>('auth.jwtSecret');
    if (!secret) {
      throw new Error('JWT access token secret not configured');
    }

    return this.nestJwtService.sign(
      {
        sub: payload.userId,
        email: payload.email,
        roles: payload.roles || [],
        type: 'access',
      },
      {
        expiresIn: this.configService.get<string>('auth.jwtExpiresIn', '15m'),
        secret,
      }
    );
  }

  generateRefreshToken(payload: TokenPayload): string {
    const secret = this.configService.get<string>('auth.refreshSecret');
    if (!secret) {
      throw new Error('JWT refresh token secret not configured');
    }

    return this.nestJwtService.sign(
      {
        sub: payload.userId,
        email: payload.email,
        roles: payload.roles || [],
        type: 'refresh',
      },
      {
        expiresIn: this.configService.get<string>('auth.refreshExpiresIn', '7d'),
        secret,
      }
    );
  }

  generateEmailVerificationToken(payload: EmailVerificationPayload): string {
    const secret = this.configService.get<string>('auth.emailVerificationSecret') || 
                   this.configService.get<string>('auth.jwtSecret');
    
    if (!secret) {
      throw new Error('Email verification token secret not configured');
    }

    return this.nestJwtService.sign(
      {
        sub: payload.userId,
        email: payload.email,
        type: 'email_verification',
      },
      {
        expiresIn: this.configService.get<string>('auth.emailVerificationExpiresIn', '24h'),
        secret,
      }
    );
  }

  generatePasswordResetToken(payload: PasswordResetPayload): string {
    const secret = this.configService.get<string>('auth.passwordResetSecret') || 
                   this.configService.get<string>('auth.jwtSecret');
    
    if (!secret) {
      throw new Error('Password reset token secret not configured');
    }

    return this.nestJwtService.sign(
      {
        sub: payload.userId,
        email: payload.email,
        type: 'password_reset',
      },
      {
        expiresIn: this.configService.get<string>('auth.passwordResetExpiresIn', '1h'),
        secret,
      }
    );
  }

  async verifyToken(token: string): Promise<Record<string, unknown>> {
    try {
      const secret = this.configService.get<string>('auth.jwtSecret');
      if (!secret) {
        throw new Error('JWT secret not configured');
      }
      
      return this.nestJwtService.verify(token, { secret });
    } catch (error) {
      throw new Error(`Invalid token: ${(error as Error).message}`);
    }
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const secret = this.configService.get<string>('auth.jwtSecret');
      if (!secret) {
        throw new Error('JWT access token secret not configured');
      }
      
      const payload = this.nestJwtService.verify(token, { secret });
      
      return {
        userId: payload.sub,
        email: payload.email,
        roles: payload.roles || [],
      };
    } catch (error) {
      throw new Error(`Invalid access token: ${(error as Error).message}`);
    }
  }

  async verifyRefreshToken(token: string): Promise<TokenPayload> {
    try {
      const secret = this.configService.get<string>('auth.refreshSecret');
      if (!secret) {
        throw new Error('JWT refresh token secret not configured');
      }
      
      const payload = this.nestJwtService.verify(token, { secret });
      
      return {
        userId: payload.sub,
        email: payload.email,
        roles: payload.roles || [],
      };
    } catch (error) {
      throw new Error(`Invalid refresh token: ${(error as Error).message}`);
    }
  }

  async verifyEmailVerificationToken(token: string): Promise<EmailVerificationPayload> {
    try {
      const secret = this.configService.get<string>('auth.emailVerificationSecret') || 
                     this.configService.get<string>('auth.jwtSecret');
      
      if (!secret) {
        throw new Error('Email verification token secret not configured');
      }
      
      const payload = this.nestJwtService.verify(token, { secret });
      
      if (payload.type !== 'email_verification') {
        throw new Error('Invalid token type for email verification');
      }
      
      return {
        userId: payload.sub,
        email: payload.email,
      };
    } catch (error) {
      throw new Error(`Invalid email verification token: ${(error as Error).message}`);
    }
  }

  async verifyPasswordResetToken(token: string): Promise<PasswordResetPayload> {
    try {
      const secret = this.configService.get<string>('auth.passwordResetSecret') || 
                     this.configService.get<string>('auth.jwtSecret');
      
      if (!secret) {
        throw new Error('Password reset token secret not configured');
      }
      
      const payload = this.nestJwtService.verify(token, { secret });
      
      if (payload.type !== 'password_reset') {
        throw new Error('Invalid token type for password reset');
      }
      
      return {
        userId: payload.sub,
        email: payload.email,
      };
    } catch (error) {
      throw new Error(`Invalid password reset token: ${(error as Error).message}`);
    }
  }

  getAccessTokenExpirationTime(): number {
    const expiresIn = this.configService.get<string>('auth.jwtExpiresIn', '15m');
    return this.parseExpirationToSeconds(expiresIn);
  }

  getRefreshTokenExpirationTime(): number {
    const expiresIn = this.configService.get<string>('auth.refreshExpiresIn', '7d');
    return this.parseExpirationToSeconds(expiresIn);
  }

  private parseExpirationToSeconds(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhdw])$/);
    if (!match) {
      throw new Error(`Invalid expiration format: ${expiration}`);
    }

    const [, value, unit] = match;
    const numValue = parseInt(value, 10);

    switch (unit) {
      case 's':
        return numValue;
      case 'm':
        return numValue * 60;
      case 'h':
        return numValue * 60 * 60;
      case 'd':
        return numValue * 60 * 60 * 24;
      case 'w':
        return numValue * 60 * 60 * 24 * 7;
      default:
        throw new Error(`Unknown time unit: ${unit}`);
    }
  }
}
