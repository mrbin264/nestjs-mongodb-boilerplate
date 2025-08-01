import { UserId } from '../value-objects/user-id.vo';

export interface RefreshToken {
  id: string;
  userId: UserId;
  token: string;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

export interface IRefreshTokenRepository {
  /**
   * Save a refresh token
   */
  save(refreshToken: RefreshToken): Promise<RefreshToken>;

  /**
   * Find refresh token by token string
   */
  findByToken(token: string): Promise<RefreshToken | null>;

  /**
   * Find all refresh tokens for a user
   */
  findByUserId(userId: UserId): Promise<RefreshToken[]>;

  /**
   * Revoke a specific refresh token
   */
  revoke(token: string): Promise<void>;

  /**
   * Revoke all refresh tokens for a user
   */
  revokeAllByUserId(userId: UserId): Promise<void>;

  /**
   * Delete expired tokens (cleanup)
   */
  deleteExpired(): Promise<number>;

  /**
   * Delete a specific refresh token
   */
  delete(token: string): Promise<void>;

  /**
   * Find refresh tokens that expire soon (for rotation)
   */
  findExpiringSoon(minutesBeforeExpiry: number): Promise<RefreshToken[]>;

  /**
   * Count active refresh tokens for a user
   */
  countActiveByUserId(userId: UserId): Promise<number>;

  /**
   * Get user session info (active refresh tokens with metadata)
   */
  getUserSessions(userId: UserId): Promise<Array<{
    id: string;
    createdAt: Date;
    lastUsed: Date;
    userAgent?: string;
    ipAddress?: string;
    isCurrent: boolean;
  }>>;

  /**
   * Revoke specific session
   */
  revokeSession(userId: UserId, sessionId: string): Promise<void>;
}
