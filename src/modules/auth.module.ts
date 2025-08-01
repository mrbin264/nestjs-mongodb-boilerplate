import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Controllers
import { AuthController } from '@/presentation/controllers/auth.controller';

// Guards
import { JwtAuthGuard } from '@/presentation/guards/jwt-auth.guard';

// Strategies
import { JwtStrategy } from '@/infrastructure/auth/strategies/jwt.strategy';
import { LocalStrategy } from '@/infrastructure/auth/strategies/local.strategy';

// Use Cases - not directly used but imported through ApplicationModule
// Import these tokens in case we need to reference them in the future

// Infrastructure services
import { InfrastructureModule } from '@/infrastructure/infrastructure.module';

// Application module for use cases
import { ApplicationModule } from '@/application/application.module';

// Core module dependency
import { CoreModule } from './core.module';

@Module({
  imports: [
    CoreModule,
    ApplicationModule,
    InfrastructureModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('jwt.secret');
        if (!secret) {
          throw new Error('JWT_SECRET is not defined');
        }
        return {
          secret,
          signOptions: {
            expiresIn: configService.get<string>('jwt.expiresIn', '15m'),
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    // Passport strategies
    JwtStrategy,
    LocalStrategy,
    
    // Guards
    JwtAuthGuard,
  ],
  exports: [
    // Export strategies for use in other modules
    JwtStrategy,
    LocalStrategy,
    JwtAuthGuard,
  ],
})
export class AuthModule {}
