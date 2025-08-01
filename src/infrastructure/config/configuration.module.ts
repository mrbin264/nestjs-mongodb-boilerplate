import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Configuration factory functions
import appConfig from '@/config/app.config';
import databaseConfig from '@/config/database.config';
import authConfig from '@/config/auth.config';
import { validate } from '@/config/env.validation';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development', '.env'],
      load: [appConfig, databaseConfig, authConfig],
      validate,
      expandVariables: true,
      cache: true,
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigurationModule {}
