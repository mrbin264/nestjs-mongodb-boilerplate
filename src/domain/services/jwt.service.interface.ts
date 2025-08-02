import { UserId } from '../value-objects/user-id.vo';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  roles: string[];
  type: 'access' | 'refresh';
  iat?: number; // Issued at
  exp?: number; // Expires at
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Access token expiration in seconds
}

export interface IJwtService {
  /**
   * Generate both access and refresh tokens
   */
  generateTokenPair(userId: UserId, email: string, roles: string[]): TokenPair;

  /**
   * Generate only access token
   */
  generateAccessToken(userId: UserId, email: string, roles: string[]): string;

  /**
   * Generate only refresh token
   */
  generateRefreshToken(userId: UserId, email: string, roles: string[]): string;

  /**
   * Verify access token and return payload
   */
  verifyAccessToken(token: string): Promise<JwtPayload>;

  /**
   * Verify refresh token and return payload
   */
  verifyRefreshToken(token: string): Promise<JwtPayload>;

  /**
   * Decode token without verification (for getting payload info)
   */
  decodeToken(token: string): JwtPayload | null;

  /**
   * Get token expiration date
   */
  getTokenExpiration(token: string): Date | null;

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean;

  /**
   * Get remaining time until token expires (in seconds)
   */
  getRemainingTime(token: string): number;

  /**
   * Extract user ID from token
   */
  extractUserIdFromToken(token: string): UserId | null;
}
