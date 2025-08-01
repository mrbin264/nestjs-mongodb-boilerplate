# NestJS Module Configuration Documentation

This document explains the modular architecture implemented for the NestJS backend, following the specifications in Task 006.

## Architecture Overview

The application now follows a clean, modular architecture with proper separation of concerns:

```
src/
├── modules/                   # NestJS Module Organization
│   ├── core.module.ts         # Core infrastructure (global services)
│   ├── auth.module.ts         # Authentication and authorization
│   ├── users.module.ts        # User management features
│   ├── audit.module.ts        # Audit logging capabilities
│   ├── app.module.ts          # Main application module
│   └── index.ts               # Module exports
├── infrastructure/            # External services and data access
├── application/               # Use cases and business logic
├── domain/                    # Core business entities and rules
├── presentation/              # Controllers, guards, filters
└── testing/                   # Testing utilities and mocks
```

## Module Details

### 1. CoreModule (`src/modules/core.module.ts`)

**Purpose**: Global infrastructure services and configuration.

**Features**:
- Configuration management (environment variables, validation)
- Database connection (MongoDB with Mongoose)
- Global service registration
- Shared dependencies for other modules

**Configuration**:
- Marked as `@Global()` for application-wide availability
- Loads configuration from multiple sources (`.env`, `.env.development`)
- Validates environment variables on startup
- Configures MongoDB connection with proper options

### 2. AuthModule (`src/modules/auth.module.ts`)

**Purpose**: Authentication and authorization functionality.

**Dependencies**:
- CoreModule (for database and configuration)
- ApplicationModule (for authentication use cases)
- InfrastructureModule (for external services)

**Components**:
- AuthController (login, register, refresh, etc.)
- JWT Strategy (token validation)
- Local Strategy (username/password authentication)
- JWT configuration with proper secret validation

**Exports**:
- Authentication strategies
- Authentication guards
- Authentication use case tokens

### 3. UsersModule (`src/modules/users.module.ts`)

**Purpose**: User management functionality.

**Dependencies**:
- CoreModule (for database access)
- AuthModule (for authentication guards)
- ApplicationModule (for user management use cases)

**Components**:
- UsersController (CRUD operations for users)
- ProfileController (user profile management)

**Exports**:
- User management use case tokens

### 4. AuditModule (`src/modules/audit.module.ts`)

**Purpose**: Audit logging and security monitoring.

**Components**:
- AuditLoggingMiddleware
- IAuditService interface (for future implementation)

**Features**:
- Action logging
- Error logging
- Security event logging
- Prepared for future audit service implementation

### 5. AppModule (`src/modules/app.module.ts`)

**Purpose**: Root application module that orchestrates all feature modules.

**Global Configuration**:
- Global guards (JWT authentication, role-based authorization)
- Global filters (exception handling, validation)
- Global interceptors (response transformation)
- Rate limiting configuration
- Health check endpoints

**Middleware Configuration**:
- Rate limiting for authentication routes
- Audit logging for all routes

## Dependency Injection Structure

### Repository Providers
```typescript
{
  provide: 'IUserRepository',
  useClass: UserRepository,
}
```

### Service Providers
```typescript
{
  provide: 'ITokenService',
  useClass: JwtTokenService,
}
```

### Use Case Providers
All use cases are registered with proper dependency injection tokens for flexible testing and implementation swapping.

## Global Application Configuration

### Security
- Helmet security headers
- CORS configuration
- JWT authentication as default guard
- Role-based authorization
- Rate limiting on sensitive endpoints

### Validation
- Global validation pipe with transformation
- Whitelist mode for security
- Forbidden non-whitelisted properties

### Error Handling
- Global exception filter
- Validation exception filter
- Structured error responses

## Testing Infrastructure

### TestModuleBuilder (`src/testing/test-module.builder.ts`)

Provides utilities for creating testing modules for each feature module:

- `createCoreTestingModule()`: For testing core infrastructure
- `createAuthTestingModule()`: For testing authentication features
- `createUsersTestingModule()`: For testing user management
- `createAuditTestingModule()`: For testing audit functionality
- `createIntegrationTestingModule()`: For full integration tests

### MockFactories (`src/testing/mock-factories.ts`)

Provides mock implementations for testing:

- Repository mocks
- Service mocks
- Entity builders
- Test data factories

### Usage Example
```typescript
describe('UsersController', () => {
  let module: TestingModule;
  let controller: UsersController;

  beforeEach(async () => {
    module = await TestModuleBuilder.createUsersTestingModule();
    controller = module.get<UsersController>(UsersController);
  });

  afterEach(async () => {
    await TestModuleBuilder.cleanup(module.createNestApplication());
  });
});
```

## Environment Configuration

### Required Environment Variables
- `DATABASE_URL`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token signing
- `JWT_EXPIRES_IN`: Token expiration time (default: 15m)
- `THROTTLE_TTL`: Rate limiting time window (default: 60s)
- `THROTTLE_LIMIT`: Rate limiting request count (default: 10)

### Configuration Validation
All environment variables are validated on application startup using Joi schema validation.

## Development Workflow

### Starting the Application
```bash
npm run start:dev
```

### Running Tests
```bash
npm run test          # Unit tests
npm run test:e2e      # Integration tests
npm run test:cov      # Test coverage
```

### Type Checking
```bash
npm run typecheck     # TypeScript compilation check
```

### Building
```bash
npm run build         # Production build
```

## Module Dependency Graph

```
AppModule
├── CoreModule (global infrastructure)
├── AuthModule
│   └── depends on: CoreModule, ApplicationModule, InfrastructureModule
├── UsersModule
│   └── depends on: CoreModule, AuthModule, ApplicationModule
└── AuditModule
    └── depends on: CoreModule, InfrastructureModule
```

## Benefits of This Architecture

1. **Separation of Concerns**: Each module has a single responsibility
2. **Testability**: Easy to mock dependencies and test in isolation
3. **Maintainability**: Clear module boundaries make code easier to maintain
4. **Scalability**: New features can be added as separate modules
5. **Reusability**: Modules can be reused across different applications
6. **Configuration Management**: Centralized configuration with validation

## Next Steps

This modular structure provides a solid foundation for:

- Task 007: Security Implementation (extend AuthModule and CoreModule)
- Task 008: Testing Implementation (use existing testing infrastructure)
- Task 009: Documentation and Deployment (build on this configuration)

The architecture is designed to be extensible and maintainable, following NestJS best practices and clean architecture principles.
