import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IJwtService, JwtPayload, TokenPair } from '../../../domain/services/jwt.service.interface';
import { UserId } from '../../../domain/value-objects/user-id.vo';

@Injectable()
export class JwtService implements IJwtService {
  constructor(
    private readonly nestJwtService: NestJwtService,
    private readonly configService: ConfigService,
  ) {}

  generateTokenPair(userId: UserId, email: string, roles: string[]): TokenPair {
    const payload: JwtPayload = {
      sub: userId.value,
      email,
      roles,
      type: 'access',
    };

    const accessTokenSecret = this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET');
    const refreshTokenSecret = this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET');
    
    if (!accessTokenSecret || !refreshTokenSecret) {
      throw new Error('JWT secrets not configured');
    }

    const accessToken = this.nestJwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRATION', '15m'),
      secret: accessTokenSecret,
    });

    const refreshTokenPayload: JwtPayload = {
      sub: userId.value,
      email,
      roles,
      type: 'refresh',
    };

    const refreshToken = this.nestJwtService.sign(refreshTokenPayload, {
      expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRATION', '7d'),
      secret: refreshTokenSecret,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpirationToSeconds(
        this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRATION', '15m')
      ),
    };
  }

  generateAccessToken(userId: UserId, email: string, roles: string[]): string {
    const payload: JwtPayload = {
      sub: userId.value,
      email,
      roles,
      type: 'access',
    };

    const secret = this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET');
    if (!secret) {
      throw new Error('JWT access token secret not configured');
    }

    return this.nestJwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRATION', '15m'),
      secret,
    });
  }

  generateRefreshToken(userId: UserId, email: string, roles: string[]): string {
    const payload: JwtPayload = {
      sub: userId.value,
      email,
      roles,
      type: 'refresh',
    };

    const secret = this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET');
    if (!secret) {
      throw new Error('JWT refresh token secret not configured');
    }

    return this.nestJwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRATION', '7d'),
      secret,
    });
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      const secret = this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET');
      if (!secret) {
        throw new Error('JWT access token secret not configured');
      }
      
      return this.nestJwtService.verify(token, { secret });
    } catch (error) {
      throw new Error(`Invalid access token: ${(error as Error).message}`);
    }
  }

  verifyRefreshToken(token: string): JwtPayload {
    try {
      const secret = this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET');
      if (!secret) {
        throw new Error('JWT refresh token secret not configured');
      }
      
      return this.nestJwtService.verify(token, { secret });
    } catch (error) {
      throw new Error(`Invalid refresh token: ${(error as Error).message}`);
    }
  }

  decodeToken(token: string): JwtPayload | null {
    try {
      return this.nestJwtService.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }

  getTokenExpiration(token: string): Date | null {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return null;
    }
    return new Date(decoded.exp * 1000);
  }

  isTokenExpired(token: string): boolean {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) {
      return true;
    }
    return expiration.getTime() < Date.now();
  }

  getRemainingTime(token: string): number {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) {
      return 0;
    }
    const remaining = expiration.getTime() - Date.now();
    return Math.max(0, Math.floor(remaining / 1000));
  }

  extractUserIdFromToken(token: string): UserId | null {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.sub) {
      return null;
    }
    return UserId.fromString(decoded.sub);
  }

  private parseExpirationToSeconds(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 900; // Default 15 minutes
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 900;
    }
  }
}
