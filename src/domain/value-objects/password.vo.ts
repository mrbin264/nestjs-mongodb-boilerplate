export class Password {
  private readonly _hashedValue: string;

  private constructor(hashedValue: string) {
    if (!hashedValue || hashedValue.trim().length === 0) {
      throw new Error('Password hash cannot be empty');
    }
    this._hashedValue = hashedValue;
  }

  static fromHash(hashedValue: string): Password {
    return new Password(hashedValue);
  }

  static async fromPlainText(plainText: string): Promise<Password> {
    if (!this.validateStrength(plainText)) {
      throw new Error('Password does not meet strength requirements');
    }
    
    const bcrypt = await import('bcryptjs');
    const hashedValue = await bcrypt.hash(plainText, 12);
    return new Password(hashedValue);
  }

  get hashedValue(): string {
    return this._hashedValue;
  }

  async compare(plainText: string): Promise<boolean> {
    const bcrypt = await import('bcryptjs');
    return bcrypt.compare(plainText, this._hashedValue);
  }

  static validateStrength(password: string): boolean {
    // Password strength requirements:
    // - At least 8 characters long
    // - Contains at least one uppercase letter
    // - Contains at least one lowercase letter  
    // - Contains at least one number
    // - Contains at least one special character

    if (password.length < 8) {
      return false;
    }

    if (password.length > 128) {
      return false;
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
  }

  static getStrengthRequirements(): string[] {
    return [
      'At least 8 characters long',
      'At most 128 characters long',
      'Contains at least one uppercase letter',
      'Contains at least one lowercase letter',
      'Contains at least one number',
      'Contains at least one special character (!@#$%^&*(),.?":{}|<>)',
    ];
  }

  equals(other: Password): boolean {
    return this._hashedValue === other._hashedValue;
  }

  // Never expose the actual hash in JSON
  toJSON(): Record<string, never> {
    return {};
  }
}
