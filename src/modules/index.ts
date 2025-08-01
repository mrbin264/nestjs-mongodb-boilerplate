// Core modules
export { CoreModule } from './core.module';
export { AuthModule } from './auth.module';
export { UsersModule } from './users.module';
export { AuditModule } from './audit.module';

// Main application module
export { AppModule } from './app.module';

// Audit service interface for other modules
export { IAuditService, AUDIT_SERVICE } from './audit.module';
