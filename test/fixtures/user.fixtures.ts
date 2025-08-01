// Test fixtures for User entity and related data
import { Role } from '@/domain/entities/role.entity';
import { Email } from '@/domain/value-objects/email.vo';
import { UserId } from '@/domain/value-objects/user-id.vo';
import { Password } from '@/domain/value-objects/password.vo';

export class UserFixtures {
  /**
   * Valid user data for testing
   */
  static validUser() {
    return {
      email: 'test@example.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      roles: [Role.USER],
      isActive: true,
      emailVerified: false,
    };
  }

  /**
   * Admin user data for testing
   */
  static adminUser() {
    return {
      email: 'admin@example.com',
      password: 'AdminPassword123!',
      firstName: 'Admin',
      lastName: 'User',
      roles: [Role.ADMIN],
      isActive: true,
      emailVerified: true,
    };
  }

  /**
   * System admin user data for testing
   */
  static systemAdminUser() {
    return {
      email: 'system@example.com',
      password: 'SystemPassword123!',
      firstName: 'System',
      lastName: 'Admin',
      roles: [Role.SYSTEM_ADMIN],
      isActive: true,
      emailVerified: true,
    };
  }

  /**
   * Invalid user data for validation testing
   */
  static invalidUser() {
    return {
      email: 'invalid-email',
      password: '123', // Too weak
      firstName: '',
      lastName: '',
      roles: [],
    };
  }

  /**
   * User with all profile fields
   */
  static userWithProfile() {
    return {
      ...this.validUser(),
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        avatar: 'https://example.com/avatar.jpg',
        phone: '+1234567890',
        dateOfBirth: new Date('1990-01-15'),
      },
    };
  }

  /**
   * Inactive user for testing
   */
  static inactiveUser() {
    return {
      ...this.validUser(),
      email: 'inactive@example.com',
      isActive: false,
    };
  }

  /**
   * User with unverified email
   */
  static unverifiedUser() {
    return {
      ...this.validUser(),
      email: 'unverified@example.com',
      emailVerified: false,
    };
  }

  /**
   * Generate multiple users for bulk testing
   */
  static createUsers(count: number, roleType: 'user' | 'admin' | 'system_admin' = 'user') {
    const users = [];
    const roleMap = {
      user: Role.USER,
      admin: Role.ADMIN,
      system_admin: Role.SYSTEM_ADMIN,
    };

    for (let i = 0; i < count; i++) {
      users.push({
        email: `user${i + 1}@example.com`,
        password: `Password${i + 1}123!`,
        firstName: `User${i + 1}`,
        lastName: 'Test',
        roles: [roleMap[roleType]],
        isActive: true,
        emailVerified: i % 2 === 0, // Alternate verified/unverified
      });
    }

    return users;
  }

  /**
   * User data for registration testing
   */
  static registrationData() {
    return {
      email: 'newuser@example.com',
      password: 'NewPassword123!',
      firstName: 'New',
      lastName: 'User',
    };
  }

  /**
   * User data for login testing
   */
  static loginCredentials() {
    return {
      email: 'test@example.com',
      password: 'TestPassword123!',
    };
  }

  /**
   * Invalid login credentials
   */
  static invalidCredentials() {
    return [
      {
        email: 'nonexistent@example.com',
        password: 'TestPassword123!',
      },
      {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      },
      {
        email: 'invalid-email',
        password: 'TestPassword123!',
      },
      {
        email: 'test@example.com',
        password: '',
      },
    ];
  }

  /**
   * User update data for testing
   */
  static updateData() {
    return {
      firstName: 'Updated',
      lastName: 'Name',
      profile: {
        phone: '+1987654321',
        dateOfBirth: new Date('1985-05-20'),
      },
    };
  }

  /**
   * Profile update data
   */
  static profileUpdateData() {
    return {
      firstName: 'John',
      lastName: 'Updated',
      avatar: 'https://example.com/new-avatar.jpg',
      phone: '+1122334455',
      dateOfBirth: new Date('1992-03-10'),
    };
  }

  /**
   * Password change data
   */
  static passwordChangeData() {
    return {
      currentPassword: 'TestPassword123!',
      newPassword: 'NewPassword456!',
      confirmPassword: 'NewPassword456!',
    };
  }

  /**
   * Invalid password change data
   */
  static invalidPasswordChangeData() {
    return [
      {
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewPassword456!',
        confirmPassword: 'NewPassword456!',
      },
      {
        currentPassword: 'TestPassword123!',
        newPassword: 'weak',
        confirmPassword: 'weak',
      },
      {
        currentPassword: 'TestPassword123!',
        newPassword: 'NewPassword456!',
        confirmPassword: 'DifferentPassword789!',
      },
    ];
  }

  /**
   * Search query parameters for testing
   */
  static searchQueries() {
    return [
      { search: 'test', page: 1, limit: 10 },
      { search: 'admin', page: 1, limit: 5 },
      { role: 'user', page: 2, limit: 10 },
      { isActive: true, page: 1, limit: 20 },
      { emailVerified: false, page: 1, limit: 15 },
    ];
  }

  /**
   * Domain value objects for testing
   */
  static createValueObjects() {
    return {
      validEmail: Email.create('test@example.com'),
      invalidEmail: () => Email.create('invalid-email'), // This should throw
      validUserId: UserId.generate(),
      userIdFromString: UserId.fromString('507f1f77bcf86cd799439011'),
      validPassword: async () => Password.fromPlainText('TestPassword123!'),
      weakPassword: async () => Password.fromPlainText('weak'), // This should throw
    };
  }
}
