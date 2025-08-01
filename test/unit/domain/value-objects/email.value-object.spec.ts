import { Email } from '../../../../src/domain/value-objects/email.vo';

describe('Email Value Object', () => {
  describe('create method', () => {
    it('should create valid email', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'test+tag@gmail.com',
        'user_123@company-name.com',
        'a@b.co',
      ];

      validEmails.forEach(email => {
        const emailVO = Email.create(email);
        expect(emailVO.value).toBe(email.toLowerCase());
      });
    });

    it('should normalize email to lowercase', () => {
      const email = Email.create('TEST@EXAMPLE.COM');
      expect(email.value).toBe('test@example.com');
    });

    it('should throw error for invalid email formats', () => {
      const invalidEmails = [
        '',
        'invalid',
        '@example.com',
        'test@',
        'test..test@example.com',
        'test@example.',
        'test@.example.com',
        'test @example.com',
        'test@exam ple.com',
        'test@example..com',
        'test@',
        '@',
        '..@example.com',
      ];

      invalidEmails.forEach(invalidEmail => {
        expect(() => Email.create(invalidEmail)).toThrow('Invalid email format');
      });
    });

    it('should throw error for email that is too long', () => {
      const longEmail = 'a'.repeat(255) + '@example.com';
      expect(() => Email.create(longEmail)).toThrow('Invalid email format');
    });

    it('should handle edge case empty string', () => {
      expect(() => Email.create('')).toThrow('Invalid email format');
    });
  });

  describe('equals method', () => {
    it('should return true for equal emails', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('TEST@EXAMPLE.COM');
      
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false for different emails', () => {
      const email1 = Email.create('test1@example.com');
      const email2 = Email.create('test2@example.com');
      
      expect(email1.equals(email2)).toBe(false);
    });
  });

  describe('toString method', () => {
    it('should return email value as string', () => {
      const email = Email.create('test@example.com');
      expect(email.toString()).toBe('test@example.com');
    });
  });

  describe('property getters', () => {
    it('should extract domain correctly', () => {
      const email = Email.create('user@example.com');
      expect(email.domain).toBe('example.com');
    });

    it('should extract domain from complex email', () => {
      const email = Email.create('user.name+tag@sub.domain.co.uk');
      expect(email.domain).toBe('sub.domain.co.uk');
    });

    it('should extract local part correctly', () => {
      const email = Email.create('user@example.com');
      expect(email.localPart).toBe('user');
    });

    it('should extract local part from complex email', () => {
      const email = Email.create('user.name+tag@example.com');
      expect(email.localPart).toBe('user.name+tag');
    });
  });

  describe('validation edge cases', () => {
    it('should handle international domain names', () => {
      // Note: Current implementation uses simple ASCII regex
      // This test documents expected behavior for international domains
      expect(() => Email.create('test@münchen.de')).toThrow('Invalid email format');
    });

    it('should handle plus addressing', () => {
      const email = Email.create('user+folder@example.com');
      expect(email.value).toBe('user+folder@example.com');
    });

    it('should handle dots in local part', () => {
      const email = Email.create('first.last@example.com');
      expect(email.value).toBe('first.last@example.com');
    });

    it('should reject consecutive dots', () => {
      expect(() => Email.create('first..last@example.com')).toThrow('Invalid email format');
    });

    it('should reject emails with domain parts being empty', () => {
      expect(() => Email.create('test@example..com')).toThrow('Invalid email format');
    });

    it('should reject emails with local part too long', () => {
      const longLocalPart = 'a'.repeat(65) + '@example.com';
      expect(() => Email.create(longLocalPart)).toThrow('Invalid email format');
    });

    it('should reject emails with domain too long', () => {
      const longDomain = 'test@' + 'a'.repeat(254) + '.com';
      expect(() => Email.create(longDomain)).toThrow('Invalid email format');
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON correctly', () => {
      const email = Email.create('test@example.com');
      const json = JSON.stringify({ email });
      const parsed = JSON.parse(json);
      
      expect(parsed.email).toBe('test@example.com');
    });

    it('should work with toJSON method', () => {
      const email = Email.create('test@example.com');
      const json = email.toJSON();
      
      expect(json).toBe('test@example.com');
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const email = Email.create('test@example.com');
      const originalValue = email.value;
      
      // Email should remain unchanged
      expect(email.value).toBe(originalValue);
      expect(email.value).toBe('test@example.com');
    });

    it('should not allow modification of internal state', () => {
      const email = Email.create('test@example.com');
      
      // Properties should be read-only and throw error when trying to modify
      expect(() => {
        (email as any).value = 'modified@example.com';
      }).toThrow(); // This should throw because value is read-only
    });
  });

  describe('whitespace handling', () => {
    it('should trim whitespace from email', () => {
      const email = Email.create('  test@example.com  ');
      expect(email.value).toBe('test@example.com');
    });

    it('should reject emails with internal whitespace', () => {
      expect(() => Email.create('test @example.com')).toThrow('Invalid email format');
      expect(() => Email.create('test@ example.com')).toThrow('Invalid email format');
      expect(() => Email.create('test@example .com')).toThrow('Invalid email format');
    });
  });

  describe('special characters', () => {
    it('should accept valid special characters in local part', () => {
      const validSpecialEmails = [
        'test.email@example.com',
        'test+tag@example.com',
        'test_underscore@example.com',
        'test-dash@example.com',
        "test'apostrophe@example.com",
      ];

      validSpecialEmails.forEach(email => {
        expect(() => Email.create(email)).not.toThrow();
      });
    });

    it('should reject invalid characters', () => {
      expect(() => Email.create('test@exam ple.com')).toThrow('Invalid email format');
      expect(() => Email.create('test@example..com')).toThrow('Invalid email format');
    });
  });
});
