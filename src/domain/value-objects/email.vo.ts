export class Email {
  private readonly _value: string;

  private constructor(value: string) {
    const normalizedEmail = this.normalize(value);
    if (!this.isValid(normalizedEmail)) {
      throw new Error(`Invalid email format: ${value}`);
    }
    this._value = normalizedEmail;
  }

  static create(value: string): Email {
    return new Email(value);
  }

  get value(): string {
    return this._value;
  }

  get localPart(): string {
    return this._value.split('@')[0];
  }

  get domain(): string {
    return this._value.split('@')[1];
  }

  toString(): string {
    return this._value;
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }

  private normalize(email: string): string {
    return email.trim().toLowerCase();
  }

  private isValid(email: string): boolean {
    // RFC 5322 compliant email regex (simplified version)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(email)) {
      return false;
    }

    // Additional business rules
    if (email.length > 254) {
      return false;
    }

    const [localPart, domain] = email.split('@');
    if (localPart.length > 64) {
      return false;
    }

    // Domain validation
    if (domain.length > 253) {
      return false;
    }

    // Check for consecutive dots
    if (email.includes('..')) {
      return false;
    }

    // Check for valid domain format
    if (domain.split('.').some(part => part.length === 0)) {
      return false;
    }

    return true;
  }

  toJSON(): string {
    return this._value;
  }
}
