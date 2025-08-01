import { Email } from '../../../src/domain/value-objects/email.vo';

describe('Email Value Object', () => {
  describe('Email Creation', () => {
    it('should create valid email', () => {
      const email = Email.create('test@example.com');
      expect(email.value).toBe('test@example.com');
    });

    it('should normalize email to lowercase', () => {
      const email = Email.create('TEST@EXAMPLE.COM');
      expect(email.value).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      const email = Email.create('  test@example.com  ');
      expect(email.value).toBe('test@example.com');
    });
  });

  describe('Email Validation', () => {
    it('should accept valid email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user_name@example-domain.com',
        'test.email+tag@domain.co.uk',
        'x@y.z',
      ];

      validEmails.forEach(emailStr => {
        expect(() => Email.create(emailStr)).not.toThrow();
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test..test@example.com',
        'test@example..com',
        'test@.example.com',
        'test@example.com.',
        '',
        'a'.repeat(65) + '@example.com', // local part too long
        'test@' + 'a'.repeat(254) + '.com', // domain too long
        'a'.repeat(255) + '@example.com', // total too long
      ];

      invalidEmails.forEach(emailStr => {
        expect(() => Email.create(emailStr)).toThrow('Invalid email format');
      });
    });
  });

  describe('Email Properties', () => {
    it('should extract local part', () => {
      const email = Email.create('user.name@example.com');
      expect(email.localPart).toBe('user.name');
    });

    it('should extract domain', () => {
      const email = Email.create('user.name@example.com');
      expect(email.domain).toBe('example.com');
    });
  });

  describe('Email Comparison', () => {
    it('should compare emails correctly', () => {
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('TEST@EXAMPLE.COM');
      const email3 = Email.create('different@example.com');

      expect(email1.equals(email2)).toBe(true);
      expect(email1.equals(email3)).toBe(false);
    });
  });

  describe('Email Serialization', () => {
    it('should convert to string', () => {
      const email = Email.create('test@example.com');
      expect(email.toString()).toBe('test@example.com');
    });

    it('should serialize to JSON', () => {
      const email = Email.create('test@example.com');
      expect(email.toJSON()).toBe('test@example.com');
    });
  });
});
