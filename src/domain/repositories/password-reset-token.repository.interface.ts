import { UserId } from '../value-objects/user-id.vo';

export interface PasswordResetToken {
  id: string;
  userId: UserId;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
  usedAt?: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface IPasswordResetTokenRepository {
  /**
   * Save a password reset token
   */
  save(resetToken: PasswordResetToken): Promise<PasswordResetToken>;

  /**
   * Find password reset token by token string
   */
  findByToken(token: string): Promise<PasswordResetToken | null>;

  /**
   * Find active (unused and not expired) token by user ID
   */
  findActiveByUserId(userId: UserId): Promise<PasswordResetToken | null>;

  /**
   * Mark token as used
   */
  markAsUsed(token: string, ipAddress?: string, userAgent?: string): Promise<void>;

  /**
   * Invalidate all tokens for a user (when password is changed)
   */
  invalidateAllByUserId(userId: UserId): Promise<void>;

  /**
   * Delete expired tokens (cleanup)
   */
  deleteExpired(): Promise<number>;

  /**
   * Find all tokens for a user (for security audit)
   */
  findByUserId(userId: UserId): Promise<PasswordResetToken[]>;

  /**
   * Check if user has requested too many reset tokens recently
   */
  countRecentByUserId(userId: UserId, minutesAgo: number): Promise<number>;

  /**
   * Delete specific token
   */
  delete(token: string): Promise<void>;

  /**
   * Find tokens created from specific IP (for rate limiting)
   */
  countRecentByIpAddress(ipAddress: string, minutesAgo: number): Promise<number>;
}
