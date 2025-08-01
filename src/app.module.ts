// ⚠️ DEPRECATED: This module has been replaced by the modular structure in src/modules/
// See MIGRATION.md for details about the new architecture
// The new main module is located at src/modules/app.module.ts

import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';

// Configuration imports
import appConfig from '@/config/app.config';
import databaseConfig from '@/config/database.config';
import authConfig from '@/config/auth.config';
import { validate } from '@/config/env.validation';

// Controllers
import { HealthController } from '@/presentation/controllers/health.controller';

// Presentation Module
import { PresentationModule } from '@/presentation/presentation.module';

// Middleware
import { RateLimitingMiddleware } from '@/presentation/middleware/rate-limiting.middleware';
import { AuditLoggingMiddleware } from '@/presentation/middleware/audit-logging.middleware';

@Module({
  imports: [
    // Configuration Module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development', '.env'],
      load: [appConfig, databaseConfig, authConfig],
      validate,
    }),

    // Database Module
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('database.url');
        if (!uri) {
          throw new Error('DATABASE_URL is not defined');
        }
        return {
          uri,
          retryWrites: true,
          w: 'majority',
        };
      },
      inject: [ConfigService],
    }),

    // Rate Limiting Module
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => [
        {
          ttl: parseInt(process.env.THROTTLE_TTL || '60', 10) * 1000,
          limit: parseInt(process.env.THROTTLE_LIMIT || '10', 10),
        },
      ],
      inject: [ConfigService],
    }),

    // Health Check Module
    TerminusModule,

    // Presentation Module (includes all controllers, guards, filters, interceptors)
    PresentationModule,
  ],
  controllers: [HealthController],
  providers: [],
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
