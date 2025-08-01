export interface IHashService {
  /**
   * Hash a plain text string
   */
  hash(plainText: string): Promise<string>;

  /**
   * Compare plain text with hashed text
   */
  compare(plainText: string, hashedText: string): Promise<boolean>;

  /**
   * Generate a salt
   */
  generateSalt(): Promise<string>;

  /**
   * Hash plain text with a specific salt
   */
  hashWithSalt(plainText: string, salt: string): Promise<string>;

  /**
   * Check if a string is already hashed
   */
  isHashed(text: string): boolean;

  /**
   * Get information about a hash (algorithm, rounds, etc.)
   */
  getHashInfo(hashedText: string): { algorithm: string; rounds: number } | null;
}
