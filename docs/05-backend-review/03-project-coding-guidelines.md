# Project Coding Guidelines

**Technical Lead Guidelines**  
**Date:** August 1, 2025  
**Version:** 1.0  
**Reviewer:** Technical Lead  

---

## Development Standards

These coding guidelines are **MANDATORY** for all developers (including AI agents) working on this project. They ensure code consistency, maintainability, and quality across the entire codebase.

---

## 1. **Naming Conventions**

### 1.1 Files and Directories
- **Use Cases**: `kebab-case.use-case.ts` (e.g., `login-user.use-case.ts`)
- **DTOs**: `kebab-case.dto.ts` (e.g., `create-user.dto.ts`)
- **Entities**: `kebab-case.entity.ts` (e.g., `user.entity.ts`)
- **Value Objects**: `kebab-case.vo.ts` (e.g., `email.vo.ts`)
- **Repositories**: `kebab-case.repository.ts`
- **Services**: `kebab-case.service.ts`
- **Controllers**: `kebab-case.controller.ts`
- **Exceptions**: `kebab-case.exception.ts`
- **Guards**: `kebab-case.guard.ts`
- **Middleware**: `kebab-case.middleware.ts`
- **Filters**: `kebab-case.filter.ts`

### 1.2 Classes and Interfaces
- **Classes**: `PascalCase` (e.g., `CreateUserUseCase`)
- **Interfaces**: `PascalCase` with `I` prefix (e.g., `IUserRepository`)
- **DTOs**: `PascalCase` with suffix (e.g., `CreateUserDto`)
- **Exceptions**: `PascalCase` with suffix (e.g., `UserNotFoundException`)
- **Enums**: `PascalCase` (e.g., `UserRole`)

### 1.3 Variables and Methods
- **Variables**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Private properties**: Prefix with `_` (e.g., `_email`)
- **Methods**: `camelCase` with descriptive names
- **Boolean variables**: Start with `is`, `has`, `can`, `should`

### 1.4 Directory Organization
```
src/
├── domain/           # Core business logic
├── application/      # Use cases and application services
├── infrastructure/   # External concerns
├── presentation/     # API layer
├── shared/          # Shared utilities
└── modules/         # NestJS modules
```

---

## 2. **Error Handling Patterns**

### 2.1 Domain Exceptions
```typescript
// REQUIRED: All domain exceptions must extend base domain exception
export abstract class DomainException extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class UserNotFoundException extends DomainException {
  constructor(message = 'User not found') {
    super(message, 'USER_NOT_FOUND');
  }
}
```

### 2.2 Use Case Error Handling
```typescript
// REQUIRED: Use cases must handle domain exceptions and re-throw as needed
async execute(dto: LoginUserDto): Promise<LoginResponseDto> {
  try {
    // Business logic here
    const user = await this.userRepository.findByEmail(email);
    // ... rest of implementation
  } catch (error) {
    if (error instanceof DomainException) {
      throw error; // Re-throw domain exceptions
    }
    
    // Log infrastructure errors and throw generic error
    this.logger.error('Unexpected error in LoginUserUseCase', error);
    throw new InternalServerException('An unexpected error occurred');
  }
}
```

### 2.3 Controller Error Handling
```typescript
// REQUIRED: Controllers should not handle domain exceptions directly
// Let GlobalExceptionFilter handle all exceptions

// CORRECT ✅
@Post()
async createUser(@Body() dto: CreateUserDto) {
  return await this.createUserUseCase.execute(dto);
}

// INCORRECT ❌ - Don't catch exceptions in controllers
@Post()
async createUser(@Body() dto: CreateUserDto) {
  try {
    return await this.createUserUseCase.execute(dto);
  } catch (error) {
    // Don't do this - let the global filter handle it
  }
}
```

