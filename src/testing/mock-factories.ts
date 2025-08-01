// Mock implementations for testing
// Note: This file is only used in test environments where Jest is available

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const jest: any;

// Domain entities for mocking
import { User } from '@/domain/entities/user.entity';
import { Role } from '@/domain/entities/role.entity';
import { Email } from '@/domain/value-objects/email.vo';
import { UserId } from '@/domain/value-objects/user-id.vo';

// Repository interfaces
import { IUserRepository } from '@/domain/repositories/user.repository.interface';

// Service interfaces
import { ITokenService } from '@/application/services/token.service.interface';
import { IHashService } from '@/application/services/hash.service.interface';

// Audit service interface
import { IAuditService } from '@/modules/audit.module';

export class MockFactories {
  /**
   * Create a mock user repository
   */
  static createMockUserRepository(): Partial<IUserRepository> {
    return {
      save: jest.fn().mockResolvedValue(MockFactories.createMockUser()),
      findById: jest.fn().mockResolvedValue(MockFactories.createMockUser()),
      findByEmail: jest.fn().mockResolvedValue(MockFactories.createMockUser()),
      findMany: jest.fn().mockResolvedValue({
        users: [MockFactories.createMockUser()],
        total: 1,
        hasMore: false,
      }),
      delete: jest.fn().mockResolvedValue(undefined),
    };
  }

  /**
   * Create a mock JWT service
   */
  static createMockJwtService(): Partial<ITokenService> {
    return {
      generateAccessToken: jest.fn().mockResolvedValue('mock-access-token'),
      generateRefreshToken: jest.fn().mockResolvedValue('mock-refresh-token'),
      generateTokenPair: jest.fn().mockResolvedValue({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 900,
        tokenType: 'Bearer',
      }),
      validateAccessToken: jest.fn().mockResolvedValue({
        userId: 'user-id',
        email: 'test@example.com',
        roles: ['user'],
        emailVerified: true,
      }),
      validateRefreshToken: jest.fn().mockResolvedValue({
        userId: 'user-id',
        email: 'test@example.com',
        roles: ['user'],
        emailVerified: true,
      }),
      blacklistToken: jest.fn().mockResolvedValue(undefined),
      isTokenBlacklisted: jest.fn().mockResolvedValue(false),
      getTokenExpirationTime: jest.fn().mockReturnValue(900),
      extractTokenFromHeader: jest.fn().mockReturnValue('mock-token'),
    };
  }

  /**
   * Create a mock hash service
   */
  static createMockHashService(): Partial<IHashService> {
    return {
      hash: jest.fn().mockResolvedValue('hashed-password'),
      compare: jest.fn().mockResolvedValue(true),
    };
  }

  /**
   * Create a mock audit service
   */
  static createMockAuditService(): Partial<IAuditService> {
    return {
      logAction: jest.fn().mockResolvedValue(undefined),
      logError: jest.fn().mockResolvedValue(undefined),
      logSecurityEvent: jest.fn().mockResolvedValue(undefined),
    };
  }

  /**
   * Create a mock use case
   */
  static createMockUseCase(): { execute: () => Promise<unknown> } {
    return {
      execute: jest.fn().mockResolvedValue({}),
    };
  }

  /**
   * Create a mock user entity
   */
  static createMockUser(): User {
    // For testing purposes, create a minimal mock
    // In integration tests, use proper User entity construction
    const mockUser = {} as User;
    
    // Add minimal properties for testing
    Object.assign(mockUser, {
      id: UserId.generate(),
      email: Email.create('test@example.com'),
      isActive: true,
      emailVerified: true,
      roles: [Role.USER],
    });
    
    return mockUser;
  }

  /**
   * Create test data builders for various entities
   */
  static createUserTestDataBuilder() {
    return {
      withEmail: (email: string) => ({
        email: Email.create(email),
        roles: [Role.USER],
        isActive: true,
        emailVerified: false,
      }),
      withRoles: (roles: Role[]) => ({
        email: Email.create('test@example.com'),
        roles,
        isActive: true,
        emailVerified: false,
      }),
    };
  }
}
