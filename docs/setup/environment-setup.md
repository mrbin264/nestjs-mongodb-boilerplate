# Environment Setup Guide

This guide covers the environment configuration for different deployment stages: development, staging, and production.

## Overview

The application uses environment variables for configuration management with different settings for each environment:

- **Development**: Local development with debugging enabled
- **Staging**: Pre-production testing environment
- **Production**: Live production environment with optimized settings

## Environment Files

### File Structure
```
.env.template          # Template with all available variables
.env.development       # Development environment
.env.staging          # Staging environment  
.env.production       # Production environment
.env.test             # Test environment (for automated tests)
```

### Environment File Priority
1. `.env.[NODE_ENV]` (e.g., `.env.production`)
2. `.env.local` (loaded for all environments except test)
3. `.env`
4. Built-in defaults

## Required Environment Variables

### Application Configuration

| Variable | Description | Development | Staging | Production |
|----------|-------------|-------------|---------|------------|
| `NODE_ENV` | Environment mode | `development` | `staging` | `production` |
| `APP_NAME` | Application name | `Boilerplate API (Dev)` | `Boilerplate API (Staging)` | `Boilerplate API` |
| `APP_PORT` | Server port | `3000` | `3000` | `3000` |

### Database Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MongoDB connection string | `mongodb://username:password@host:port/database` |
| `MONGO_ROOT_USERNAME` | MongoDB root username | `root` |
| `MONGO_ROOT_PASSWORD` | MongoDB root password | `secure_password` |
| `MONGO_INITDB_DATABASE` | Initial database name | `boilerplate` |

### JWT Configuration

| Variable | Description | Development | Production |
|----------|-------------|-------------|------------|
| `JWT_SECRET` | JWT signing secret | `dev-jwt-secret` | `super-secure-256-bit-secret` |
| `JWT_EXPIRES_IN` | Access token expiration | `15m` | `15m` |
| `REFRESH_TOKEN_SECRET` | Refresh token secret | `dev-refresh-secret` | `super-secure-refresh-secret` |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token expiration | `7d` | `7d` |

### Redis Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `REDIS_PASSWORD` | Redis password | `secure_redis_password` |

### Email Configuration

| Variable | Description | Development | Production |
|----------|-------------|-------------|------------|
| `EMAIL_FROM` | Sender email address | `dev@localhost` | `noreply@company.com` |
| `EMAIL_HOST` | SMTP host | `localhost` | `smtp.provider.com` |
| `EMAIL_PORT` | SMTP port | `1025` | `587` |
| `EMAIL_USER` | SMTP username | `testuser` | `smtp_username` |
| `EMAIL_PASS` | SMTP password | `testpass` | `smtp_password` |
| `EMAIL_SECURE` | Use TLS | `false` | `true` |

### Security Configuration

| Variable | Description | Development | Production |
|----------|-------------|-------------|------------|
| `BCRYPT_ROUNDS` | Password hashing rounds | `10` | `12` |
| `THROTTLE_TTL` | Rate limit window (seconds) | `60` | `60` |
| `THROTTLE_LIMIT` | Requests per window | `100` | `100` |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:3000` | `https://app.company.com` |

### Logging Configuration

| Variable | Description | Development | Production |
|----------|-------------|-------------|------------|
| `LOG_LEVEL` | Logging level | `debug` | `info` |
| `LOG_FORMAT` | Log format | `pretty` | `json` |

## Environment-Specific Setup

### Development Environment

Create `.env.development`:

```bash
# Application Configuration
NODE_ENV=development
APP_NAME=Boilerplate API (Dev)
APP_PORT=3000

# Database Configuration
DATABASE_URL=mongodb://localhost:27017/boilerplate-dev
MONGO_ROOT_USERNAME=root
MONGO_ROOT_PASSWORD=devpassword
MONGO_INITDB_DATABASE=boilerplate-dev

# JWT Configuration
JWT_SECRET=development-jwt-secret-key-not-for-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=development-refresh-secret-key-not-for-production
REFRESH_TOKEN_EXPIRES_IN=7d

# Redis Configuration
REDIS_URL=redis://localhost:6379/0
REDIS_PASSWORD=

# Email Configuration (MailHog for local testing)
EMAIL_FROM=dev@localhost
EMAIL_HOST=localhost
EMAIL_PORT=1025
EMAIL_USER=
EMAIL_PASS=
EMAIL_SECURE=false

# Security Configuration
BCRYPT_ROUNDS=10
THROTTLE_TTL=60
THROTTLE_LIMIT=1000
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Logging Configuration
LOG_LEVEL=debug
LOG_FORMAT=pretty

# Development-specific
HOT_RELOAD=true
SWAGGER_ENABLED=true
```

**Setup Steps:**

1. Copy the template:
   ```bash
   cp .env.template .env.development
   ```

2. Start local services:
   ```bash
   docker-compose up -d
   ```

3. Install MailHog for email testing:
   ```bash
   docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
   ```

### Staging Environment

Create `.env.staging`:

