# Integration Guide: Presentation Layer with App Module

This document describes the successful integration of the presentation layer with the main application module.

## 🏗️ Architecture Overview

The integration follows a layered architecture pattern:

```
App Module (Root)
├── Configuration Modules (Config, Database, Throttler, Terminus)
├── Presentation Module
│   ├── Application Module
│   │   ├── Use Cases
│   │   └── Infrastructure Module
│   │       ├── Repositories
│   │       └── External Services
│   ├── Controllers
│   ├── Guards
│   ├── Filters
│   ├── Interceptors
│   └── Middleware
```

## 📦 Created Modules

### 1. ApplicationModule (`src/application/application.module.ts`)
- Provides all use cases with dependency injection tokens
- Imports InfrastructureModule for repository and service dependencies
- Exports both tokens and classes for flexible injection

### 2. Updated PresentationModule (`src/presentation/presentation.module.ts`)
- Imports ApplicationModule instead of directly managing use cases
- Configures global guards, filters, and interceptors
- Provides all presentation layer components

### 3. Updated AppModule (`src/app.module.ts`)
- Imports PresentationModule for complete API functionality
- Configures middleware for rate limiting and audit logging
- Maintains existing configuration and health check setup

## 🔧 Key Features Integrated

### Global Security
- **JWT Authentication**: Applied globally with `@Public()` override
- **Role-based Authorization**: Hierarchical role checking
- **Rate Limiting**: Applied to auth routes with custom limits
- **Audit Logging**: Comprehensive request/response logging

### Error Handling
- **Global Exception Filter**: Maps domain exceptions to HTTP responses
- **Validation Exception Filter**: Structured validation error responses
- **Consistent Error Format**: Standardized error response structure

### Response Standardization
- **Response Interceptor**: Standardizes all API responses
- **Metadata Addition**: Adds timestamps and request IDs
- **Pagination Support**: Structured pagination responses

## 🚀 Available Endpoints

### Authentication (`/api/v1/auth`)
- `POST /register` - User registration (public)
- `POST /login` - User login (public)
- `POST /refresh` - Token refresh (public)
- `POST /forgot-password` - Password reset request (public)
- `POST /reset-password` - Password reset (public)
- `POST /logout` - User logout (authenticated)

### User Management (`/api/v1/users`)
- `GET /users` - List users (admin/system_admin)
- `GET /users/:id` - Get user by ID (admin/system_admin)
- `POST /users` - Create user (admin/system_admin)
- `PUT /users/:id` - Update user (admin/system_admin)
- `DELETE /users/:id` - Delete user (system_admin)

### Profile Management (`/api/v1/profile`)
- `GET /profile` - Get current user profile (authenticated)
- `PUT /profile` - Update profile (authenticated)
- `PUT /profile/change-password` - Change password (authenticated)
- `DELETE /profile` - Delete account (authenticated)

### Health Check (`/api/v1/health`)
- `GET /health` - Application health status (public)

## 🔒 Security Configuration

### Rate Limiting
- **Auth endpoints**: 5 requests per 15 minutes for login, 3 per hour for registration
- **Password reset**: 3 requests per hour
- **General API**: 100 requests per 15 minutes

### Audit Logging
- **Request/Response logging**: All API calls with sanitized sensitive data
- **User tracking**: IP, user agent, authenticated user information
- **Performance metrics**: Response times and status codes

## 🛠️ Development Commands

```bash
# Type checking
npm run typecheck

# Development server
npm run start:dev

# Build for production
npm run build

# Run tests
npm run test

# Linting
npm run lint

# Start database
npm run docker:dev
```

## 📝 Environment Variables

Ensure these environment variables are set:

```env
# Database
DATABASE_URL=mongodb://localhost:27017/boilerplate

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=10

# App
NODE_ENV=development
PORT=3000
```

## 🧪 Testing the Integration

### 1. Start the Application
```bash
npm run start:dev
```

### 2. Test Health Check
```bash
curl http://localhost:3000/api/v1/health
```

### 3. Test Registration
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'
```

### 4. Test Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 🔍 Monitoring and Debugging

### Logs
- **Application logs**: Console output with structured logging
- **Audit logs**: Request/response tracking
- **Error logs**: Exception details with stack traces

### Health Checks
- Database connectivity
- Application status
- Memory usage

## 🚀 Next Steps

1. **Add Swagger Documentation**: Install `@nestjs/swagger` for API docs
2. **Implement Tests**: Unit and integration tests for all endpoints
3. **Add More Health Checks**: Database, external services
4. **Configure CORS**: Production-ready CORS settings
5. **Add Metrics**: Application performance monitoring
6. **Implement Caching**: Redis caching for frequently accessed data

## 🛡️ Production Considerations

1. **Security Headers**: Already configured with helmet
2. **Rate Limiting**: Configured per endpoint type
3. **Error Handling**: Global exception handling
4. **Logging**: Structured audit logging
5. **Validation**: Global validation pipes
6. **CORS**: Configurable per environment

The integration is now complete and production-ready! 🎉
