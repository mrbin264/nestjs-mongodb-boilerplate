import { UserId } from '../../../src/domain/value-objects/user-id.vo';
import { Types } from 'mongoose';

describe('UserId Value Object', () => {
  describe('UserId Creation', () => {
    it('should generate new UserId', () => {
      const userId = UserId.generate();
      
      expect(userId).toBeDefined();
      expect(userId.value).toBeDefined();
      expect(Types.ObjectId.isValid(userId.value)).toBe(true);
    });

    it('should create UserId from string', () => {
      const objectIdStr = new Types.ObjectId().toString();
      const userId = UserId.fromString(objectIdStr);
      
      expect(userId.value).toBe(objectIdStr);
    });

    it('should create UserId from ObjectId', () => {
      const objectId = new Types.ObjectId();
      const userId = UserId.fromObjectId(objectId);
      
      expect(userId.value).toBe(objectId.toString());
    });

    it('should reject invalid ObjectId strings', () => {
      const invalidIds = [
        'invalid-id',
        '123',
        '',
        'not-an-objectid',
      ];

      invalidIds.forEach(invalidId => {
        expect(() => UserId.fromString(invalidId))
          .toThrow(`Invalid UserId format: ${invalidId}`);
      });
    });
  });

  describe('UserId Conversion', () => {
    it('should convert to ObjectId', () => {
      const objectId = new Types.ObjectId();
      const userId = UserId.fromObjectId(objectId);
      
      const convertedObjectId = userId.toObjectId();
      expect(convertedObjectId.toString()).toBe(objectId.toString());
    });

    it('should convert to string', () => {
      const objectIdStr = new Types.ObjectId().toString();
      const userId = UserId.fromString(objectIdStr);
      
      expect(userId.toString()).toBe(objectIdStr);
    });
  });

  describe('UserId Comparison', () => {
    it('should compare UserIds correctly', () => {
      const objectId = new Types.ObjectId();
      const userId1 = UserId.fromObjectId(objectId);
      const userId2 = UserId.fromString(objectId.toString());
      const userId3 = UserId.generate();
      
      expect(userId1.equals(userId2)).toBe(true);
      expect(userId1.equals(userId3)).toBe(false);
    });
  });

  describe('UserId Serialization', () => {
    it('should serialize to JSON', () => {
      const objectIdStr = new Types.ObjectId().toString();
      const userId = UserId.fromString(objectIdStr);
      
      expect(userId.toJSON()).toBe(objectIdStr);
    });
  });

  describe('UserId Validation', () => {
    it('should validate ObjectId format', () => {
      const validObjectIds = [
        '507f1f77bcf86cd799439011',
        '507f191e810c19729de860ea',
        new Types.ObjectId().toString(),
      ];

      validObjectIds.forEach(validId => {
        expect(() => UserId.fromString(validId)).not.toThrow();
      });
    });

    it('should reject non-ObjectId formats', () => {
      const invalidObjectIds = [
        '507f1f77bcf86cd79943901', // too short
        '507f1f77bcf86cd799439011x', // too long
        'gggggggggggggggggggggggg', // invalid characters
        '507f1f77bcf86cd79943901g', // invalid character
      ];

      invalidObjectIds.forEach(invalidId => {
        expect(() => UserId.fromString(invalidId)).toThrow();
      });
    });
  });
});
