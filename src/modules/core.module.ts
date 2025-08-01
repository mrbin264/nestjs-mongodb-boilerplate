import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

// Configuration imports
import appConfig from '@/config/app.config';
import databaseConfig from '@/config/database.config';
import authConfig from '@/config/auth.config';
import { validate } from '@/config/env.validation';

// Database configuration
import { DatabaseConfig } from '@/infrastructure/database/mongodb/config/database.config';

@Global()
@Module({
  imports: [
    // Configuration Module - Global configuration loading
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development', '.env'],
      load: [appConfig, databaseConfig, authConfig],
      validate,
    }),

    // Database Module - MongoDB connection with Mongoose
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
          retryDelay: 1000,
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          family: 4, // Use IPv4, skip trying IPv6
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [
    // Database configuration provider
    DatabaseConfig,
  ],
  exports: [
    ConfigModule,
    DatabaseConfig,
  ],
})
export class CoreModule {}
