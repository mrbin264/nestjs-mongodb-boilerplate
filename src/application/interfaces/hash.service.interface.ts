export interface IHashService {
  /**
   * Hash a plain text password
   */
  hash(plainText: string): Promise<string>;

  /**
   * Compare a plain text password with a hash
   */
  compare(plainText: string, hash: string): Promise<boolean>;

  /**
   * Generate a secure random salt
   */
  generateSalt(rounds?: number): Promise<string>;
}
