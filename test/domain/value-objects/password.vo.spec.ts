import { Password } from '../../../src/domain/value-objects/password.vo';

describe('Password Value Object', () => {
  describe('Password Creation', () => {
    it('should create password from hash', () => {
      const hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PdHue.';
      const password = Password.fromHash(hash);
      
      expect(password.hashedValue).toBe(hash);
    });

    it('should create password from plain text', async () => {
      const plainText = 'ValidPass123!';
      const password = await Password.fromPlainText(plainText);
      
      expect(password.hashedValue).toBeDefined();
      expect(password.hashedValue).not.toBe(plainText);
      expect(password.hashedValue.startsWith('$2b$')).toBe(true);
    });

    it('should reject empty hash', () => {
      expect(() => Password.fromHash('')).toThrow('Password hash cannot be empty');
      expect(() => Password.fromHash('   ')).toThrow('Password hash cannot be empty');
    });

    it('should reject weak passwords', async () => {
      const weakPasswords = [
        'short',
        'nouppercase123!',
        'NOLOWERCASE123!',
        'NoNumbers!',
        'NoSpecialChars123',
        'a'.repeat(129), // too long
      ];

      for (const weakPassword of weakPasswords) {
        await expect(Password.fromPlainText(weakPassword))
          .rejects.toThrow('Password does not meet strength requirements');
      }
    });
  });

  describe('Password Strength Validation', () => {
    it('should validate strong passwords', () => {
      const strongPasswords = [
        'ValidPass123!',
        'AnotherGood1@',
        'StrongP@ssw0rd',
        'MySecure123#',
      ];

      strongPasswords.forEach(password => {
        expect(Password.validateStrength(password)).toBe(true);
      });
    });

    it('should reject passwords that are too short', () => {
      expect(Password.validateStrength('Sh0rt!')).toBe(false);
    });

    it('should reject passwords that are too long', () => {
      const longPassword = 'a'.repeat(129) + 'A1!';
      expect(Password.validateStrength(longPassword)).toBe(false);
    });

    it('should reject passwords without uppercase letters', () => {
      expect(Password.validateStrength('nouppercase123!')).toBe(false);
    });

    it('should reject passwords without lowercase letters', () => {
      expect(Password.validateStrength('NOLOWERCASE123!')).toBe(false);
    });

    it('should reject passwords without numbers', () => {
      expect(Password.validateStrength('NoNumbers!')).toBe(false);
    });

    it('should reject passwords without special characters', () => {
      expect(Password.validateStrength('NoSpecialChars123')).toBe(false);
    });
  });

  describe('Password Comparison', () => {
    it('should compare password with plain text correctly', async () => {
      const plainText = 'ValidPass123!';
      const password = await Password.fromPlainText(plainText);
      
      expect(await password.compare(plainText)).toBe(true);
      expect(await password.compare('WrongPassword123!')).toBe(false);
    });

    it('should compare different password objects', async () => {
      const password1 = await Password.fromPlainText('ValidPass123!');
      const password2 = await Password.fromPlainText('ValidPass123!');
      const password3 = await Password.fromPlainText('DifferentPass123!');
      
      // Different objects with same plain text should not be equal (different salts)
      expect(password1.equals(password2)).toBe(false);
      expect(password1.equals(password3)).toBe(false);
    });

    it('should compare same hash objects', () => {
      const hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.PdHue.';
      const password1 = Password.fromHash(hash);
      const password2 = Password.fromHash(hash);
      
      expect(password1.equals(password2)).toBe(true);
    });
  });

  describe('Password Requirements', () => {
    it('should provide strength requirements', () => {
      const requirements = Password.getStrengthRequirements();
      
      expect(requirements).toContain('At least 8 characters long');
      expect(requirements).toContain('At most 128 characters long');
      expect(requirements).toContain('Contains at least one uppercase letter');
      expect(requirements).toContain('Contains at least one lowercase letter');
      expect(requirements).toContain('Contains at least one number');
      expect(requirements).toContain('Contains at least one special character (!@#$%^&*(),.?":{}|<>)');
    });
  });

  describe('Password Serialization', () => {
    it('should not expose hash in JSON', async () => {
      const password = await Password.fromPlainText('ValidPass123!');
      const json = password.toJSON();
      
      expect(json).toEqual({});
      expect(Object.keys(json)).toHaveLength(0);
    });
  });
});
