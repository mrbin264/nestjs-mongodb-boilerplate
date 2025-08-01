# Troubleshooting Guide

This guide covers common issues and their solutions when working with the Boilerplate API.

## 🚀 Application Startup Issues

### Issue: Application fails to start

**Symptoms:**
- Application exits immediately
- Error messages about missing configuration
- Port binding errors

**Solutions:**

#### 1. Check Environment Variables
```bash
# Verify required environment variables are set
echo $DATABASE_URL
echo $JWT_SECRET
echo $REDIS_URL

# Check if .env file exists and is properly formatted
cat .env.development
```

#### 2. Verify Database Connection
```bash
# Test MongoDB connection
mongosh $DATABASE_URL --eval "db.runCommand('ping')"

# Check if MongoDB service is running
docker-compose ps mongodb
```

#### 3. Check Port Availability
```bash
# Check if port 3000 is in use
lsof -i :3000
netstat -tulpn | grep :3000

# Kill process using the port (if needed)
kill -9 $(lsof -ti:3000)
```

#### 4. Verify Dependencies
```bash
# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Check for peer dependency issues
pnpm list --prod
```

### Issue: "Module not found" errors

**Symptoms:**
- TypeScript compilation errors
- Cannot resolve module errors
- Path mapping issues

**Solutions:**

#### 1. Check TypeScript Configuration
```bash
# Verify tsconfig.json paths
cat tsconfig.json | grep -A 10 "paths"

# Clean and rebuild
rm -rf dist
pnpm run build
```

#### 2. Verify Module Imports
```typescript
// Use absolute imports from src root
import { UserEntity } from '../../domain/entities/user.entity';

// Instead of relative imports
import { UserEntity } from 'src/domain/entities/user.entity';
```

#### 3. Check File Extensions
```bash
# Ensure all TypeScript files have .ts extension
find src -name "*.js" | head -10
```

## 🗄️ Database Issues

### Issue: MongoDB connection timeout

**Symptoms:**
- Connection timeout errors
- "Server selection timed out" messages
- Authentication failures

**Solutions:**

#### 1. Check MongoDB Service
```bash
# Start MongoDB with Docker
docker-compose up -d mongodb

# Check MongoDB logs
docker-compose logs mongodb

# Verify MongoDB is listening
telnet localhost 27017
```

#### 2. Verify Connection String
```bash
# Check DATABASE_URL format
# mongodb://username:password@host:port/database
echo $DATABASE_URL

# Test connection with correct auth database
mongosh "mongodb://root:password@localhost:27017/boilerplate?authSource=admin"
```

#### 3. Check Network Configuration
```bash
# Verify Docker network
docker network ls
docker network inspect boilerplate_default

# Check if containers can communicate
docker exec -it boilerplate_app ping mongodb
```

### Issue: Database authentication failed

**Symptoms:**
- Authentication failed errors
- Access denied messages
- User not found errors

**Solutions:**

#### 1. Verify Credentials
```bash
# Check environment variables
echo $MONGO_ROOT_USERNAME
echo $MONGO_ROOT_PASSWORD

# Test authentication manually
mongosh -u root -p password --authenticationDatabase admin
```

#### 2. Reset MongoDB Authentication
```bash
# Stop MongoDB
docker-compose stop mongodb

# Remove MongoDB data volume (WARNING: This deletes all data)
docker-compose down -v

# Restart with fresh initialization
docker-compose up -d mongodb
```

### Issue: Schema validation errors

**Symptoms:**
- Mongoose validation errors
- Document doesn't match schema
- Cast errors

**Solutions:**

#### 1. Check Schema Definitions
```typescript
// Verify schema matches your data
@Prop({ required: true, unique: true })
email: string;

// Check for proper validation decorators
@IsEmail()
@IsString()
```

#### 2. Validate Data Format
```bash
# Check document structure in MongoDB
mongosh boilerplate --eval "db.users.findOne()"

# Verify data types match schema expectations
```

## 🔐 Authentication Issues

### Issue: JWT token invalid or expired

**Symptoms:**
- 401 Unauthorized errors
- Token malformed errors
- Token expired messages

**Solutions:**

#### 1. Check JWT Configuration
```bash
# Verify JWT_SECRET is set and long enough (32+ characters)
echo $JWT_SECRET | wc -c

# Check token expiration settings
echo $JWT_EXPIRES_IN
echo $REFRESH_TOKEN_EXPIRES_IN
```

