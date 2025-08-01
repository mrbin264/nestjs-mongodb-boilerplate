# Performance Optimization Guide

This guide covers performance optimization strategies for the Boilerplate API to ensure optimal performance in production environments.

## 📊 Performance Monitoring

### Application Performance Monitoring (APM)

#### Built-in Performance Monitoring
```typescript
// src/presentation/interceptors/performance.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - now;
        
        if (responseTime > 1000) { // Log slow requests
          this.logger.warn(`Slow request: ${method} ${url} - ${responseTime}ms`);
        }
        
        // Add response time header
        const response = context.switchToHttp().getResponse();
        response.set('X-Response-Time', `${responseTime}ms`);
      }),
    );
  }
}
```

#### Integration with External APM Tools
```typescript
// For New Relic
import * as newrelic from 'newrelic';

// For DataDog
import tracer from 'dd-trace';
tracer.init();

// For Application Insights
import { setup } from 'applicationinsights';
setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING).start();
```

### Key Performance Metrics

Monitor these essential metrics:

- **Response Time**: < 200ms for simple operations, < 1s for complex operations
- **Throughput**: Requests per second (RPS)
- **Error Rate**: < 1% error rate
- **CPU Usage**: < 70% average usage
- **Memory Usage**: < 80% of available memory
- **Database Connections**: Monitor pool usage

## 🗄️ Database Optimization

### MongoDB Performance Tuning

#### 1. Indexing Strategy
```typescript
// src/infrastructure/database/mongodb/schemas/user.schema.ts
import { Schema } from 'mongoose';

export const UserSchema = new Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    index: true // Single field index
  },
  roles: { 
    type: [String], 
    index: true // Array field index
  },
  'profile.firstName': { 
    type: String,
    index: true // Nested field index
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Compound indexes for common queries
UserSchema.index({ email: 1, isActive: 1 });
UserSchema.index({ roles: 1, createdAt: -1 });
UserSchema.index({ 'profile.firstName': 1, 'profile.lastName': 1 });

// Text search index
UserSchema.index({ 
  email: 'text', 
  'profile.firstName': 'text', 
  'profile.lastName': 'text' 
});
```

#### 2. Query Optimization
```typescript
// Efficient queries with proper field selection
async findUsers(query: any, pagination: PaginationDto) {
  return this.userModel
    .find(query)
    .select('email roles profile.firstName profile.lastName createdAt') // Only select needed fields
    .limit(pagination.limit)
    .skip((pagination.page - 1) * pagination.limit)
    .sort({ createdAt: -1 })
    .lean() // Return plain JavaScript objects instead of Mongoose documents
    .exec();
}

// Use aggregation for complex queries
async getUserStatistics() {
  return this.userModel.aggregate([
    {
      $group: {
        _id: '$roles',
        count: { $sum: 1 },
        avgAge: { $avg: '$profile.age' }
      }
    },
    { $sort: { count: -1 } }
  ]);
}

// Efficient user search with text index
async searchUsers(searchTerm: string, pagination: PaginationDto) {
  return this.userModel
    .find({ $text: { $search: searchTerm } })
    .select('email profile.firstName profile.lastName')
    .limit(pagination.limit)
    .skip((pagination.page - 1) * pagination.limit)
    .lean()
    .exec();
}
```

#### 3. Connection Pool Optimization
```typescript
// src/infrastructure/database/mongodb/database.module.ts
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.DATABASE_URL,
        // Connection pool settings
        maxPoolSize: 50, // Maximum number of connections
        minPoolSize: 5,  // Minimum number of connections
        maxIdleTimeMS: 30000, // Close connections after 30s of inactivity
        serverSelectionTimeoutMS: 5000, // How long to try selecting a server
        socketTimeoutMS: 45000, // How long a send or receive on a socket can take
        
        // Performance settings
        bufferCommands: false, // Disable mongoose buffering
        bufferMaxEntries: 0,   // Disable mongoose buffering
        
        // Replica set settings (for production)
        readPreference: 'secondaryPreferred',
        writeConcern: { w: 'majority', j: true },
        
        // Compression
        compressors: ['zlib'],
      }),
    }),
  ],
})
export class DatabaseModule {}
```

