// E2E test setup with test application
import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connect, Connection } from 'mongoose';
import * as request from 'supertest';
import helmet from 'helmet';

// Import the main app module
import { AppModule } from '@/modules/app.module';

let app: INestApplication;
let mongoServer: MongoMemoryServer;
let mongoConnection: Connection;
let moduleRef: TestingModule;

// Global setup for E2E tests
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-e2e-testing';
  process.env.JWT_EXPIRES_IN = '15m';
  process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';
  process.env.EMAIL_FROM = 'test@example.com';
  process.env.THROTTLE_TTL = '60';
  process.env.THROTTLE_LIMIT = '100'; // Higher limit for E2E tests
  process.env.PORT = '0'; // Use random port

  // Start MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create({
    instance: {
      dbName: 'e2e-test-db',
    },
  });
  
  const mongoUri = mongoServer.getUri();
  process.env.DATABASE_URL = mongoUri;
  
  // Connect to the in-memory database
  mongoConnection = (await connect(mongoUri)).connection;
  
  // Create the testing module
  moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  // Create the application
  app = moduleRef.createNestApplication();
  
  // Apply the same middleware as in main.ts
  app.use(helmet());
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Enable CORS for testing
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Set global prefix
  app.setGlobalPrefix('api/v1');

  await app.init();
  
  console.log('E2E test application setup complete');
}, 60000);

// Global cleanup for E2E tests
afterAll(async () => {
  if (app) {
    await app.close();
  }
  
  if (moduleRef) {
    await moduleRef.close();
  }
  
  if (mongoConnection) {
    await mongoConnection.dropDatabase();
    await mongoConnection.close();
  }
  
  if (mongoServer) {
    await mongoServer.stop();
  }
  
  console.log('E2E test application cleanup complete');
}, 60000);

// Clean database between tests
beforeEach(async () => {
  if (mongoConnection && mongoConnection.readyState === 1 && mongoConnection.db) {
    const collections = await mongoConnection.db.collections();
    
    // Drop all collections except system collections
    for (const collection of collections) {
      if (!collection.collectionName.startsWith('system.')) {
        await collection.deleteMany({});
      }
    }
  }
});

// Mock console methods in E2E tests to reduce noise
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

beforeAll(() => {
  console.error = jest.fn((message) => {
    // Only show actual errors, not expected test errors
    if (typeof message === 'string' && !message.includes('Expected error') && !message.includes('Test')) {
      originalConsoleError(message);
    }
  });
  console.warn = jest.fn();
  console.log = jest.fn((message) => {
    // Only show important logs
    if (typeof message === 'string' && (message.includes('test') || message.includes('Test'))) {
      originalConsoleLog(message);
    }
  });
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
});

// Global test timeout for E2E tests
jest.setTimeout(60000);

// Helper functions for E2E tests
export const getApp = () => app;
export const getRequest = () => request(app.getHttpServer());

// Authentication helpers
export const registerUser = async (userData: Record<string, any> = {}): Promise<request.Response> => {
  const defaultUserData = {
    email: 'test@example.com',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
  };
  
  return getRequest()
    .post('/api/v1/auth/register')
    .send({ ...defaultUserData, ...userData });
};

export const loginUser = async (credentials: Record<string, any> = {}): Promise<request.Response> => {
  const defaultCredentials = {
    email: 'test@example.com',
    password: 'TestPassword123!',
  };
  
  return getRequest()
    .post('/api/v1/auth/login')
    .send({ ...defaultCredentials, ...credentials });
};

export const getAuthToken = async (userData: Record<string, any> = {}, credentials: Record<string, any> = {}): Promise<string> => {
  // Register user first
  await registerUser(userData);
  
  // Login to get token
  const loginResponse = await loginUser(credentials);
  
  if (loginResponse.status === 200 || loginResponse.status === 201) {
    return loginResponse.body.access_token;
  }
  
  throw new Error(`Failed to get auth token: ${loginResponse.status}`);
};

export const makeAuthenticatedRequest = (token: string) => {
  return {
    get: (url: string) => getRequest().get(url).set('Authorization', `Bearer ${token}`),
    post: (url: string) => getRequest().post(url).set('Authorization', `Bearer ${token}`),
    put: (url: string) => getRequest().put(url).set('Authorization', `Bearer ${token}`),
    patch: (url: string) => getRequest().patch(url).set('Authorization', `Bearer ${token}`),
    delete: (url: string) => getRequest().delete(url).set('Authorization', `Bearer ${token}`),
  };
};

// Test data helpers
export const createTestUser = (overrides: Record<string, any> = {}) => ({
  email: 'test@example.com',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User',
  ...overrides,
});

export const createAdminUser = (overrides: Record<string, any> = {}) => ({
  email: 'admin@example.com',
  password: 'AdminPassword123!',
  firstName: 'Admin',
  lastName: 'User',
  roles: ['admin'],
  ...overrides,
});

// Export connection and server for advanced usage
export { mongoConnection, mongoServer };