#### 2. Debug JWT Token
```javascript
// Decode JWT token (without verification)
const jwt = require('jsonwebtoken');
const token = 'your-jwt-token-here';
console.log(jwt.decode(token, { complete: true }));
```

#### 3. Verify Token Format
```bash
# Check Authorization header format
# Should be: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/v1/profile
```

### Issue: Password authentication fails

**Symptoms:**
- Login always returns "Invalid credentials"
- Password comparison fails
- Bcrypt errors

**Solutions:**

#### 1. Check Password Hashing
```typescript
// Verify bcrypt configuration
console.log('BCRYPT_ROUNDS:', process.env.BCRYPT_ROUNDS || 10);

// Test password hashing
const bcrypt = require('bcryptjs');
const password = 'testpassword';
const hash = await bcrypt.hash(password, 10);
console.log('Hash:', hash);
console.log('Verify:', await bcrypt.compare(password, hash));
```

#### 2. Check Password Validation
```bash
# Verify password meets requirements
# - At least 8 characters
# - Contains uppercase, lowercase, number, special character
echo "Password123!" | grep -E '^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$'
```

## 🌐 API Issues

### Issue: CORS errors in browser

**Symptoms:**
- "Access-Control-Allow-Origin" errors
- "CORS policy" blocked requests
- Preflight request failures

**Solutions:**

#### 1. Check CORS Configuration
```typescript
// Verify CORS settings in main.ts
app.enableCors({
  origin: process.env.NODE_ENV === 'production' ? false : true,
  credentials: true,
});

// For production, specify exact origins
app.enableCors({
  origin: ['https://your-frontend.com'],
  credentials: true,
});
```

#### 2. Debug CORS Headers
```bash
# Check CORS headers in response
curl -v -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: X-Requested-With" \
  -X OPTIONS http://localhost:3000/api/v1/auth/login
```

### Issue: Rate limiting blocking requests

**Symptoms:**
- 429 Too Many Requests errors
- Rate limit exceeded messages
- Requests getting blocked unexpectedly

**Solutions:**

#### 1. Check Rate Limit Configuration
```bash
# Verify rate limit settings
echo $THROTTLE_TTL
echo $THROTTLE_LIMIT

# Check current rate limit status
curl -v http://localhost:3000/api/v1/health | grep -i "x-ratelimit"
```

#### 2. Reset Rate Limit (Development)
```bash
# Clear Redis cache to reset rate limits
redis-cli -u $REDIS_URL FLUSHDB
```

### Issue: API documentation not accessible

**Symptoms:**
- 404 error on /api/docs
- Swagger UI not loading
- Missing API documentation

**Solutions:**

#### 1. Check Swagger Configuration
```bash
# Verify NODE_ENV is not 'production' (Swagger disabled in prod)
echo $NODE_ENV

# Check if Swagger is properly configured
grep -r "SwaggerModule" src/
```

#### 2. Verify Routes
```bash
# Check if documentation routes are registered
curl http://localhost:3000/api/docs
curl http://localhost:3000/api/docs-json
```

## 🧪 Testing Issues

### Issue: Tests failing with database errors

**Symptoms:**
- Database connection errors in tests
- Test data not cleaned up
- Race conditions between tests

**Solutions:**

#### 1. Check Test Environment
```bash
# Verify test environment variables
cat .env.test

# Check if test database is separate
echo $DATABASE_URL | grep -i test
```

#### 2. Use In-Memory Database
```typescript
// Configure MongoDB Memory Server for tests
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.DATABASE_URL = uri;
});

afterAll(async () => {
  await mongod.stop();
});
```

#### 3. Clean Test Data
```typescript
// Add proper test cleanup
afterEach(async () => {
  await UserModel.deleteMany({});
  await RefreshTokenModel.deleteMany({});
});
```

### Issue: Tests timing out

**Symptoms:**
- Jest timeout errors
- Tests hang indefinitely
- Async operations not completing

**Solutions:**

#### 1. Increase Test Timeout
```javascript
// In jest.config.js
module.exports = {
  testTimeout: 30000, // 30 seconds
};

// Or in individual test files
describe('UserService', () => {
  jest.setTimeout(30000);
  // tests...
});
```