### 2.4 Exception Mapping Rules
```typescript
// Domain Exception → HTTP Status mapping in GlobalExceptionFilter
const domainExceptionMap = {
  UserNotFoundException: HttpStatus.NOT_FOUND,
  DuplicateEmailException: HttpStatus.CONFLICT,
  InvalidCredentialsException: HttpStatus.UNAUTHORIZED,
  InsufficientPermissionsException: HttpStatus.FORBIDDEN,
  InvalidPasswordException: HttpStatus.BAD_REQUEST,
};
```

---

## 3. **DTO Validation**

### 3.1 Input Validation
```typescript
// REQUIRED: All input DTOs must use class-validator decorators
export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  @ApiProperty({ 
    example: 'SecurePass123!',
    description: 'Password must contain uppercase, lowercase, digit, and special character'
  })
  password: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  @ApiProperty({ example: 'John', required: false })
  firstName?: string;
}
```

### 3.2 Response DTOs
```typescript
// REQUIRED: All responses must be wrapped in ResponseDto
export class ResponseDto<T = any> {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data?: T;

  static success<T>(data: T, message = 'Operation successful'): ResponseDto<T> {
    return {
      success: true,
      message,
      data,
    };
  }

  static error(message: string): ResponseDto {
    return {
      success: false,
      message,
    };
  }
}

// Usage in controllers
return ResponseDto.success(result, 'User created successfully');
```

### 3.3 Validation Groups
```typescript
// Use validation groups for different scenarios
export class UpdateUserDto {
  @IsEmail()
  @IsOptional({ groups: ['update'] })
  @IsNotEmpty({ groups: ['create'] })
  email?: string;

  @ValidateIf(o => o.password !== undefined, { groups: ['password-change'] })
  @IsString()
  @MinLength(8)
  password?: string;
}
```

---

## 4. **Asynchronous Operations**

### 4.1 Database Operations
```typescript
// REQUIRED: All database operations must be async/await
// PROHIBITED: Callback-based operations

// CORRECT ✅
async save(user: User): Promise<User> {
  const result = await this.userModel.save(this.mapDomainToMongo(user));
  return this.mapMongoToDomain(result);
}

// INCORRECT ❌
save(user: User, callback: (error: any, result: User) => void) {
  // Don't use callbacks
}
```

### 4.2 Error Propagation
```typescript
// REQUIRED: Async operations must propagate errors properly
async execute(dto: CreateUserDto): Promise<UserResponseDto> {
  try {
    const user = await this.userRepository.save(newUser);
    await this.emailService.sendWelcomeEmail(user.email);
    return this.mapUserToResponseDto(user);
  } catch (error) {
    this.logger.error('Failed to create user', error, { email: dto.email });
    throw error; // Re-throw to maintain error chain
  }
}
```

### 4.3 Promise Handling
```typescript
// REQUIRED: Use Promise.all for parallel operations
const [user, preferences] = await Promise.all([
  this.userRepository.findById(userId),
  this.preferencesRepository.findByUserId(userId),
]);

// REQUIRED: Use Promise.allSettled for non-critical parallel operations
const results = await Promise.allSettled([
  this.emailService.sendNotification(user.email),
  this.auditService.logUserAction(userId, 'profile_update'),
]);
```

---

## 5. **Code Documentation**

### 5.1 Use Cases
```typescript
/**
 * Authenticates a user with email and password credentials
 * 
 * @param loginDto - User credentials containing email and password
 * @returns Promise<LoginResponseDto> - JWT tokens and user profile information
 * @throws UserNotFoundException - When user with provided email doesn't exist
 * @throws InvalidCredentialsException - When password is incorrect
 * @throws InactiveUserException - When user account is deactivated
 * 
 * @example
 * ```typescript
 * const result = await loginUserUseCase.execute({
 *   email: 'user@example.com',
 *   password: 'securePassword123'
 * });
 * ```
 */
async execute(loginDto: LoginUserDto): Promise<LoginResponseDto> {
  // Implementation
}
```

