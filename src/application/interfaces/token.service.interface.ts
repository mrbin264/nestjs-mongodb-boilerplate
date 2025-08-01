export interface TokenPayload {
  userId: string;
  email: string;
  roles?: string[];
}

export interface EmailVerificationPayload {
  userId: string;
  email: string;
}

export interface PasswordResetPayload {
  userId: string;
  email: string;
}

export interface ITokenService {
  /**
   * Generate access token
   */
  generateAccessToken(payload: TokenPayload): string;

  /**
   * Generate refresh token
   */
  generateRefreshToken(payload: TokenPayload): string;

  /**
   * Generate email verification token
   */
  generateEmailVerificationToken(payload: EmailVerificationPayload): string;

  /**
   * Generate password reset token
   */
  generatePasswordResetToken(payload: PasswordResetPayload): string;

  /**
   * Verify and decode token (generic)
   */
  verifyToken(token: string): Promise<Record<string, unknown>>;

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): Promise<TokenPayload>;

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): Promise<TokenPayload>;

  /**
   * Verify email verification token
   */
  verifyEmailVerificationToken(token: string): Promise<EmailVerificationPayload>;

  /**
   * Verify password reset token
   */
  verifyPasswordResetToken(token: string): Promise<PasswordResetPayload>;

  /**
   * Get token expiration time in seconds
   */
  getAccessTokenExpirationTime(): number;

  /**
   * Get refresh token expiration time in seconds
   */
  getRefreshTokenExpirationTime(): number;
}
