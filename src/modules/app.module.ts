import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

// Core modules
import { CoreModule } from './core.module';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { AuthModule } from './auth.module';
import { UsersModule } from './users.module';
import { AuditModule } from './audit.module';

// Controllers
import { HealthController } from '@/presentation/controllers/health.controller';

// Global Guards
import { JwtAuthGuard } from '@/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@/presentation/guards/roles.guard';

// Global Filters
import { GlobalExceptionFilter } from '@/presentation/filters/global-exception.filter';
import { ValidationExceptionFilter } from '@/presentation/filters/validation-exception.filter';

// Global Interceptors
import { ResponseInterceptor } from '@/presentation/interceptors/response.interceptor';

// Middleware
import { RateLimitingMiddleware } from '@/presentation/middleware/rate-limiting.middleware';
import { AuditLoggingMiddleware } from '@/presentation/middleware/audit-logging.middleware';

@Module({
  imports: [
    // Core infrastructure
    CoreModule,
    
    // Infrastructure services (global)
    InfrastructureModule,

    // Rate Limiting Module
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || '60', 10) * 1000,
        limit: parseInt(process.env.THROTTLE_LIMIT || '10', 10),
      },
    ]),

    // Health Check Module
    TerminusModule,

    // Feature modules
    AuthModule,
    UsersModule,
    AuditModule,
  ],
  controllers: [HealthController],
  providers: [
    // Global Guards
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },

    // Global Filters
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ValidationExceptionFilter,
    },

    // Global Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply rate limiting middleware to auth routes
    consumer
      .apply(RateLimitingMiddleware)
      .forRoutes('auth/*');

    // Apply audit logging middleware to all routes
    consumer
      .apply(AuditLoggingMiddleware)
      .forRoutes('*');
  }
}