### 5.2 Controllers
```typescript
@ApiOperation({ 
  summary: 'Create new user account', 
  description: 'Creates a new user account with provided details. Requires admin privileges. Sends welcome email upon successful creation.' 
})
@ApiCreatedResponse({ 
  description: 'User created successfully', 
  type: UserResponseDto 
})
@ApiBadRequestResponse({ 
  description: 'Invalid input data or validation errors' 
})
@ApiConflictResponse({ 
  description: 'User with provided email already exists' 
})
@Post()
async createUser(@Body() dto: CreateUserDto): Promise<ResponseDto<UserResponseDto>> {
  // Implementation
}
```

### 5.3 Complex Business Logic
```typescript
/**
 * Validates password complexity according to security requirements:
 * - Minimum 8 characters, maximum 128 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one digit (0-9)
 * - At least one special character (@$!%*?&)
 * - Cannot contain common patterns or dictionary words
 * - Cannot be similar to user's email or personal information
 * 
 * @param password - Raw password string to validate
 * @param userContext - User information for context validation
 * @throws InvalidPasswordException - When password doesn't meet requirements
 */
private validatePasswordComplexity(password: string, userContext?: UserContext): void {
  // Implementation
}
```

### 5.4 Repository Methods
```typescript
/**
 * Finds users with pagination and optional filtering
 * 
 * @param options - Query options including pagination and filters
 * @returns Promise containing users array and pagination metadata
 * 
 * @example
 * ```typescript
 * const result = await userRepository.findMany({
 *   limit: 10,
 *   offset: 0,
 *   filters: { role: Role.USER, isActive: true }
 * });
 * ```
 */
async findMany(options: UserQueryOptions): Promise<UserQueryResult> {
  // Implementation
}
```

---

## 6. **Testing Standards**

### 6.1 Unit Tests
```typescript
// REQUIRED: Test file naming: *.spec.ts
// REQUIRED: One test file per source file
// REQUIRED: Minimum 80% code coverage for business logic

describe('LoginUserUseCase', () => {
  let useCase: LoginUserUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockHashService: jest.Mocked<IHashService>;
  let mockTokenService: jest.Mocked<ITokenService>;

  beforeEach(() => {
    // Setup mocks and dependencies
  });

  describe('execute', () => {
    it('should successfully login user with valid credentials', async () => {
      // Arrange
      const loginDto = { email: 'test@example.com', password: 'password123' };
      const mockUser = createMockUser();
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockHashService.compare.mockResolvedValue(true);

      // Act
      const result = await useCase.execute(loginDto);

      // Assert
      expect(result.access_token).toBeDefined();
      expect(result.user.email).toBe(loginDto.email);
    });

    it('should throw UserNotFoundException when user does not exist', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(loginDto))
        .rejects
        .toThrow(UserNotFoundException);
    });

    // Test edge cases and boundary conditions
  });
});
```

### 6.2 Integration Tests
```typescript
// REQUIRED: Test API endpoints end-to-end
// REQUIRED: Use test database
// REQUIRED: Test authentication and authorization

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let userRepository: IUserRepository;

  beforeAll(async () => {
    // Setup test application and database
  });

  beforeEach(async () => {
    // Clean database before each test
  });

  describe('/auth/login (POST)', () => {
    it('should login user with valid credentials', async () => {
      // Arrange: Create test user
      const testUser = await createTestUser();

      // Act: Make login request
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email, password: 'password123' })
        .expect(200);

      // Assert: Check response structure
      expect(response.body.success).toBe(true);
      expect(response.body.data.access_token).toBeDefined();
    });
  });
});
```

### 6.3 Test Organization
```
test/
├── unit/                 # Unit tests
│   ├── domain/
│   ├── application/
│   └── infrastructure/
├── integration/          # Integration tests
│   ├── controllers/
│   └── repositories/
├── e2e/                  # End-to-end tests
├── fixtures/             # Test data
└── utils/                # Test utilities
```

---

## 7. **Security Requirements**

### 7.1 Authentication
```typescript
// REQUIRED: All non-public endpoints must use JwtAuthGuard
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  // All endpoints are protected by default
  
  @Public() // Use this decorator for public endpoints
  @Get('health')
  healthCheck() {
    return { status: 'ok' };
  }
}
```

