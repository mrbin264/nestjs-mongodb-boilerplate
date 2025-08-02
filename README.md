# Boilerplate Backend

A production-ready NestJS backend with Clean Architecture, MongoDB, and comprehensive authentication/authorization system.

## 🚀 Features

- **Clean Architecture**: Domain-driven design with clear separation of concerns
- **NestJS Framework**: Latest LTS version with TypeScript
- **MongoDB**: Database with Mongoose ODM
- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Security**: Helmet, rate limiting, input validation
- **Testing**: Jest with comprehensive test setup
- **Docker**: Development environment with MongoDB and Redis
- **Health Checks**: Built-in health monitoring
- **Configuration**: Environment-based configuration with validation

## 🏗️ Architecture

```
src/
├── domain/           # Core business logic and entities
├── application/      # Use cases and application services
├── infrastructure/   # External services and data access
├── presentation/     # Controllers and API layer
├── shared/          # Common utilities and types
└── modules/         # NestJS module organization
```

## 📋 Prerequisites

- Node.js (v18+)
- pnpm (v8+)
- Docker and Docker Compose
- MongoDB (if not using Docker)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd boilerplate-backend
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.template .env.development
   # Edit .env.development with your configuration
   ```

4. **Start development services**
   ```bash
   pnpm run docker:dev
   ```

5. **Run the application**
   ```bash
   pnpm run start:dev
   ```

The application will be available at:
- **API**: http://localhost:3000/api/v1
- **API Documentation**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api/v1/health

## 🐳 Docker Setup

The project includes a complete Docker setup for development:

```bash
# Start all services (MongoDB, Redis, Mongo Express)
pnpm run docker:dev

# Stop all services
pnpm run docker:down
```

### Services included:
- **MongoDB**: `localhost:27017`
- **Redis**: `localhost:6379`
- **Mongo Express**: `localhost:8081` (admin/admin123)

## 📝 Environment Variables

Copy `.env.template` to `.env.development` and configure:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Application port | `3000` |
| `DATABASE_URL` | MongoDB connection string | `mongodb://localhost:27017/boilerplate-dev` |
| `JWT_SECRET` | JWT signing secret | `change-in-production` |
| `JWT_EXPIRES_IN` | JWT expiration time | `15m` |
| `REFRESH_TOKEN_SECRET` | Refresh token secret | `change-in-production` |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token expiration | `7d` |
| `EMAIL_VERIFICATION_SECRET` | Email verification token secret | *falls back to JWT_SECRET* |
| `EMAIL_VERIFICATION_EXPIRES_IN` | Email verification expiration | `24h` |
| `PASSWORD_RESET_SECRET` | Password reset token secret | *falls back to JWT_SECRET* |
| `PASSWORD_RESET_EXPIRES_IN` | Password reset expiration | `1h` |
| `BCRYPT_SALT_ROUNDS` | Password hashing rounds | `12` |

## 🧪 Testing

```bash
# Unit tests
pnpm run test

# Watch mode
pnpm run test:watch

# Coverage
pnpm run test:cov

# E2E tests
pnpm run test:e2e
```

## 🔧 Code Quality

The project uses modern tooling for code quality:

- **ESLint 9.x**: Latest version with flat config format
- **TypeScript 5.3**: Stable version with excellent IDE support
- **Prettier**: Code formatting
- **Supertest 7.x**: Latest testing utilities

```bash
# Type checking
pnpm run typecheck

# Linting and auto-fix
pnpm run lint

# Code formatting
pnpm run format
```

## 🚀 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm run start` | Start production server |
| `pnpm run start:dev` | Start development server |
| `pnpm run start:debug` | Start debug server |
| `pnpm run build` | Build for production |
| `pnpm run lint` | Run ESLint |
| `pnpm run format` | Format with Prettier |
| `pnpm run docker:dev` | Start Docker services |
| `pnpm run docker:down` | Stop Docker services |

## 🔍 API Endpoints

### Health Check
- **GET** `/api/v1/health` - System health status

### Future Endpoints (to be implemented)
- **POST** `/api/v1/auth/register` - User registration
- **POST** `/api/v1/auth/login` - User login
- **POST** `/api/v1/auth/refresh` - Refresh token
- **GET** `/api/v1/users` - List users (admin)
- **GET** `/api/v1/profile` - Get user profile

## 🏛️ Clean Architecture Layers

### Domain Layer
- **Entities**: Core business objects
- **Value Objects**: Immutable domain concepts
- **Domain Services**: Business logic operations
- **Repository Interfaces**: Data access contracts
- **Domain Exceptions**: Business rule violations

### Application Layer
- **Use Cases**: Application-specific business rules
- **DTOs**: Data transfer objects
- **Application Services**: Application logic coordination
- **Interfaces**: External service contracts

### Infrastructure Layer
- **Database**: MongoDB repositories and schemas
- **External Services**: Email, file storage, etc.
- **Configuration**: Environment and service setup

### Presentation Layer
- **Controllers**: HTTP request handlers
- **Guards**: Authentication and authorization
- **Middleware**: Request/response processing
- **Filters**: Exception handling

## � Token Service Architecture

The application implements a dual-service approach for token management, following Clean Architecture principles:

### Service Separation

#### 1. Domain Layer - `IJwtService`
```typescript
// domain/services/jwt.service.interface.ts
interface IJwtService {
  generateTokenPair(userId: UserId, email: string, roles: string[]): TokenPair;
  generateAccessToken(userId: UserId, email: string, roles: string[]): string;
  generateRefreshToken(userId: UserId, email: string, roles: string[]): string;
  verifyAccessToken(token: string): JwtPayload;
  verifyRefreshToken(token: string): JwtPayload;
}
```

**Implementation**: `infrastructure/external-services/jwt/jwt.service.ts`
**Purpose**: Core JWT operations for authentication and authorization

