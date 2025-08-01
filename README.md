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

## 🔐 Security Features

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
