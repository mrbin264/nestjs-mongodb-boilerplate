// Integration test setup with MongoDB Memory Server
import 'reflect-metadata';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connect, Connection } from 'mongoose';

let mongoServer: MongoMemoryServer;
let mongoConnection: Connection;

// Global setup for integration tests
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-integration-testing';
  process.env.JWT_EXPIRES_IN = '15m';
  process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';
  process.env.EMAIL_FROM = 'test@example.com';
  process.env.THROTTLE_TTL = '60';
  process.env.THROTTLE_LIMIT = '10';

  // Start MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create({
    instance: {
      dbName: 'integration-test-db',
    },
  });
  
  const mongoUri = mongoServer.getUri();
  process.env.DATABASE_URL = mongoUri;
  
  // Connect to the in-memory database
  mongoConnection = (await connect(mongoUri)).connection;
  
  console.log('Integration test database setup complete');
}, 60000);

// Global cleanup for integration tests
afterAll(async () => {
  if (mongoConnection) {
    await mongoConnection.dropDatabase();
    await mongoConnection.close();
  }
  
  if (mongoServer) {
    await mongoServer.stop();
  }
  
  console.log('Integration test database cleanup complete');
}, 60000);

// Clean database between tests
beforeEach(async () => {
  if (mongoConnection && mongoConnection.readyState === 1 && mongoConnection.db) {
    const collections = await mongoConnection.db.collections();
    
    // Drop all collections
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
});

// Mock console methods in integration tests to reduce noise
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn((message) => {
    // Only show actual errors, not expected test errors
    if (typeof message === 'string' && !message.includes('Expected error')) {
      originalConsoleError(message);
    }
  });
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test timeout for integration tests
jest.setTimeout(30000);

// Export utilities for integration tests
export { mongoConnection, mongoServer };