```bash
# Application Configuration
NODE_ENV=staging
APP_NAME=Boilerplate API (Staging)
APP_PORT=3000

# Database Configuration
DATABASE_URL=mongodb://username:password@staging-db:27017/boilerplate-staging
MONGO_ROOT_USERNAME=root
MONGO_ROOT_PASSWORD=staging_secure_password
MONGO_INITDB_DATABASE=boilerplate-staging

# JWT Configuration
JWT_SECRET=staging-jwt-secret-key-256-bits-minimum-length
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=staging-refresh-secret-key-256-bits-minimum-length
REFRESH_TOKEN_EXPIRES_IN=7d

# Redis Configuration
REDIS_URL=redis://staging-redis:6379/0
REDIS_PASSWORD=staging_redis_password

# Email Configuration (Mailtrap for staging)
EMAIL_FROM=staging@company.com
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=mailtrap_username
EMAIL_PASS=mailtrap_password
EMAIL_SECURE=false

# Security Configuration
BCRYPT_ROUNDS=12
THROTTLE_TTL=60
THROTTLE_LIMIT=200
CORS_ORIGIN=https://staging.company.com

# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=json

# Staging-specific
SWAGGER_ENABLED=true
DEBUG_MODE=false
```

**Setup Steps:**

1. Configure staging database and Redis
2. Set up email testing service (Mailtrap recommended)
3. Generate secure secrets:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

### Production Environment

Create `.env.production`:

```bash
# Application Configuration
NODE_ENV=production
APP_NAME=Boilerplate API
APP_PORT=3000

# Database Configuration
DATABASE_URL=mongodb://username:password@prod-cluster:27017/boilerplate?ssl=true&replicaSet=prod-rs
MONGO_ROOT_USERNAME=root
MONGO_ROOT_PASSWORD=super_secure_production_password
MONGO_INITDB_DATABASE=boilerplate

# JWT Configuration
JWT_SECRET=production-jwt-secret-key-must-be-256-bits-minimum-never-share
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=production-refresh-secret-key-must-be-256-bits-minimum-never-share
REFRESH_TOKEN_EXPIRES_IN=7d

# Redis Configuration
REDIS_URL=redis://prod-redis:6379/0?ssl=true
REDIS_PASSWORD=super_secure_redis_password

# Email Configuration
EMAIL_FROM=noreply@company.com
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=sendgrid_api_key
EMAIL_SECURE=true

# Security Configuration
BCRYPT_ROUNDS=12
THROTTLE_TTL=60
THROTTLE_LIMIT=100
CORS_ORIGIN=https://app.company.com

# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=json

# Production-specific
SWAGGER_ENABLED=false
DEBUG_MODE=false
HEALTH_CHECK_TIMEOUT=30s
```

**Setup Steps:**

1. Use managed database services (MongoDB Atlas, AWS DocumentDB)
2. Use managed Redis (AWS ElastiCache, Redis Labs)
3. Configure production email service (SendGrid, AWS SES)
4. Generate cryptographically secure secrets
5. Enable SSL/TLS for all connections
6. Set up monitoring and alerting

## Secret Management

### Development

Store secrets in `.env.development` file (never commit to git).

### Staging/Production

Use secure secret management:

#### Option 1: Docker Secrets
```yaml
# docker-compose.prod.yml
services:
  app:
    secrets:
      - jwt_secret
      - db_password
    environment:
      - JWT_SECRET_FILE=/run/secrets/jwt_secret

secrets:
  jwt_secret:
    external: true
  db_password:
    external: true
```

#### Option 2: HashiCorp Vault
```bash
# Store secrets
vault kv put secret/boilerplate/prod \
  jwt_secret="your-secret" \
  db_password="your-password"

# Retrieve in application
JWT_SECRET=$(vault kv get -field=jwt_secret secret/boilerplate/prod)
```

#### Option 3: AWS Secrets Manager
```bash
# Store secret
aws secretsmanager create-secret \
  --name "boilerplate/prod/jwt_secret" \
  --secret-string "your-secret"

# Retrieve in application startup
JWT_SECRET=$(aws secretsmanager get-secret-value \
  --secret-id "boilerplate/prod/jwt_secret" \
  --query SecretString --output text)
```

## Environment Validation

The application validates environment variables on startup:

```typescript
// config/app.config.ts
export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  name: process.env.APP_NAME || 'Boilerplate API',
  port: parseInt(process.env.APP_PORT || '3000', 10),
}));
```

### Required Variables Check

```typescript
const requiredVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'REFRESH_TOKEN_SECRET',
];

requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});
```

## Configuration Best Practices

### Security
1. **Never commit secrets to version control**
2. **Use different secrets for each environment**
3. **Rotate secrets regularly**
4. **Use secure secret storage in production**
5. **Validate environment variables on startup**

### Maintenance
1. **Document all environment variables**
2. **Use templates for easy setup**
3. **Validate configurations in CI/CD pipeline**
4. **Monitor configuration changes**

### Development
1. **Use consistent variable names across environments**
2. **Provide sensible defaults where possible**
3. **Use type validation for numeric values**
4. **Group related variables together**

## Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check DATABASE_URL format
echo $DATABASE_URL

# Test connection
mongosh $DATABASE_URL --eval "db.runCommand('ping')"
```

#### JWT Token Issues
```bash
# Verify JWT secret length (should be 32+ characters)
echo $JWT_SECRET | wc -c

# Generate new secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Redis Connection Failed
```bash
# Test Redis connection
redis-cli -u $REDIS_URL ping
```

#### Email Service Issues
```bash
# Test SMTP connection
telnet $EMAIL_HOST $EMAIL_PORT
```

### Environment Loading Debug

Add debug logging to see which environment file is loaded:

```bash
DEBUG=config:* npm start
```

### Variable Override Priority

Environment variables are loaded in this order (last wins):
1. Built-in defaults
2. `.env`
3. `.env.local`
4. `.env.[NODE_ENV]`
5. System environment variables
