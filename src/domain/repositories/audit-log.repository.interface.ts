import { AuditLog } from '../entities/audit-log.entity';
import { UserId } from '../value-objects/user-id.vo';

export interface AuditLogQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'action' | 'userId';
  sortOrder?: 'asc' | 'desc';
  userId?: UserId;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface AuditLogQueryResult {
  logs: AuditLog[];
  total: number;
  hasMore: boolean;
}

export interface IAuditLogRepository {
  /**
   * Save an audit log entry
   */
  save(auditLog: AuditLog): Promise<AuditLog>;

  /**
   * Find audit logs with query options
   */
  findMany(options?: AuditLogQueryOptions): Promise<AuditLogQueryResult>;

  /**
   * Find audit logs for a specific user
   */
  findByUserId(userId: UserId, options?: Omit<AuditLogQueryOptions, 'userId'>): Promise<AuditLogQueryResult>;

  /**
   * Find audit logs for a specific resource
   */
  findByResource(resource: string, options?: Omit<AuditLogQueryOptions, 'resource'>): Promise<AuditLogQueryResult>;

  /**
   * Find audit logs by action type
   */
  findByAction(action: string, options?: Omit<AuditLogQueryOptions, 'action'>): Promise<AuditLogQueryResult>;

  /**
   * Count audit logs by criteria
   */
  count(options?: Omit<AuditLogQueryOptions, 'limit' | 'offset' | 'sortBy' | 'sortOrder'>): Promise<number>;

  /**
   * Delete old audit logs (for cleanup/retention)
   */
  deleteOlderThan(date: Date): Promise<number>;

  /**
   * Get audit summary for a user (action counts, etc.)
   */
  getUserAuditSummary(userId: UserId, startDate?: Date, endDate?: Date): Promise<{
    totalActions: number;
    actionCounts: Record<string, number>;
    lastActivity: Date | null;
    resourceCounts: Record<string, number>;
  }>;

  /**
   * Find recent failed login attempts for security monitoring
   */
  findRecentFailedLogins(ipAddress?: string, minutes?: number): Promise<AuditLog[]>;

  /**
   * Get system-wide audit statistics
   */
  getSystemAuditStats(startDate?: Date, endDate?: Date): Promise<{
    totalLogs: number;
    topActions: Array<{ action: string; count: number }>;
    topUsers: Array<{ userId: string; count: number }>;
    activityByHour: Array<{ hour: number; count: number }>;
  }>;
}
