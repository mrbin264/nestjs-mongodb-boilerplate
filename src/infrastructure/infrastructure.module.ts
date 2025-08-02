import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';

// Database
import { DatabaseConfig } from './database/mongodb/config/database.config';

// Schemas
import { UserSchema, User } from './database/mongodb/schemas/user.schema';
import { RefreshTokenSchema, RefreshToken } from './database/mongodb/schemas/refresh-token.schema';
import { PasswordResetTokenSchema, PasswordResetToken } from './database/mongodb/schemas/password-reset-token.schema';

// Repositories
import { UserRepository } from './database/mongodb/repositories/user.repository';
import { RefreshTokenRepository } from './database/mongodb/repositories/refresh-token.repository';
import { PasswordResetTokenRepository } from './database/mongodb/repositories/password-reset-token.repository';

// External Services
import { JwtService } from './external-services/jwt/jwt.service';
import { HashService } from './external-services/hash/hash.service';
import { EmailService } from './external-services/email/email.service';

// Dependency Injection Tokens
export const USER_REPOSITORY = 'USER_REPOSITORY';
export const REFRESH_TOKEN_REPOSITORY = 'REFRESH_TOKEN_REPOSITORY';
export const PASSWORD_RESET_TOKEN_REPOSITORY = 'PASSWORD_RESET_TOKEN_REPOSITORY';
export const JWT_SERVICE = 'JWT_SERVICE';
export const HASH_SERVICE = 'HASH_SERVICE';
export const EMAIL_SERVICE = 'EMAIL_SERVICE';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    MongooseModule.forRootAsync({
      useClass: DatabaseConfig,
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: RefreshToken.name, schema: RefreshTokenSchema },
      { name: PasswordResetToken.name, schema: PasswordResetTokenSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: (() => {
          const secret = configService.get<string>('auth.jwtSecret');
          if (!secret) {
            throw new Error('JWT_SECRET is not defined in environment variables');
          }
          return secret;
        })(),
        signOptions: {
          expiresIn: configService.get<string>('auth.jwtExpiresIn', '15m'),
        },
      }),
      inject: [ConfigService],
      global: true,
    }),
  ],
  providers: [
    // Database Config
    DatabaseConfig,

    // Repositories
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: RefreshTokenRepository,
    },
    {
      provide: PASSWORD_RESET_TOKEN_REPOSITORY,
      useClass: PasswordResetTokenRepository,
    },

    // External Services
    {
      provide: JWT_SERVICE,
      useClass: JwtService,
    },
    {
      provide: HASH_SERVICE,
      useClass: HashService,
    },
    {
      provide: EMAIL_SERVICE,
      useClass: EmailService,
    },
  ],
  exports: [
    // Repository exports
    USER_REPOSITORY,
    REFRESH_TOKEN_REPOSITORY,
    PASSWORD_RESET_TOKEN_REPOSITORY,

    // Service exports
    JWT_SERVICE,
    HASH_SERVICE,
    EMAIL_SERVICE,
  ],
})
export class InfrastructureModule {}