#### 4. Database Monitoring
```typescript
// Monitor database performance
import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class DatabaseMonitoringService {
  private readonly logger = new Logger(DatabaseMonitoringService.name);

  constructor(@InjectConnection() private connection: Connection) {
    this.setupMonitoring();
  }

  private setupMonitoring() {
    // Monitor slow queries
    this.connection.on('slow', (query) => {
      this.logger.warn(`Slow query detected: ${JSON.stringify(query)}`);
    });

    // Monitor connection pool
    setInterval(() => {
      const stats = this.connection.db.serverConfig.s.coreTopology.s.server.s.pool;
      this.logger.debug(`Connection Pool Stats: Available: ${stats.availableConnections}, In Use: ${stats.inUseConnections}`);
    }, 60000); // Every minute
  }
}
```

## 🚀 Application Optimization

### 1. Caching Strategies

#### Redis Caching Implementation
```typescript
// src/infrastructure/services/cache.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true,
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttl = 3600): Promise<void> {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}:`, error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      this.logger.error(`Cache pattern invalidation error for ${pattern}:`, error);
    }
  }
}
```

#### Caching Decorator
```typescript
// src/shared/decorators/cache.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY = 'cache_key';
export const CACHE_TTL = 'cache_ttl';

export const Cache = (key: string, ttl = 3600) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_KEY, key)(target, propertyName, descriptor);
    SetMetadata(CACHE_TTL, ttl)(target, propertyName, descriptor);
  };
};