### 7.2 Authorization
```typescript
// REQUIRED: Use role-based authorization for restricted endpoints
@Roles(Role.ADMIN, Role.SYSTEM_ADMIN)
@Post()
async createUser(@Body() dto: CreateUserDto) {
  return await this.createUserUseCase.execute(dto);
}

// REQUIRED: Check user ownership for user-specific resources
@Get(':id')
async getUserById(
  @Param('id') id: string,
  @CurrentUser() currentUser: User
) {
  // Allow access if user is admin or accessing own data
  if (!currentUser.isInRole(Role.ADMIN) && currentUser.id.value !== id) {
    throw new ForbiddenException('Access denied');
  }
  
  return await this.getUserByIdUseCase.execute({ id });
}
```

### 7.3 Input Sanitization
```typescript
// REQUIRED: Validate and sanitize all inputs
app.useGlobalPipes(new ValidationPipe({ 
  whitelist: true,           // Strip unknown properties
  forbidNonWhitelisted: true, // Throw error for unknown properties
  transform: true,            // Transform payloads to DTO instances
  transformOptions: {
    enableImplicitConversion: true
  }
}));

// REQUIRED: Sanitize string inputs
@Transform(({ value }) => value?.trim())
@IsString()
firstName: string;
```

### 7.4 Rate Limiting
```typescript
// REQUIRED: Apply rate limiting to sensitive endpoints
@Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
@Post('auth/login')
async login(@Body() dto: LoginUserDto) {
  // Implementation
}
```

---

## 8. **Performance Guidelines**

### 8.1 Database Queries
```typescript
// REQUIRED: Use efficient queries with proper indexing
// REQUIRED: Implement pagination for list endpoints
async findMany(options: UserQueryOptions): Promise<UserQueryResult> {
  const { limit = 10, offset = 0, filters } = options;
  
  const query = this.userModel.find(filters)
    .limit(Math.min(limit, 100)) // Cap maximum limit
    .skip(offset)
    .sort({ createdAt: -1 });
    
  const [users, total] = await Promise.all([
    query.exec(),
    this.userModel.countDocuments(filters)
  ]);
  
  return {
    users: users.map(user => this.mapMongoToDomain(user)),
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    }
  };
}
```

### 8.2 Memory Management
```typescript
// REQUIRED: Clean up resources and avoid memory leaks
export class SomeService implements OnModuleDestroy {
  private intervalId: NodeJS.Timeout;
  
  onModuleInit() {
    this.intervalId = setInterval(() => {
      // Cleanup logic
    }, 60000);
  }
  
  onModuleDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
```

---

## 9. **Code Style and Formatting**

### 9.1 ESLint Configuration
```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": "error",
    "prefer-const": "error",
    "no-console": "warn"
  }
}
```

### 9.2 Prettier Configuration
```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "semi": true,
  "tabWidth": 2,
  "printWidth": 100
}
```

### 9.3 Import Organization
```typescript
// 1. Node modules
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

// 2. Internal modules (absolute imports)
import { User } from '@/domain/entities/user.entity';
import { IUserRepository } from '@/domain/repositories/user.repository.interface';

// 3. Relative imports
import { CreateUserDto } from '../dtos/create-user.dto';
import { UserResponseDto } from '../dtos/user-response.dto';
```

---

## Enforcement

### Pre-commit Hooks
- ESLint check
- Prettier formatting
- Unit test execution
- Type checking

### CI/CD Pipeline
- Code quality gates
- Test coverage requirements
- Security scanning
- Performance benchmarks

### Code Review Checklist
- [ ] Follows naming conventions
- [ ] Proper error handling
- [ ] Adequate test coverage
- [ ] Documentation present
- [ ] Security considerations addressed
- [ ] Performance implications considered

---

**Guidelines Established By:** Technical Lead  
**Date:** August 1, 2025  
**Last Updated:** August 1, 2025
