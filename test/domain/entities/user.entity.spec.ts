import { User, UserProfile } from '../../../src/domain/entities/user.entity';
import { Role } from '../../../src/domain/entities/role.entity';
import { Email } from '../../../src/domain/value-objects/email.vo';
import { Password } from '../../../src/domain/value-objects/password.vo';
import { UserId } from '../../../src/domain/value-objects/user-id.vo';

describe('User Entity', () => {
  let validEmail: Email;
  let validPassword: Password;
  let userId: UserId;

  beforeEach(async () => {
    validEmail = Email.create('test@example.com');
    validPassword = await Password.fromPlainText('ValidPass123!');
    userId = UserId.generate();
  });

  describe('User Creation', () => {
    it('should create a user with valid properties', () => {
      const user = new User({
        email: validEmail,
        password: validPassword,
        roles: [Role.USER],
      });

      expect(user.email).toBe(validEmail);
      expect(user.password).toBe(validPassword);
      expect(user.roles).toEqual([Role.USER]);
      expect(user.emailVerified).toBe(false);
      expect(user.isActive).toBe(true);
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should create a user using factory method', () => {
      const user = User.create({
        email: validEmail,
        password: validPassword,
        roles: [Role.USER],
      });

      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should set default values correctly', () => {
      const user = new User({
        email: validEmail,
        password: validPassword,
        roles: [Role.USER],
      });

      expect(user.emailVerified).toBe(false);
      expect(user.isActive).toBe(true);
      expect(user.profile).toEqual({});
    });
  });

  describe('Profile Validation', () => {
    it('should validate a complete profile', () => {
      const profile: UserProfile = {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        dateOfBirth: new Date('1990-01-01'),
      };

      const user = new User({
        email: validEmail,
        password: validPassword,
        roles: [Role.USER],
        profile,
      });

      expect(user.validateProfile()).toBe(true);
    });

    it('should reject profile with invalid phone', () => {
      const profile: UserProfile = {
        firstName: 'John',
        lastName: 'Doe',
        phone: 'invalid-phone',
      };

      const user = new User({
        email: validEmail,
        password: validPassword,
        roles: [Role.USER],
        profile,
      });

      expect(user.validateProfile()).toBe(false);
    });

    it('should reject profile with future birth date', () => {
      const profile: UserProfile = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date(Date.now() + 86400000), // tomorrow
      };

      const user = new User({
        email: validEmail,
        password: validPassword,
        roles: [Role.USER],
        profile,
      });

      expect(user.validateProfile()).toBe(false);
    });

    it('should reject profile with short names', () => {
      const profile: UserProfile = {
        firstName: 'J',
        lastName: 'D',
      };

      const user = new User({
        email: validEmail,
        password: validPassword,
        roles: [Role.USER],
        profile,
      });

      expect(user.validateProfile()).toBe(false);
    });
  });

  describe('Role Management', () => {
    it('should check if user has specific role', () => {
      const user = new User({
        email: validEmail,
        password: validPassword,
        roles: [Role.ADMIN, Role.USER],
      });

      expect(user.isInRole(Role.ADMIN)).toBe(true);
      expect(user.isInRole(Role.USER)).toBe(true);
      expect(user.isInRole(Role.SYSTEM_ADMIN)).toBe(false);
    });

    it('should add role to user', () => {
      const user = new User({
        email: validEmail,
        password: validPassword,
        roles: [Role.USER],
      });

      user.addRole(Role.ADMIN);

      expect(user.isInRole(Role.ADMIN)).toBe(true);
      expect(user.roles).toHaveLength(2);
    });

    it('should not add duplicate roles', () => {
      const user = new User({
        email: validEmail,
        password: validPassword,
        roles: [Role.USER],
      });

      user.addRole(Role.USER);

      expect(user.roles).toHaveLength(1);
    });

    it('should remove role from user', () => {
      const user = new User({
        email: validEmail,
        password: validPassword,
        roles: [Role.ADMIN, Role.USER],
      });

      user.removeRole(Role.ADMIN);

      expect(user.isInRole(Role.ADMIN)).toBe(false);
      expect(user.roles).toHaveLength(1);
    });
  });

  describe('User Management Permissions', () => {
    it('should allow system admin to manage any user', () => {
      const systemAdmin = new User({
        email: Email.create('admin@example.com'),
        password: validPassword,
        roles: [Role.SYSTEM_ADMIN],
      });

      const targetUser = new User({
        email: Email.create('user@example.com'),
        password: validPassword,
        roles: [Role.ADMIN],
      });

      expect(systemAdmin.canManageUser(targetUser)).toBe(true);
    });

    it('should allow admin to manage regular users only', () => {
      const admin = new User({
        email: Email.create('admin@example.com'),
        password: validPassword,
        roles: [Role.ADMIN],
      });

      const regularUser = new User({
        email: Email.create('user@example.com'),
        password: validPassword,
        roles: [Role.USER],
      });

      const otherAdmin = new User({
        email: Email.create('admin2@example.com'),
        password: validPassword,
        roles: [Role.ADMIN],
      });

      expect(admin.canManageUser(regularUser)).toBe(true);
      expect(admin.canManageUser(otherAdmin)).toBe(false);
    });

    it('should allow users to manage themselves only', () => {
      const user1 = new User({
        id: userId,
        email: Email.create('user1@example.com'),
        password: validPassword,
        roles: [Role.USER],
      });

      const user2 = new User({
        email: Email.create('user2@example.com'),
        password: validPassword,
        roles: [Role.USER],
      });

      expect(user1.canManageUser(user1)).toBe(true);
      expect(user1.canManageUser(user2)).toBe(false);
    });
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

      expect(newAdmin.canBeCreatedBy(systemAdmin)).toBe(true);
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

      const newAdmin = new User({
        email: Email.create('newadmin@example.com'),
        password: validPassword,
        roles: [Role.ADMIN],
      });

      expect(newUser.canBeCreatedBy(admin)).toBe(true);
      expect(newAdmin.canBeCreatedBy(admin)).toBe(false);
    });

    it('should not allow regular users to create other users', () => {
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

      expect(newUser.canBeCreatedBy(user)).toBe(false);
    });
  });

  describe('User State Management', () => {
    it('should verify email', () => {
      const user = new User({
        email: validEmail,
        password: validPassword,
        roles: [Role.USER],
      });

      expect(user.emailVerified).toBe(false);

      user.verifyEmail();

      expect(user.emailVerified).toBe(true);
    });

    it('should deactivate user', () => {
      const user = new User({
        email: validEmail,
        password: validPassword,
        roles: [Role.USER],
      });

      expect(user.isActive).toBe(true);

      user.deactivate();

      expect(user.isActive).toBe(false);
    });

    it('should activate user', () => {
      const user = new User({
        email: validEmail,
        password: validPassword,
        roles: [Role.USER],
        isActive: false,
      });

      expect(user.isActive).toBe(false);

      user.activate();

      expect(user.isActive).toBe(true);
    });

    it('should update last login timestamp', () => {
      const user = new User({
        email: validEmail,
        password: validPassword,
        roles: [Role.USER],
      });

      expect(user.lastLoginAt).toBeUndefined();

      user.updateLastLogin();

      expect(user.lastLoginAt).toBeInstanceOf(Date);
    });
  });

  describe('Profile Updates', () => {
    it('should update profile', () => {
      const user = new User({
        email: validEmail,
        password: validPassword,
        roles: [Role.USER],
      });

      const profileUpdate = {
        firstName: 'John',
        lastName: 'Doe',
      };

      user.updateProfile(profileUpdate);

      expect(user.profile.firstName).toBe('John');
      expect(user.profile.lastName).toBe('Doe');
    });

    it('should update password', async () => {
      const user = new User({
        email: validEmail,
        password: validPassword,
        roles: [Role.USER],
      });

      const newPassword = await Password.fromPlainText('NewValidPass123!');
      const oldUpdatedAt = user.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => global.setTimeout(resolve, 1));

      user.updatePassword(newPassword);

      expect(user.password).toBe(newPassword);
      expect(user.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime());
    });
  });
});
