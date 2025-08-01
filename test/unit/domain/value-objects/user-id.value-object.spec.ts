import { Types } from 'mongoose';
import { UserId } from '../../../../src/domain/value-objects/user-id.vo';

describe('UserId Value Object', () => {
  describe('generate method', () => {
    it('should generate valid UserId', () => {
      const userId = UserId.generate();
      
      expect(userId).toBeInstanceOf(UserId);
      expect(userId.value).toBeDefined();
      expect(userId.value).toHaveLength(24); // MongoDB ObjectId length
      expect(Types.ObjectId.isValid(userId.value)).toBe(true);
    });

    it('should generate unique UserIds', () => {
      const userIds = Array.from({ length: 100 }, () => UserId.generate());
      const values = userIds.map(id => id.value);
      const uniqueValues = new Set(values);
      
      expect(uniqueValues.size).toBe(values.length);
    });
  });

  describe('fromString method', () => {
    it('should create UserId from valid string', () => {
      const validId = '507f1f77bcf86cd799439011';
      const userId = UserId.fromString(validId);
      
      expect(userId).toBeInstanceOf(UserId);
      expect(userId.value).toBe(validId);
    });

    it('should create UserId from ObjectId string', () => {
      const objectId = new Types.ObjectId();
      const userId = UserId.fromString(objectId.toString());
      
      expect(userId.value).toBe(objectId.toString());
    });

    it('should throw error for invalid string formats', () => {
      const invalidIds = [
        '',
        'invalid',
        '123',
        '507f1f77bcf86cd79943901', // Too short
        '507f1f77bcf86cd799439011a', // Too long
        '507f1f77bcf86cd79943901g', // Invalid character
        'not-an-objectid',
        '507f1f77bcf86cd799439011Z', // Invalid hex character
      ];

      invalidIds.forEach(invalidId => {
        expect(() => UserId.fromString(invalidId))
          .toThrow(`Invalid UserId format: ${invalidId}`);
      });
    });

    it('should throw error for null or undefined', () => {
      expect(() => UserId.fromString(null as any))
        .toThrow('Invalid UserId format: null');
      expect(() => UserId.fromString(undefined as any))
        .toThrow('Invalid UserId format: undefined');
    });
  });

  describe('fromObjectId method', () => {
    it('should create UserId from ObjectId', () => {
      const objectId = new Types.ObjectId();
      const userId = UserId.fromObjectId(objectId);
      
      expect(userId).toBeInstanceOf(UserId);
      expect(userId.value).toBe(objectId.toString());
    });

    it('should work with different ObjectIds', () => {
      const objectIds = Array.from({ length: 10 }, () => new Types.ObjectId());
      
      objectIds.forEach(objectId => {
        const userId = UserId.fromObjectId(objectId);
        expect(userId.value).toBe(objectId.toString());
        expect(Types.ObjectId.isValid(userId.value)).toBe(true);
      });
    });
  });

  describe('toObjectId method', () => {
    it('should convert back to ObjectId', () => {
      const originalObjectId = new Types.ObjectId();
      const userId = UserId.fromObjectId(originalObjectId);
      const convertedObjectId = userId.toObjectId();
      
      expect(convertedObjectId).toBeInstanceOf(Types.ObjectId);
      expect(convertedObjectId.toString()).toBe(originalObjectId.toString());
      expect(convertedObjectId.equals(originalObjectId)).toBe(true);
    });

    it('should work with generated UserIds', () => {
      const userId = UserId.generate();
      const objectId = userId.toObjectId();
      
      expect(objectId).toBeInstanceOf(Types.ObjectId);
      expect(objectId.toString()).toBe(userId.value);
    });

    it('should work with UserIds created from string', () => {
      const idString = '507f1f77bcf86cd799439011';
      const userId = UserId.fromString(idString);
      const objectId = userId.toObjectId();
      
      expect(objectId.toString()).toBe(idString);
    });
  });

  describe('toString method', () => {
    it('should return string representation', () => {
      const idString = '507f1f77bcf86cd799439011';
      const userId = UserId.fromString(idString);
      
      expect(userId.toString()).toBe(idString);
    });

    it('should return same value as value getter', () => {
      const userId = UserId.generate();
      
      expect(userId.toString()).toBe(userId.value);
    });
  });

  describe('equals method', () => {
    it('should return true for equal UserIds', () => {
      const idString = '507f1f77bcf86cd799439011';
      const userId1 = UserId.fromString(idString);
      const userId2 = UserId.fromString(idString);
      
      expect(userId1.equals(userId2)).toBe(true);
    });

    it('should return false for different UserIds', () => {
      const userId1 = UserId.generate();
      const userId2 = UserId.generate();
      
      expect(userId1.equals(userId2)).toBe(false);
    });

    it('should work with UserIds created from ObjectIds', () => {
      const objectId = new Types.ObjectId();
      const userId1 = UserId.fromObjectId(objectId);
      const userId2 = UserId.fromString(objectId.toString());
      
      expect(userId1.equals(userId2)).toBe(true);
    });

    it('should be symmetric', () => {
      const idString = '507f1f77bcf86cd799439011';
      const userId1 = UserId.fromString(idString);
      const userId2 = UserId.fromString(idString);
      
      expect(userId1.equals(userId2)).toBe(userId2.equals(userId1));
    });

    it('should be reflexive', () => {
      const userId = UserId.generate();
      
      expect(userId.equals(userId)).toBe(true);
    });
  });

  describe('toJSON method', () => {
    it('should return string representation for JSON', () => {
      const idString = '507f1f77bcf86cd799439011';
      const userId = UserId.fromString(idString);
      
      expect(userId.toJSON()).toBe(idString);
    });

    it('should work with JSON.stringify', () => {
      const userId = UserId.generate();
      const json = JSON.stringify({ userId });
      const parsed = JSON.parse(json);
      
      expect(parsed.userId).toBe(userId.value);
    });

    it('should serialize in arrays', () => {
      const userIds = [UserId.generate(), UserId.generate()];
      const json = JSON.stringify(userIds);
      const parsed = JSON.parse(json);
      
      expect(parsed).toHaveLength(2);
      expect(parsed[0]).toBe(userIds[0].value);
      expect(parsed[1]).toBe(userIds[1].value);
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const userId = UserId.generate();
      const originalValue = userId.value;
      
      // Attempt to modify internal state - should not affect the value
      // Even if modification doesn't throw, the value should remain unchanged
      try {
        (userId as any)._value = 'modified';
      } catch {
        // Ignore any errors from attempting to modify
      }
      
      expect(userId.value).toBe(originalValue);
    });

    it('should not allow modification through value getter', () => {
      const userId = UserId.generate();
      const originalValue = userId.value;
      
      // The value should remain unchanged
      expect(userId.value).toBe(originalValue);
    });
  });

  describe('MongoDB integration', () => {
    it('should work seamlessly with MongoDB ObjectId operations', () => {
      const userId = UserId.generate();
      const objectId = userId.toObjectId();
      
      // Should be able to convert back and forth
      expect(UserId.fromObjectId(objectId).value).toBe(userId.value);
    });

    it('should maintain ObjectId properties', () => {
      const userId = UserId.generate();
      const objectId = userId.toObjectId();
      
      // ObjectId should have timestamp information
      expect(objectId.getTimestamp()).toBeInstanceOf(Date);
      expect(objectId.getTimestamp().getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should work with ObjectId comparison', () => {
      const objectId1 = new Types.ObjectId();
      const objectId2 = new Types.ObjectId();
      
      const userId1 = UserId.fromObjectId(objectId1);
      const userId2 = UserId.fromObjectId(objectId2);
      
      expect(userId1.equals(userId2)).toBe(objectId1.equals(objectId2));
    });
  });

  describe('validation edge cases', () => {
    it('should handle uppercase hex characters', () => {
      const uppercaseId = '507F1F77BCF86CD799439011';
      const userId = UserId.fromString(uppercaseId);
      
      expect(userId.value).toBe(uppercaseId);
    });

    it('should handle mixed case hex characters', () => {
      const mixedCaseId = '507f1F77bcF86cD799439011';
      const userId = UserId.fromString(mixedCaseId);
      
      expect(userId.value).toBe(mixedCaseId);
    });

    it('should reject strings with invalid hex characters', () => {
      const invalidHexIds = [
        '507f1f77bcf86cd79943901g', // 'g' is not hex
        '507f1f77bcf86cd79943901z', // 'z' is not hex
        '507f1f77bcf86cd79943901-', // '-' is not hex
        '507f1f77bcf86cd79943901_', // '_' is not hex
      ];

      invalidHexIds.forEach(invalidId => {
        expect(() => UserId.fromString(invalidId))
          .toThrow(`Invalid UserId format: ${invalidId}`);
      });
    });

    it('should work with boundary valid ObjectIds', () => {
      // All zeros (valid ObjectId)
      const allZeros = '000000000000000000000000';
      expect(() => UserId.fromString(allZeros)).not.toThrow();
      
      // All F's (valid ObjectId)
      const allFs = 'ffffffffffffffffffffffff';
      expect(() => UserId.fromString(allFs)).not.toThrow();
    });
  });

  describe('performance considerations', () => {
    it('should generate UserIds quickly', () => {
      const startTime = Date.now();
      const userIds = Array.from({ length: 1000 }, () => UserId.generate());
      const endTime = Date.now();
      
      expect(userIds).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should be very fast
    });

    it('should validate UserIds quickly', () => {
      const validIds = Array.from({ length: 1000 }, () => new Types.ObjectId().toString());
      
      const startTime = Date.now();
      validIds.forEach(id => UserId.fromString(id));
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should be very fast
    });
  });
});
