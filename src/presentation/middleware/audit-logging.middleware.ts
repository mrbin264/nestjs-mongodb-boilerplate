import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { User } from '../../domain/entities/user.entity';

interface AuthenticatedRequest extends Request {
  user?: User;
}

interface AuditLogEntry {
  timestamp: string;
  method: string;
  url: string;
  ip: string;
  userAgent: string;
  userId?: string;
  userEmail?: string;
  requestBody?: Record<string, unknown>;
  responseStatus?: number;
  responseTime?: number;
  error?: string;
}

@Injectable()
export class AuditLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuditLoggingMiddleware.name);

  // Routes that should have their request bodies logged
  private readonly sensitiveRoutes = [
    '/users',
    '/auth/register',
    '/auth/login', 
    '/profile',
  ];

  // Fields to exclude from request body logging for security
  private readonly excludeFields = [
    'password',
    'confirmPassword',
    'currentPassword',
    'newPassword',
    'token',
    'refreshToken',
  ];

  use(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    
    // Extract request information
    const auditEntry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    };

    // Add user info if available
    if (req.user) {
      auditEntry.userId = req.user.id?.value;
      auditEntry.userEmail = req.user.email?.value;
    }

    // Log request body for sensitive operations (excluding passwords)
    if (this.shouldLogRequestBody(req)) {
      auditEntry.requestBody = this.sanitizeObject(req.body);
    }

    // Log after response is sent
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      auditEntry.responseStatus = res.statusCode;
      auditEntry.responseTime = responseTime;

      // Log the audit entry asynchronously
      process.nextTick(() => {
        this.logAuditEntry(auditEntry);
      });
    });

    next();
  }

  private shouldLogRequestBody(req: AuthenticatedRequest): boolean {
    // Only log request bodies for specific routes and methods
    return (
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) ||
      this.sensitiveRoutes.some(route => req.originalUrl.includes(route))
    );
  }

  private sanitizeObject(obj: unknown): Record<string, unknown> {
    if (!obj || typeof obj !== 'object') {
      return { value: obj };
    }

    if (Array.isArray(obj)) {
      return { items: obj.map(item => this.sanitizeObject(item)) };
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (this.excludeFields.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private logAuditEntry(entry: AuditLogEntry): void {
    const logMessage = this.formatLogMessage(entry);

    // Log different levels based on the type of operation
    if (this.isCriticalOperation(entry)) {
      this.logger.warn(logMessage, 'CRITICAL_OPERATION');
    } else if (this.isAuthOperation(entry)) {
      this.logger.log(logMessage, 'AUTH_OPERATION');
    } else if (entry.responseStatus && entry.responseStatus >= 400) {
      this.logger.error(logMessage, 'ERROR_RESPONSE');
    } else {
      this.logger.log(logMessage, 'API_REQUEST');
    }
  }

  private formatLogMessage(entry: AuditLogEntry): string {
    const parts = [
      `${entry.method} ${entry.url}`,
      `Status: ${entry.responseStatus}`,
      `IP: ${entry.ip}`,
      `Time: ${entry.responseTime}ms`,
    ];

    if (entry.userId) {
      parts.push(`User: ${entry.userEmail} (${entry.userId})`);
    }

    if (entry.requestBody && Object.keys(entry.requestBody).length > 0) {
      parts.push(`Body: ${JSON.stringify(entry.requestBody)}`);
    }

    return parts.join(' | ');
  }

  private isCriticalOperation(entry: AuditLogEntry): boolean {
    const criticalPatterns = [
      '/users', // User management
      '/auth/register', // User registration
      '/profile', // Profile changes
      'DELETE', // Any delete operations
    ];

    return criticalPatterns.some(pattern => 
      entry.url.includes(pattern) || entry.method === pattern
    );
  }

  private isAuthOperation(entry: AuditLogEntry): boolean {
    return entry.url.includes('/auth/');
  }
}
