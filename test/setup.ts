// Global test setup for unit tests
import 'reflect-metadata';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Type } from '@nestjs/common';

// Jest globals setup
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toBeValidEmail(): R;
      toBeValidPassword(): R;
      toHaveTimestamp(): R;
    }
  }
}

// Custom Jest matchers
expect.extend({
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid email`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid email`,
        pass: false,
      };
    }
  },

  toBeValidPassword(received: string) {
    // Password should have at least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    const pass = passwordRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid password`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid password (8+ chars, uppercase, lowercase, number, special char)`,
        pass: false,
      };
    }
  },

  toHaveTimestamp(received: any) {
    const hasCreatedAt = received.createdAt instanceof Date;
    const hasUpdatedAt = received.updatedAt instanceof Date;
    const pass = hasCreatedAt && hasUpdatedAt;
    
    if (pass) {
      return {
        message: () => `expected object not to have timestamp fields`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected object to have createdAt and updatedAt timestamp fields`,
        pass: false,
      };
    }
  },
});

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'mongodb://localhost:27017/boilerplate-test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.JWT_EXPIRES_IN = '15m';
  process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';
  process.env.REDIS_URL = 'redis://localhost:6379/1';
  process.env.EMAIL_FROM = 'test@example.com';
  process.env.THROTTLE_TTL = '60';
  process.env.THROTTLE_LIMIT = '10';
});

// Mock console methods in tests to reduce noise
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(async () => {
  // Cleanup after all tests
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test timeout
jest.setTimeout(10000);

// Helper function to create testing module with common imports
export const createTestingModuleWithDatabase = async (moduleMetadata: {
  imports?: Type[];
  controllers?: Type[];
  providers?: Type[];
}) => {
  return Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env.test',
      }),
      MongooseModule.forRoot(process.env.DATABASE_URL || 'mongodb://localhost:27017/boilerplate-test'),
      ...(moduleMetadata.imports || []),
    ],
    controllers: moduleMetadata.controllers || [],
    providers: moduleMetadata.providers || [],
  }).compile();
};

// Mock data helpers
export const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  email: 'test@example.com',
  password: 'hashedPassword',
  roles: ['user'],
  profile: {
    firstName: 'Test',
    lastName: 'User',
  },
  emailVerified: true,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockAdmin = {
  ...mockUser,
  _id: '507f1f77bcf86cd799439012',
  email: 'admin@example.com',
  roles: ['admin'],
  profile: {
    firstName: 'Admin',
    lastName: 'User',
  },
};
