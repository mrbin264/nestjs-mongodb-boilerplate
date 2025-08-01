import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Schemas
import { UserSchema, User } from './mongodb/schemas/user.schema';
import { RefreshTokenSchema, RefreshToken } from './mongodb/schemas/refresh-token.schema';
import { PasswordResetTokenSchema, PasswordResetToken } from './mongodb/schemas/password-reset-token.schema';

// Repositories
import { UserRepository } from './mongodb/repositories/user.repository';
import { RefreshTokenRepository } from './mongodb/repositories/refresh-token.repository';
import { PasswordResetTokenRepository } from './mongodb/repositories/password-reset-token.repository';

// Dependency Injection Tokens
export const USER_REPOSITORY = 'USER_REPOSITORY';
export const REFRESH_TOKEN_REPOSITORY = 'REFRESH_TOKEN_REPOSITORY';
export const PASSWORD_RESET_TOKEN_REPOSITORY = 'PASSWORD_RESET_TOKEN_REPOSITORY';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: RefreshToken.name, schema: RefreshTokenSchema },
      { name: PasswordResetToken.name, schema: PasswordResetTokenSchema },
    ]),
  ],
  providers: [
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
  ],
  exports: [
    // Repository exports
    USER_REPOSITORY,
    REFRESH_TOKEN_REPOSITORY,
    PASSWORD_RESET_TOKEN_REPOSITORY,
  ],
})
export class DatabaseModule {}
