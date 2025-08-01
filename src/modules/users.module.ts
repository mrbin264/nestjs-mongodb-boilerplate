import { Module } from '@nestjs/common';

// Controllers
import { UsersController } from '@/presentation/controllers/users.controller';
import { ProfileController } from '@/presentation/controllers/profile.controller';

// Use Cases - not directly used but imported through ApplicationModule
// Import these tokens in case we need to reference them in the future

// Infrastructure services
import { InfrastructureModule } from '@/infrastructure/infrastructure.module';

// Application module for use cases
import { ApplicationModule } from '@/application/application.module';

// Core module dependency
import { CoreModule } from './core.module';

// Auth module dependency for authentication
import { AuthModule } from './auth.module';

@Module({
  imports: [
    CoreModule,
    ApplicationModule,
    InfrastructureModule,
    AuthModule, // For authentication guards and strategies
  ],
  controllers: [
    UsersController,
    ProfileController,
  ],
  providers: [
    // Re-export user management use cases for potential direct injection
  ],
  exports: [
    // No exports needed - use cases are available through ApplicationModule
  ],
})
export class UsersModule {}
