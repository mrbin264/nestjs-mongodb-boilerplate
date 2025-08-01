import { Injectable } from '@nestjs/common';
import { InvalidPasswordException } from '../exceptions/invalid-password.exception';

export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  forbiddenPasswords: string[];
  historySize: number; // For future password history feature
}

@Injectable()
export class PasswordDomainService {
  private readonly defaultPolicy: PasswordPolicy = {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    forbiddenPasswords: [
      'password',
      '123456',
      '123456789',
      'qwerty',
      'abc123',
      'password123',
      'admin',
      'letmein',
      'welcome',
      'monkey',
    ],
    historySize: 5,
  };

  private readonly policy: PasswordPolicy;

  constructor() {
    this.policy = this.defaultPolicy;
  }

  /**
   * Enforces password policy rules
   */
  enforcePolicy(plainPassword: string, policy?: Partial<PasswordPolicy>): boolean {
    const activePolicy = { ...this.policy, ...policy };

    // Length validation
    if (plainPassword.length < activePolicy.minLength) {
      throw new InvalidPasswordException(
        `Password must be at least ${activePolicy.minLength} characters long`,
        { minLength: activePolicy.minLength }
      );
    }

    if (plainPassword.length > activePolicy.maxLength) {
      throw new InvalidPasswordException(
        `Password must not exceed ${activePolicy.maxLength} characters`,
        { maxLength: activePolicy.maxLength }
      );
    }

    // Character requirements
    if (activePolicy.requireUppercase && !/[A-Z]/.test(plainPassword)) {
      throw new InvalidPasswordException(
        'Password must contain at least one uppercase letter',
        { requirement: 'uppercase' }
      );
    }

    if (activePolicy.requireLowercase && !/[a-z]/.test(plainPassword)) {
      throw new InvalidPasswordException(
        'Password must contain at least one lowercase letter',
        { requirement: 'lowercase' }
      );
    }

    if (activePolicy.requireNumbers && !/\d/.test(plainPassword)) {
      throw new InvalidPasswordException(
        'Password must contain at least one number',
        { requirement: 'number' }
      );
    }

    if (activePolicy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(plainPassword)) {
      throw new InvalidPasswordException(
        'Password must contain at least one special character',
        { requirement: 'special_character' }
      );
    }

    // Forbidden passwords
    const lowerPassword = plainPassword.toLowerCase();
    if (activePolicy.forbiddenPasswords.some(forbidden => lowerPassword.includes(forbidden.toLowerCase()))) {
      throw new InvalidPasswordException(
        'Password contains forbidden patterns',
        { requirement: 'forbidden_pattern' }
      );
    }

    // Common patterns
    if (this.hasCommonPatterns(plainPassword)) {
      throw new InvalidPasswordException(
        'Password contains common patterns',
        { requirement: 'no_common_patterns' }
      );
    }

    return true;
  }

  /**
   * Generates a temporary password that meets policy requirements
   */
  generateTemporary(length: number = 12): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*()';

    let password = '';
    
    // Ensure at least one character from each required category
    if (this.policy.requireUppercase) {
      password += this.getRandomChar(uppercase);
    }
    if (this.policy.requireLowercase) {
      password += this.getRandomChar(lowercase);
    }
    if (this.policy.requireNumbers) {
      password += this.getRandomChar(numbers);
    }
    if (this.policy.requireSpecialChars) {
      password += this.getRandomChar(specialChars);
    }

    // Fill the rest with random characters from all categories
    const allChars = uppercase + lowercase + numbers + specialChars;
    while (password.length < length) {
      password += this.getRandomChar(allChars);
    }

    // Shuffle the password to avoid predictable patterns
    return this.shuffleString(password);
  }

  /**
   * Validates password strength and returns a score (0-100)
   */
  calculateStrength(password: string): number {
    let score = 0;

    // Length scoring
    if (password.length >= 8) score += 10;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;

    // Character variety scoring
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 10;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 15;

    // Pattern analysis
    if (!this.hasRepeatingChars(password)) score += 10;
    if (!this.hasSequentialChars(password)) score += 10;
    if (!this.hasCommonPatterns(password)) score += 15;

    return Math.min(score, 100);
  }

  /**
   * Checks if password history should prevent reuse (future enhancement)
   */
  canReusePassword(newPasswordHash: string, passwordHistory: string[]): boolean {
    if (passwordHistory.length === 0) return true;
    
    const recentPasswords = passwordHistory.slice(-this.policy.historySize);
    return !recentPasswords.includes(newPasswordHash);
  }

  /**
   * Gets password policy requirements as human-readable strings
   */
  getPolicyRequirements(): string[] {
    const requirements: string[] = [];

    requirements.push(`At least ${this.policy.minLength} characters long`);
    requirements.push(`At most ${this.policy.maxLength} characters long`);

    if (this.policy.requireUppercase) {
      requirements.push('Contains at least one uppercase letter');
    }
    if (this.policy.requireLowercase) {
      requirements.push('Contains at least one lowercase letter');
    }
    if (this.policy.requireNumbers) {
      requirements.push('Contains at least one number');
    }
    if (this.policy.requireSpecialChars) {
      requirements.push('Contains at least one special character (!@#$%^&*(),.?":{}|<>)');
    }

    requirements.push('Does not contain common patterns or forbidden words');

    return requirements;
  }

  private hasCommonPatterns(password: string): boolean {
    // Check for common patterns like 123, abc, qwerty
    const patterns = [
      /123/,
      /abc/i,
      /qwerty/i,
      /asdf/i,
      /password/i,
      /admin/i,
      /user/i,
    ];

    return patterns.some(pattern => pattern.test(password));
  }

  private hasRepeatingChars(password: string): boolean {
    return /(.)\1{2,}/.test(password);
  }

  private hasSequentialChars(password: string): boolean {
    for (let i = 0; i < password.length - 2; i++) {
      const char1 = password.charCodeAt(i);
      const char2 = password.charCodeAt(i + 1);
      const char3 = password.charCodeAt(i + 2);

      if (char2 === char1 + 1 && char3 === char2 + 1) {
        return true;
      }
    }
    return false;
  }

  private getRandomChar(chars: string): string {
    return chars.charAt(Math.floor(Math.random() * chars.length));
  }

  private shuffleString(str: string): string {
    const arr = str.split('');
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
  }
}
