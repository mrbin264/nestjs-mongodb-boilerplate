import { UserDomainService } from '../../../src/domain/services/user-domain.service';
import { User } from '../../../src/domain/entities/user.entity';
import { Role } from '../../../src/domain/entities/role.entity';
import { Email } from '../../../src/domain/value-objects/email.vo';
import { Password } from '../../../src/domain/value-objects/password.vo';
import { InsufficientPermissionsException } from '../../../src/domain/exceptions/insufficient-permissions.exception';

describe('UserDomainService', () => {
  let userDomainService: UserDomainService;
  let validPassword: Password;

  beforeEach(async () => {
    userDomainService = new UserDomainService();
    validPassword = await Password.fromPlainText('ValidPass123!');
  });

  describe('User Creation Validation', () => {
    it('should allow system admin to create any user', () => {
      const systemAdmin = new User({
        email: Email.create('admin@example.com'),
        password: validPassword,
        roles: [Role.SYSTEM_ADMIN],
      });

      const newAdmin = new User({
        email: Email.create('newadmin@example.com'),
        password: validPassword,
        roles: [Role.ADMIN],
      });

      expect(userDomainService.validateUserCreation(newAdmin, systemAdmin)).toBe(true);
    });

    it('should allow admin to create regular users only', () => {
      const admin = new User({
        email: Email.create('admin@example.com'),
        password: validPassword,
        roles: [Role.ADMIN],
      });

      const newUser = new User({
        email: Email.create('newuser@example.com'),
        password: validPassword,
        roles: [Role.USER],
      });

      expect(userDomainService.validateUserCreation(newUser, admin)).toBe(true);
    });

    it('should prevent admin from creating elevated users', () => {
      const admin = new User({
        email: Email.create('admin@example.com'),
        password: validPassword,
        roles: [Role.ADMIN],
      });

      const newAdmin = new User({
        email: Email.create('newadmin@example.com'),
        password: validPassword,
        roles: [Role.ADMIN],
      });

      expect(() => userDomainService.validateUserCreation(newAdmin, admin))
        .toThrow(InsufficientPermissionsException);
    });

    it('should prevent regular users from creating any users', () => {
      const user = new User({
        email: Email.create('user@example.com'),
        password: validPassword,
        roles: [Role.USER],
      });

      const newUser = new User({
        email: Email.create('newuser@example.com'),
        password: validPassword,
        roles: [Role.USER],
      });

      expect(() => userDomainService.validateUserCreation(newUser, user))
        .toThrow(InsufficientPermissionsException);
    });
  });

  describe('Role Assignment Validation', () => {
    it('should allow system admin to assign any role', () => {
      const systemAdmin = new User({
        email: Email.create('admin@example.com'),
        password: validPassword,
        roles: [Role.SYSTEM_ADMIN],
      });

      const user = new User({
        email: Email.create('user@example.com'),
        password: validPassword,
        roles: [Role.USER],
      });

      expect(userDomainService.canAssignRole(user, Role.ADMIN, systemAdmin)).toBe(true);
      expect(userDomainService.canAssignRole(user, Role.SYSTEM_ADMIN, systemAdmin)).toBe(true);
    });

    it('should allow admin to assign USER role only', () => {
      const admin = new User({
        email: Email.create('admin@example.com'),
        password: validPassword,
        roles: [Role.ADMIN],
      });

      const user = new User({
        email: Email.create('user@example.com'),
        password: validPassword,
        roles: [Role.USER],
      });

      expect(userDomainService.canAssignRole(user, Role.USER, admin)).toBe(true);

      expect(() => userDomainService.canAssignRole(user, Role.ADMIN, admin))
        .toThrow(InsufficientPermissionsException);
    });

    it('should prevent regular users from assigning roles', () => {
      const user = new User({
        email: Email.create('user@example.com'),
        password: validPassword,
        roles: [Role.USER],
      });

      const otherUser = new User({
        email: Email.create('otheruser@example.com'),
        password: validPassword,
        roles: [Role.USER],
      });

      expect(() => userDomainService.canAssignRole(otherUser, Role.USER, user))
        .toThrow(InsufficientPermissionsException);
    });
  });

  describe('User Hierarchy Validation', () => {
    it('should allow system admin to manage anyone', () => {
      const systemAdmin = new User({
        email: Email.create('admin@example.com'),
        password: validPassword,
        roles: [Role.SYSTEM_ADMIN],
      });

      const admin = new User({
        email: Email.create('admin2@example.com'),
        password: validPassword,
        roles: [Role.ADMIN],
      });

      expect(userDomainService.validateUserHierarchy(systemAdmin, admin)).toBe(true);
    });

    it('should allow admin to manage regular users only', () => {
      const admin = new User({
        email: Email.create('admin@example.com'),
        password: validPassword,
        roles: [Role.ADMIN],
      });

      const user = new User({
        email: Email.create('user@example.com'),
        password: validPassword,
        roles: [Role.USER],
      });

      const otherAdmin = new User({
        email: Email.create('admin2@example.com'),
        password: validPassword,
        roles: [Role.ADMIN],
      });

      expect(userDomainService.validateUserHierarchy(admin, user)).toBe(true);

      expect(() => userDomainService.validateUserHierarchy(admin, otherAdmin))
        .toThrow(InsufficientPermissionsException);
    });

    it('should allow users to manage themselves only', () => {
      const user1 = new User({
        email: Email.create('user1@example.com'),
        password: validPassword,
        roles: [Role.USER],
      });

      const user2 = new User({
        email: Email.create('user2@example.com'),
        password: validPassword,
        roles: [Role.USER],
      });

      expect(userDomainService.validateUserHierarchy(user1, user1)).toBe(true);

      expect(() => userDomainService.validateUserHierarchy(user1, user2))
        .toThrow(InsufficientPermissionsException);
    });
  });

  describe('Email Uniqueness Validation', () => {
    it('should detect email conflicts', () => {
      const email = Email.create('test@example.com');
      const existingUser = new User({
        email,
        password: validPassword,
        roles: [Role.USER],
      });

      const isUnique = userDomainService.validateEmailUniqueness(
        email,
        [existingUser]
      );

      expect(isUnique).toBe(false);
    });

    it('should allow unique emails', () => {
      const email = Email.create('new@example.com');
      const existingUser = new User({
        email: Email.create('existing@example.com'),
        password: validPassword,
        roles: [Role.USER],
      });

      const isUnique = userDomainService.validateEmailUniqueness(
        email,
        [existingUser]
      );

      expect(isUnique).toBe(true);
    });

    it('should exclude specific user from uniqueness check', () => {
      const email = Email.create('test@example.com');
      const existingUser = new User({
        email,
        password: validPassword,
        roles: [Role.USER],
      });

      const isUnique = userDomainService.validateEmailUniqueness(
        email,
        [existingUser],
        existingUser.id.toString()
      );

      expect(isUnique).toBe(true);
    });
  });

  describe('Profile Completeness Validation', () => {
    it('should validate complete profile', () => {
      const user = new User({
        email: Email.create('user@example.com'),
        password: validPassword,
        roles: [Role.USER],
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567890',
        },
      });

      const isComplete = userDomainService.validateProfileCompleteness(
        user,
        ['firstName', 'lastName', 'phone']
      );

      expect(isComplete).toBe(true);
    });

    it('should detect missing profile fields', () => {
      const user = new User({
        email: Email.create('user@example.com'),
        password: validPassword,
        roles: [Role.USER],
        profile: {
          firstName: 'John',
        },
      });

      const isComplete = userDomainService.validateProfileCompleteness(
        user,
        ['firstName', 'lastName', 'phone']
      );

      expect(isComplete).toBe(false);
    });
  });

  describe('Password Management Validation', () => {
    it('should allow users to manage their own password', () => {
      const user = new User({
        email: Email.create('user@example.com'),
        password: validPassword,
        roles: [Role.USER],
      });

      expect(userDomainService.canManagePassword(user, user)).toBe(true);
    });

    it('should allow system admin to manage any password', () => {
      const systemAdmin = new User({
        email: Email.create('admin@example.com'),
        password: validPassword,
        roles: [Role.SYSTEM_ADMIN],
      });

      const user = new User({
        email: Email.create('user@example.com'),
        password: validPassword,
        roles: [Role.USER],
      });

      expect(userDomainService.canManagePassword(systemAdmin, user)).toBe(true);
    });

    it('should allow admin to manage passwords of managed users', () => {
      const admin = new User({
        email: Email.create('admin@example.com'),
        password: validPassword,
        roles: [Role.ADMIN],
      });

      const user = new User({
        email: Email.create('user@example.com'),
        password: validPassword,
        roles: [Role.USER],
      });

      expect(userDomainService.canManagePassword(admin, user)).toBe(true);
    });
  });
});
