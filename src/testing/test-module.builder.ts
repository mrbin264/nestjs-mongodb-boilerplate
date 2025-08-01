import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

// Core modules
import { CoreModule } from '@/modules/core.module';
import { AuthModule } from '@/modules/auth.module';
import { UsersModule } from '@/modules/users.module';
import { AuditModule } from '@/modules/audit.module';

// Mock factories
import { MockFactories } from './mock-factories';

export class TestModuleBuilder {
  /**
   * Create a testing module for the CoreModule
   */
  static async createCoreTestingModule(): Promise<TestingModule> {
    return Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env.test'],
        }),
        MongooseModule.forRoot('mongodb://localhost:27017/test'),
      ],
    }).compile();
  }

  /**
   * Create a testing module for the AuthModule
   */
  static async createAuthTestingModule(): Promise<TestingModule> {
    return Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider('USER_REPOSITORY')
      .useValue(MockFactories.createMockUserRepository())
      .overrideProvider('JWT_SERVICE')
      .useValue(MockFactories.createMockJwtService())
      .overrideProvider('HASH_SERVICE')
      .useValue(MockFactories.createMockHashService())
      .compile();
  }

  /**
   * Create a testing module for the UsersModule
   */
  static async createUsersTestingModule(): Promise<TestingModule> {
    return Test.createTestingModule({
      imports: [UsersModule],
    })
      .overrideProvider('USER_REPOSITORY')
      .useValue(MockFactories.createMockUserRepository())
      .overrideProvider('CREATE_USER_USE_CASE')
      .useValue(MockFactories.createMockUseCase())
      .overrideProvider('UPDATE_USER_USE_CASE')
      .useValue(MockFactories.createMockUseCase())
      .overrideProvider('GET_USER_BY_ID_USE_CASE')
      .useValue(MockFactories.createMockUseCase())
      .overrideProvider('GET_USERS_USE_CASE')
      .useValue(MockFactories.createMockUseCase())
      .compile();
  }

  /**
   * Create a testing module for the AuditModule
   */
  static async createAuditTestingModule(): Promise<TestingModule> {
    return Test.createTestingModule({
      imports: [AuditModule],
    })
      .overrideProvider('AUDIT_SERVICE')
      .useValue(MockFactories.createMockAuditService())
      .compile();
  }

  /**
   * Create a full integration testing module
   */
  static async createIntegrationTestingModule(): Promise<TestingModule> {
    return Test.createTestingModule({
      imports: [
        CoreModule,
        AuthModule,
        UsersModule,
        AuditModule,
      ],
    })
      .overrideProvider('DATABASE_CONNECTION')
      .useValue('mongodb://localhost:27017/test-integration')
      .compile();
  }

  /**
   * Setup test application with all middleware and guards
   */
  static async setupTestApplication(module: TestingModule): Promise<INestApplication> {
    const app = module.createNestApplication();
    
    // Apply the same middleware and pipes as main application
    // (This will be used in integration tests)
    
    await app.init();
    return app;
  }

  /**
   * Cleanup test resources
   */
  static async cleanup(app: INestApplication): Promise<void> {
    if (app) {
      await app.close();
    }
  }
}
