export interface IHashService {
  /**
   * Hash a plain text string (e.g., password)
   */
  hash(plainText: string, rounds?: number): Promise<string>;

  /**
   * Compare plain text with hash
   */
  compare(plainText: string, hash: string): Promise<boolean>;

  /**
   * Generate random salt
   */
  generateSalt(rounds?: number): Promise<string>;

  /**
   * Generate random token (for password reset, verification, etc.)
   */
  generateRandomToken(length?: number): string;

  /**
   * Generate secure random string (cryptographically secure)
   */
  generateSecureRandomString(length?: number): string;

  /**
   * Hash data with salt (for API keys, etc.)
   */
  hashWithSalt(data: string, salt: string): Promise<string>;

  /**
   * Validate hash strength/format
   */
  validateHashFormat(hash: string): boolean;
}
