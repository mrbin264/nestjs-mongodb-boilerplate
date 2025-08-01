import { Module } from '@nestjs/common';

// Middleware
import { AuditLoggingMiddleware } from '@/presentation/middleware/audit-logging.middleware';

// Core module dependency
import { CoreModule } from './core.module';

// Infrastructure services (for potential audit repository)
import { InfrastructureModule } from '@/infrastructure/infrastructure.module';

// Audit service interface (to be implemented in future tasks)
export interface IAuditService {
  logAction(action: string, userId?: string, details?: Record<string, unknown>): Promise<void>;
  logError(error: Error, context?: string): Promise<void>;
  logSecurityEvent(event: string, userId?: string, details?: Record<string, unknown>): Promise<void>;
}

// Audit service token for dependency injection
export const AUDIT_SERVICE = 'AUDIT_SERVICE';

@Module({
  imports: [
    CoreModule,
    InfrastructureModule,
  ],
  providers: [
    // Audit middleware
    AuditLoggingMiddleware,
    
    // TODO: Implement AuditService in future security task
    // {
    //   provide: AUDIT_SERVICE,
    //   useClass: AuditService,
    // },
  ],
  exports: [
    // Export middleware for use in other modules
    AuditLoggingMiddleware,
    
    // TODO: Export audit service token when implementation is ready
    // AUDIT_SERVICE,
  ],
})
export class AuditModule {}