#### 2. Fix Async/Await Issues
```typescript
// Ensure all async operations are awaited
it('should create user', async () => {
  const result = await userService.create(userData);
  expect(result).toBeDefined();
});

// Don't forget to await cleanup
afterEach(async () => {
  await cleanupDatabase();
});
```

## 🐳 Docker Issues

### Issue: Docker build failures

**Symptoms:**
- Docker build exits with error
- Permission denied errors
- Layer caching issues

**Solutions:**

#### 1. Check Dockerfile
```bash
# Build with verbose output
docker build --no-cache --progress=plain .

# Check for permission issues
docker build --build-arg USER_ID=$(id -u) --build-arg GROUP_ID=$(id -g) .
```

#### 2. Fix Permission Issues
```dockerfile
# Ensure proper ownership in Dockerfile
COPY --chown=nestjs:nodejs . .
USER nestjs
```

### Issue: Container crashes on startup

**Symptoms:**
- Container exits immediately
- Health check failures
- Service unavailable errors

**Solutions:**

#### 1. Check Container Logs
```bash
# View container logs
docker-compose logs app

# Follow logs in real-time
docker-compose logs -f app

# Check all services
docker-compose ps
```

#### 2. Debug Container Environment
```bash
# Run container interactively
docker run -it --rm boilerplate-api sh

# Check environment variables inside container
docker exec -it boilerplate_app env | grep -E "(DATABASE|JWT|REDIS)"
```

## 🔧 Performance Issues

### Issue: Slow API responses

**Symptoms:**
- High response times
- Timeout errors
- Poor user experience

**Solutions:**

#### 1. Check Database Performance
```bash
# Monitor MongoDB performance
mongosh boilerplate --eval "db.runCommand({serverStatus: 1}).metrics"

# Check for missing indexes
mongosh boilerplate --eval "db.users.getIndexes()"
```

#### 2. Enable Database Indexes
```typescript
// Add indexes to frequently queried fields
@Prop({ index: true })
email: string;

@Prop({ index: true })
createdAt: Date;
```

#### 3. Implement Caching
```typescript
// Use Redis for caching
@Injectable()
export class CacheService {
  async get(key: string): Promise<any> {
    return await this.redis.get(key);
  }

  async set(key: string, value: any, ttl = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }
}
```

### Issue: High memory usage

**Symptoms:**
- Out of memory errors
- Container being killed
- Slow garbage collection

**Solutions:**

#### 1. Monitor Memory Usage
```bash
# Check container memory usage
docker stats

# Monitor Node.js memory usage
node --max-old-space-size=512 dist/main.js
```

#### 2. Optimize Database Connections
```typescript
// Use connection pooling
mongoose.connect(DATABASE_URL, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

## 📱 Client Integration Issues

### Issue: Frontend cannot connect to API

**Symptoms:**
- Network errors in frontend
- API calls failing
- Authentication not working

**Solutions:**

#### 1. Check API Endpoint
```bash
# Verify API is accessible
curl http://localhost:3000/api/v1/health

# Check if API prefix is correct
curl http://localhost:3000/health  # Wrong
curl http://localhost:3000/api/v1/health  # Correct
```

#### 2. Verify Frontend Configuration
```javascript
// Check API base URL in frontend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

// Ensure proper headers
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
};
```

#### 3. Debug Network Requests
```bash
# Use browser developer tools to check:
# - Request URL and method
# - Request headers
# - Response status and headers
# - CORS errors in console
```

## 🆘 Getting Help

If you're still experiencing issues:

1. **Check Application Logs**:
   ```bash
   # Docker logs
   docker-compose logs app
   
   # Application logs
   tail -f logs/application.log
   ```

2. **Enable Debug Mode**:
   ```bash
   DEBUG=* pnpm run start:dev
   ```

3. **Run Health Checks**:
   ```bash
   curl http://localhost:3000/api/v1/health
   ```

4. **Check System Resources**:
   ```bash
   # Check disk space
   df -h
   
   # Check memory usage
   free -m
   
   # Check process status
   ps aux | grep node
   ```

5. **Contact Support**:
   - Create an issue in the repository
   - Include relevant logs and error messages
   - Describe steps to reproduce the issue
   - Specify your environment (OS, Node.js version, etc.)

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Docker Documentation](https://docs.docker.com/)
- [Jest Testing Documentation](https://jestjs.io/docs/getting-started)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
