import { User } from '../../domain/entities/user.entity';

export interface TokenPayload {
  userId: string;
  email: string;
  roles: string[];
  emailVerified?: boolean;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface ITokenService {
  /**
   * Generate access token (JWT) for user
   */
  generateAccessToken(user: User): Promise<string>;

  /**
   * Generate refresh token for user
   */
  generateRefreshToken(user: User): Promise<string>;

  /**
   * Generate both access and refresh tokens
   */
  generateTokenPair(user: User): Promise<TokenPair>;

  /**
   * Validate and decode access token
   */
  validateAccessToken(token: string): Promise<TokenPayload>;

  /**
   * Validate refresh token
   */
  validateRefreshToken(token: string): Promise<TokenPayload>;

  /**
   * Blacklist token (for logout/security)
   */
  blacklistToken(token: string): Promise<void>;

  /**
   * Check if token is blacklisted
   */
  isTokenBlacklisted(token: string): Promise<boolean>;

  /**
   * Get token expiration time in seconds
   */
  getTokenExpirationTime(): number;

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader: string): string | null;
}