#### 2. Application Layer - `ITokenService`
```typescript
// application/interfaces/token.service.interface.ts
interface ITokenService {
  generateAccessToken(payload: TokenPayload): string;
  generateRefreshToken(payload: TokenPayload): string;
  generateEmailVerificationToken(payload: EmailVerificationPayload): string;
  generatePasswordResetToken(payload: PasswordResetPayload): string;
  verifyEmailVerificationToken(token: string): Promise<EmailVerificationPayload>;
  verifyPasswordResetToken(token: string): Promise<PasswordResetPayload>;
}
```

**Implementation**: `infrastructure/external-services/token/token.service.ts`
**Purpose**: Application-specific token operations (email verification, password reset)

### Architecture Benefits

| Aspect | Domain `IJwtService` | Application `ITokenService` |
|--------|---------------------|----------------------------|
| **Responsibility** | Core JWT authentication | Application-specific tokens |
| **Dependencies** | Domain entities only | Application DTOs and payloads |
| **Token Types** | Access, Refresh | Email verification, Password reset |
| **Layer** | Domain layer | Application layer |
| **Reusability** | High (core JWT logic) | Application-specific |

### Dependency Injection Configuration

```typescript
// infrastructure/infrastructure.module.ts
providers: [
  {
    provide: JWT_SERVICE,
    useClass: TokenService, // Application-layer token service
  },
],
```

### Usage Examples

#### Domain Layer Usage (Core Authentication)
```typescript
// Direct IJwtService usage for core auth
@Injectable()
export class SomeAuthService {
  constructor(private jwtService: IJwtService) {}
  
  createTokens(user: User) {
    return this.jwtService.generateTokenPair(
      user.id, 
      user.email.value, 
      user.roles.map(r => r.value)
    );
  }
}
```

#### Application Layer Usage (Email Verification)
```typescript
// Use cases inject ITokenService for app-specific tokens
@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(JWT_SERVICE) private tokenService: ITokenService
  ) {}
  
  async execute(dto: RegisterUserDto) {
    // Generate email verification token
    const verificationToken = this.tokenService.generateEmailVerificationToken({
      userId: user.id.value,
      email: user.email.value,
    });
  }
}
```

### Token Types and Configuration

| Token Type | Secret Config | Expiration Config | Use Case |
|------------|---------------|-------------------|----------|
| **Access Token** | `auth.jwtSecret` | `auth.jwtExpiresIn` (15m) | API authentication |
| **Refresh Token** | `auth.refreshSecret` | `auth.refreshExpiresIn` (7d) | Token renewal |
| **Email Verification** | `auth.emailVerificationSecret`* | `auth.emailVerificationExpiresIn` (24h) | Email verification |
| **Password Reset** | `auth.passwordResetSecret`* | `auth.passwordResetExpiresIn` (1h) | Password reset |

*\* Falls back to `auth.jwtSecret` if not specified*

### Alternative Architecture Patterns

This dual-service approach was chosen over alternatives:

#### ❌ Single Unified Service
```typescript
// Not chosen - would violate single responsibility
class UnifiedTokenService implements IJwtService, ITokenService {
  // Too many responsibilities in one class
}
```

#### ❌ Composition Pattern
```typescript
// Not chosen - adds unnecessary complexity
class TokenService {
  constructor(private jwtService: IJwtService) {}
  // Wrapper around domain service
}
```

#### ✅ Current Approach: Specialized Services
- **Clear separation of concerns**
- **Layer-specific interfaces**  
- **Single responsibility principle**
- **Easy to test and maintain**

### Environment Configuration

Add these variables to your `.env` file:

```bash
# Core JWT (required)
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
REFRESH_SECRET=your-refresh-secret
REFRESH_EXPIRES_IN=7d

# Application tokens (optional - falls back to JWT_SECRET)
EMAIL_VERIFICATION_SECRET=your-email-verification-secret
EMAIL_VERIFICATION_EXPIRES_IN=24h
PASSWORD_RESET_SECRET=your-password-reset-secret
PASSWORD_RESET_EXPIRES_IN=1h
```

## �🔐 Security Features

- **Helmet**: Security headers
- **Rate Limiting**: Request throttling
- **CORS**: Cross-origin resource sharing
- **Input Validation**: Request data validation
- **Password Hashing**: bcrypt with configurable rounds
- **JWT Security**: Secure token generation and validation

## 📊 Monitoring

- **Health Checks**: Database connectivity and system metrics
- **Logging**: Structured application logging
- **Error Handling**: Global exception filters
- **Validation**: Request/response validation

## 📚 Documentation

### API Documentation
- **[Authentication Guide](docs/api/authentication.md)** - Complete authentication flow and examples
- **[User Management Guide](docs/api/user-management.md)** - User and profile management endpoints
- **[Interactive API Docs](http://localhost:3000/api/docs)** - Swagger UI (when running)

### Setup and Configuration
- **[Environment Setup Guide](docs/setup/environment-setup.md)** - Environment configuration for all stages
- **[Development Setup Script](scripts/setup-development.sh)** - Automated development environment setup

### Security and Production
- **[Production Security Checklist](docs/security/production-security.md)** - Complete security checklist
- **[Performance Optimization](docs/performance/optimization.md)** - Performance tuning guide
- **[Troubleshooting Guide](docs/troubleshooting/common-issues.md)** - Common issues and solutions

### Deployment
- **[Deployment Scripts](scripts/)** - Automated deployment and backup scripts
- **[Docker Configuration](docker-compose.prod.yml)** - Production Docker setup
- **[CI/CD Workflows](.github/workflows/)** - GitHub Actions for testing and deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the architecture guidelines

---

**Built with ❤️ using NestJS and Clean Architecture principles**
