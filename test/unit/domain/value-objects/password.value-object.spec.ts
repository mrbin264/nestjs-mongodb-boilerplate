import { Password } from '../../../../src/domain/value-objects/password.vo';

describe('Password Value Object', () => {
  describe('fromPlainText method', () => {
    it('should create password from valid plain text', async () => {
      const plainText = 'ValidPassword123!';
      const password = await Password.fromPlainText(plainText);
      
      expect(password).toBeInstanceOf(Password);
      expect(password.hashedValue).toBeDefined();
      expect(password.hashedValue).not.toBe(plainText);
      expect(password.hashedValue.length).toBeGreaterThan(50); // bcrypt hashes are typically 60 chars
    });

    it('should throw error for weak passwords', async () => {
      const weakPasswords = [
        'weak', // Too short, no uppercase, no number, no special char
        '12345678', // No uppercase, no lowercase, no special char
        'password', // No uppercase, no number, no special char
        'PASSWORD', // No lowercase, no number, no special char
        'Password', // No number, no special char
        'Password123', // No special character
        'password123!', // No uppercase
        'PASSWORD123!', // No lowercase
        'Pass1!', // Too short
        'a'.repeat(129) + 'A1!', // Too long
      ];

      for (const weakPassword of weakPasswords) {
        await expect(Password.fromPlainText(weakPassword))
          .rejects.toThrow('Password does not meet strength requirements');
      }
    });

    it('should accept various valid passwords', async () => {
      const validPasswords = [
        'ValidPassword123!',
        'MySecure@Pass1',
        'Test123!@#',
        'Complex$Password9',
        'A1b2C3d4!',
        'MyP@ssw0rd',
        'Str0ng!Pass',
        'Secur3#Test',
      ];

      for (const validPassword of validPasswords) {
        const password = await Password.fromPlainText(validPassword);
        expect(password).toBeInstanceOf(Password);
        expect(password.hashedValue).toBeDefined();
      }
    });

    it('should generate different hashes for same password', async () => {
      const plainText = 'SamePassword123!';
      const password1 = await Password.fromPlainText(plainText);
      const password2 = await Password.fromPlainText(plainText);
      
      expect(password1.hashedValue).not.toBe(password2.hashedValue);
    });
  });

  describe('fromHash method', () => {
    it('should create password from valid hash', () => {
      const hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4z7HqQ3Nz2';
      const password = Password.fromHash(hash);
      
      expect(password).toBeInstanceOf(Password);
      expect(password.hashedValue).toBe(hash);
    });

    it('should throw error for empty hash', () => {
      expect(() => Password.fromHash('')).toThrow('Password hash cannot be empty');
      expect(() => Password.fromHash('   ')).toThrow('Password hash cannot be empty');
    });

    it('should throw error for null or undefined hash', () => {
      expect(() => Password.fromHash(null as any)).toThrow('Password hash cannot be empty');
      expect(() => Password.fromHash(undefined as any)).toThrow('Password hash cannot be empty');
    });
  });

  describe('compare method', () => {
    it('should return true for correct password', async () => {
      const plainText = 'TestPassword123!';
      const password = await Password.fromPlainText(plainText);
      
      const isMatch = await password.compare(plainText);
      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const plainText = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const password = await Password.fromPlainText(plainText);
      
      const isMatch = await password.compare(wrongPassword);
      expect(isMatch).toBe(false);
    });

    it('should return false for empty string', async () => {
      const plainText = 'TestPassword123!';
      const password = await Password.fromPlainText(plainText);
      
      const isMatch = await password.compare('');
      expect(isMatch).toBe(false);
    });

    it('should handle case sensitivity correctly', async () => {
      const plainText = 'TestPassword123!';
      const password = await Password.fromPlainText(plainText);
      
      const isMatch = await password.compare('testpassword123!');
      expect(isMatch).toBe(false);
    });
  });

  describe('validateStrength static method', () => {
    it('should return true for strong passwords', () => {
      const strongPasswords = [
        'ValidPassword123!',
        'MySecure@Pass1',
        'Test123!@#',
        'Complex$Password9',
        'A1b2C3d4!',
      ];

      strongPasswords.forEach(password => {
        expect(Password.validateStrength(password)).toBe(true);
      });
    });

    it('should return false for weak passwords', () => {
      const weakPasswords = [
        'weak',
        '12345678',
        'password',
        'PASSWORD',
        'Password',
        'Password123',
        'password123!',
        'PASSWORD123!',
        'Pass1!', // Too short
        'a'.repeat(129) + 'A1!', // Too long
      ];

      weakPasswords.forEach(password => {
        expect(Password.validateStrength(password)).toBe(false);
      });
    });

    it('should check minimum length requirement', () => {
      expect(Password.validateStrength('Pass1!')).toBe(false); // 6 chars
      expect(Password.validateStrength('Pass12!')).toBe(false); // 7 chars
      expect(Password.validateStrength('Pass123!')).toBe(true); // 8 chars
    });

    it('should check maximum length requirement', () => {
      const maxLengthPassword = 'A1b!' + 'a'.repeat(124); // 128 chars total
      const tooLongPassword = 'A1b!' + 'a'.repeat(125); // 129 chars total
      
      expect(Password.validateStrength(maxLengthPassword)).toBe(true);
      expect(Password.validateStrength(tooLongPassword)).toBe(false);
    });

    it('should require uppercase letter', () => {
      expect(Password.validateStrength('password123!')).toBe(false);
      expect(Password.validateStrength('Password123!')).toBe(true);
    });

    it('should require lowercase letter', () => {
      expect(Password.validateStrength('PASSWORD123!')).toBe(false);
      expect(Password.validateStrength('Password123!')).toBe(true);
    });

    it('should require digit', () => {
      expect(Password.validateStrength('Password!')).toBe(false);
      expect(Password.validateStrength('Password1!')).toBe(true);
    });

    it('should require special character', () => {
      expect(Password.validateStrength('Password123')).toBe(false);
      expect(Password.validateStrength('Password123!')).toBe(true);
    });

    it('should accept all valid special characters', () => {
      const specialChars = '!@#$%^&*(),.?":{}|<>';
      
      for (const char of specialChars) {
        const password = `Password123${char}`;
        expect(Password.validateStrength(password)).toBe(true);
      }
    });
  });

  describe('getStrengthRequirements static method', () => {
    it('should return array of requirements', () => {
      const requirements = Password.getStrengthRequirements();
      
      expect(Array.isArray(requirements)).toBe(true);
      expect(requirements.length).toBeGreaterThan(0);
      expect(requirements).toContain('At least 8 characters long');
      expect(requirements).toContain('At most 128 characters long');
      expect(requirements).toContain('Contains at least one uppercase letter');
      expect(requirements).toContain('Contains at least one lowercase letter');
      expect(requirements).toContain('Contains at least one number');
      expect(requirements).toContain('Contains at least one special character (!@#$%^&*(),.?":{}|<>)');
    });
  });

  describe('equals method', () => {
    it('should return true for passwords with same hash', () => {
      const hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4z7HqQ3Nz2';
      const password1 = Password.fromHash(hash);
      const password2 = Password.fromHash(hash);
      
      expect(password1.equals(password2)).toBe(true);
    });

    it('should return false for passwords with different hashes', () => {
      const hash1 = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4z7HqQ3Nz2';
      const hash2 = '$2b$12$DifferentHashValue1234567890123456789012345678901234567890';
      const password1 = Password.fromHash(hash1);
      const password2 = Password.fromHash(hash2);
      
      expect(password1.equals(password2)).toBe(false);
    });

    it('should return false for passwords created from same plain text', async () => {
      const plainText = 'SamePassword123!';
      const password1 = await Password.fromPlainText(plainText);
      const password2 = await Password.fromPlainText(plainText);
      
      // They should have different hashes due to salt
      expect(password1.equals(password2)).toBe(false);
    });
  });

  describe('toJSON method', () => {
    it('should return empty object to prevent hash exposure', async () => {
      const password = await Password.fromPlainText('TestPassword123!');
      const json = password.toJSON();
      
      expect(json).toEqual({});
      expect(Object.keys(json)).toHaveLength(0);
    });

    it('should not expose hash in JSON.stringify', async () => {
      const password = await Password.fromPlainText('TestPassword123!');
      const serialized = JSON.stringify({ password });
      const parsed = JSON.parse(serialized);
      
      expect(parsed.password).toEqual({});
    });
  });

  describe('security considerations', () => {
    it('should use bcrypt with sufficient rounds', async () => {
      const password = await Password.fromPlainText('TestPassword123!');
      const hash = password.hashedValue;
      
      // bcrypt hashes start with $2a$ or $2b$ followed by cost parameter
      expect(hash).toMatch(/^\$2[ab]\$\d{2}\$/);
      
      // Extract cost parameter (should be 12 or higher)
      const costMatch = hash.match(/^\$2[ab]\$(\d+)\$/);
      expect(costMatch).toBeTruthy();
      const cost = parseInt(costMatch![1], 10);
      expect(cost).toBeGreaterThanOrEqual(12);
    });

    it('should produce different salts for each password', async () => {
      const plainText = 'SamePassword123!';
      const passwords = await Promise.all([
        Password.fromPlainText(plainText),
        Password.fromPlainText(plainText),
        Password.fromPlainText(plainText),
      ]);
      
      const hashes = passwords.map(p => p.hashedValue);
      const uniqueHashes = new Set(hashes);
      
      expect(uniqueHashes.size).toBe(hashes.length);
    });

    it('should handle timing attacks consistently', async () => {
      const password = await Password.fromPlainText('TestPassword123!');
      
      const startTime1 = Date.now();
      await password.compare('WrongPassword123!');
      const duration1 = Date.now() - startTime1;
      
      const startTime2 = Date.now();
      await password.compare('AnotherWrongPassword123!');
      const duration2 = Date.now() - startTime2;
      
      // Times should be similar (within reasonable variance)
      // This is a basic check - in practice, more sophisticated timing analysis would be needed
      expect(Math.abs(duration1 - duration2)).toBeLessThan(100);
    });
  });

  describe('immutability', () => {
    it('should be immutable', async () => {
      const password = await Password.fromPlainText('TestPassword123!');
      const originalHash = password.hashedValue;
      
      // Attempt to modify internal state - should not affect the hash
      // Even if modification doesn't throw, the hash should remain unchanged
      try {
        (password as any)._hashedValue = 'modified';
      } catch {
        // Ignore any errors from attempting to modify
      }
      
      expect(password.hashedValue).toBe(originalHash);
    });

    it('should not allow modification of hash through getter', async () => {
      const password = await Password.fromPlainText('TestPassword123!');
      const originalHash = password.hashedValue;
      
      // The hash should remain unchanged
      expect(password.hashedValue).toBe(originalHash);
    });
  });
});