// Usage
@Injectable()
export class UserService {
  @Cache('user:profile:{userId}', 1800) // 30 minutes
  async getUserProfile(userId: string) {
    return this.userRepository.findById(userId);
  }
}
```

#### Cache Interceptor
```typescript
// src/shared/interceptors/cache.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../services/cache.service';
import { CACHE_KEY, CACHE_TTL } from '../decorators/cache.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const cacheKey = this.reflector.get<string>(CACHE_KEY, context.getHandler());
    const cacheTtl = this.reflector.get<number>(CACHE_TTL, context.getHandler());

    if (!cacheKey) {
      return next.handle();
    }

    // Build cache key with parameters
    const request = context.switchToHttp().getRequest();
    const finalCacheKey = this.buildCacheKey(cacheKey, request.params, request.query);

    // Try to get from cache
    const cached = await this.cacheService.get(finalCacheKey);
    if (cached) {
      return of(cached);
    }

    // Execute method and cache result
    return next.handle().pipe(
      tap(async (result) => {
        await this.cacheService.set(finalCacheKey, result, cacheTtl);
      }),
    );
  }

  private buildCacheKey(template: string, params: any, query: any): string {
    let key = template;
    
    // Replace parameter placeholders
    Object.keys(params || {}).forEach(param => {
      key = key.replace(`{${param}}`, params[param]);
    });
    
    // Add query parameters if present
    if (query && Object.keys(query).length > 0) {
      const queryString = new URLSearchParams(query).toString();
      key += `:${queryString}`;
    }
    
    return key;
  }
}
```

### 2. Response Compression

```typescript
// src/main.ts
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable compression
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6, // Compression level (1-9)
    threshold: 1024, // Only compress responses larger than 1KB
  }));
  
  await app.listen(3000);
}
```

### 3. Pagination Optimization

```typescript
// src/application/dtos/common/pagination.dto.ts
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PaginationDto {
  @ApiProperty({ default: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page: number = 1;

  @ApiProperty({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100) // Prevent large page sizes
  @Transform(({ value }) => parseInt(value))
  limit: number = 10;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}

// Cursor-based pagination for better performance
export class CursorPaginationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  cursor?: string;

  @ApiProperty({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  limit: number = 10;
}
```

### 4. Async Processing

```typescript
// src/infrastructure/services/queue.service.ts
import { Injectable } from '@nestjs/common';
import { Queue, Job } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class EmailQueueService {
  constructor(@InjectQueue('email') private readonly emailQueue: Queue) {}

  async addEmailJob(emailData: any, options?: any) {
    return this.emailQueue.add('send-email', emailData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 10,
      removeOnFail: 5,
      ...options,
    });
  }
}

// Email processor
@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  @Process('send-email')
  async handleSendEmail(job: Job) {
    this.logger.debug(`Processing email job ${job.id}`);
    
    try {
      // Send email logic here
      await this.emailService.sendEmail(job.data);
      this.logger.debug(`Email job ${job.id} completed`);
    } catch (error) {
      this.logger.error(`Email job ${job.id} failed:`, error);
      throw error;
    }
  }
}
```

## 🔧 Node.js Optimization

### 1. Memory Management

```typescript
// src/main.ts
async function bootstrap() {
  // Set Node.js memory limits
  if (process.env.NODE_ENV === 'production') {
    process.env.NODE_OPTIONS = '--max-old-space-size=512'; // 512MB
  }

  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production' 
      ? ['error', 'warn', 'log'] 
      : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Memory monitoring
  setInterval(() => {
    const memUsage = process.memoryUsage();
    if (memUsage.heapUsed > 400 * 1024 * 1024) { // 400MB
      console.warn('High memory usage detected:', {
        rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      });
    }
  }, 30000);

  await app.listen(3000);
}
```

### 2. Stream Processing for Large Data

```typescript
// src/infrastructure/services/export.service.ts
import { Injectable } from '@nestjs/common';
import { Transform } from 'stream';
import { pipeline } from 'stream/promises';

@Injectable()
export class ExportService {
  async exportUsersToCSV(response: Response) {
    const cursor = this.userModel.find({}).cursor();
    
    const csvTransform = new Transform({
      objectMode: true,
      transform(user, encoding, callback) {
        const csvRow = `${user.email},${user.profile.firstName},${user.profile.lastName}\n`;
        callback(null, csvRow);
      }
    });

    response.setHeader('Content-Type', 'text/csv');
    response.setHeader('Content-Disposition', 'attachment; filename=users.csv');
    
    // Add CSV header
    response.write('Email,First Name,Last Name\n');

    // Stream processing
    await pipeline(cursor, csvTransform, response);
  }
}
```

## 🐳 Container Optimization

### 1. Optimized Dockerfile

```dockerfile
# Multi-stage build for smaller production image
FROM node:18-alpine AS dependencies
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm@8.15.0
RUN pnpm install --frozen-lockfile --prod

FROM node:18-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm@8.15.0
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

FROM node:18-alpine AS production
RUN apk add --no-cache dumb-init
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

WORKDIR /app
COPY --from=dependencies --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/package.json ./

USER nestjs
EXPOSE 3000

# Resource limits
ENV NODE_OPTIONS="--max-old-space-size=512"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
```

### 2. Docker Compose Optimization

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build: .
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
    environment:
      - NODE_ENV=production
      - NODE_OPTIONS=--max-old-space-size=512
    depends_on:
      mongodb:
        condition: service_healthy
      redis:
        condition: service_healthy

  mongodb:
    image: mongo:7-jammy
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 1G
        reservations:
          cpus: '1.0'
          memory: 512M
    volumes:
      - mongodb_data:/data/db
    command: 
      - mongod
      - --wiredTigerCacheSizeGB=0.5
      - --wiredTigerCollectionBlockCompressor=zlib

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
    command: 
      - redis-server
      - --maxmemory 200mb
      - --maxmemory-policy allkeys-lru
```

## 📈 Performance Monitoring and Alerting

### 1. Custom Metrics Collection

```typescript
// src/shared/services/metrics.service.ts
import { Injectable } from '@nestjs/common';
import { performance } from 'perf_hooks';

@Injectable()
export class MetricsService {
  private metrics = new Map<string, any>();

  recordResponseTime(endpoint: string, duration: number) {
    const key = `response_time:${endpoint}`;
    const existing = this.metrics.get(key) || { count: 0, total: 0, avg: 0, max: 0 };
    
    existing.count++;
    existing.total += duration;
    existing.avg = existing.total / existing.count;
    existing.max = Math.max(existing.max, duration);
    
    this.metrics.set(key, existing);
  }

  recordDatabaseQuery(operation: string, duration: number) {
    const key = `db_query:${operation}`;
    this.recordMetric(key, duration);
  }

  getMetrics(): Record<string, any> {
    return Object.fromEntries(this.metrics);
  }

  private recordMetric(key: string, value: number) {
    const existing = this.metrics.get(key) || { count: 0, total: 0, avg: 0, max: 0, min: Infinity };
    
    existing.count++;
    existing.total += value;
    existing.avg = existing.total / existing.count;
    existing.max = Math.max(existing.max, value);
    existing.min = Math.min(existing.min, value);
    
    this.metrics.set(key, existing);
  }
}
```

### 2. Health Check with Performance Metrics

```typescript
// src/presentation/controllers/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, MongooseHealthIndicator } from '@nestjs/terminus';
import { MetricsService } from '../../shared/services/metrics.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: MongooseHealthIndicator,
    private readonly metrics: MetricsService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.checkPerformance(),
    ]);
  }

  @Get('metrics')
  getMetrics() {
    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      metrics: this.metrics.getMetrics(),
    };
  }

  private async checkPerformance() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      performance: {
        status: 'up',
        memory: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          rss: Math.round(memUsage.rss / 1024 / 1024),
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system,
        },
        uptime: process.uptime(),
      },
    };
  }
}
```

## 🚦 Load Testing

### Artillery.js Load Testing

```yaml
# load-test.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 300
      arrivalRate: 20
      name: "Sustained load"
    - duration: 60
      arrivalRate: 50
      name: "Peak load"
  payload:
    path: "users.csv"
    fields:
      - "email"
      - "password"

scenarios:
  - name: "Authentication Flow"
    weight: 70
    flow:
      - post:
          url: "/api/v1/auth/login"
          json:
            email: "{{ email }}"
            password: "{{ password }}"
          capture:
            - json: "$.data.accessToken"
              as: "token"
      - get:
          url: "/api/v1/profile"
          headers:
            Authorization: "Bearer {{ token }}"

  - name: "User Management"
    weight: 30
    flow:
      - get:
          url: "/api/v1/users"
          qs:
            page: 1
            limit: 10
```

Run load test:
```bash
npx artillery run load-test.yml
```

## 📋 Performance Checklist

### Development Phase
- [ ] Implement proper indexing strategy
- [ ] Add caching for frequently accessed data
- [ ] Use pagination for list endpoints
- [ ] Implement proper error handling
- [ ] Add performance monitoring

### Production Deployment
- [ ] Enable response compression
- [ ] Configure connection pooling
- [ ] Set up Redis caching
- [ ] Implement CDN for static assets
- [ ] Configure load balancing
- [ ] Set up application monitoring

### Ongoing Optimization
- [ ] Regular performance testing
- [ ] Monitor and analyze slow queries
- [ ] Review and optimize indexes
- [ ] Monitor memory and CPU usage
- [ ] Update dependencies regularly

## 🎯 Performance Targets

| Metric | Target | Monitoring |
|--------|--------|------------|
| API Response Time | < 200ms (95th percentile) | APM, Logs |
| Database Query Time | < 100ms (95th percentile) | DB Profiler |
| Memory Usage | < 512MB | Container Stats |
| CPU Usage | < 70% average | Container Stats |
| Error Rate | < 1% | APM, Logs |
| Uptime | 99.9% | Health Checks |

By following these optimization strategies, your API should achieve excellent performance under load while maintaining reliability and scalability.
