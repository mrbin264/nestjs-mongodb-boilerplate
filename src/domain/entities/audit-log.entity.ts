import { UserId } from '../value-objects/user-id.vo';

export type AuditMetadata = Record<string, string | number | boolean | Date>;

export interface AuditLogProps {
  id?: string;
  userId: UserId;
  action: string;
  resource: string;
  timestamp?: Date;
  metadata?: AuditMetadata;
  userAgent?: string;
  ipAddress?: string;
}

export class AuditLog {
  private readonly _id: string;
  private readonly _userId: UserId;
  private readonly _action: string;
  private readonly _resource: string;
  private readonly _timestamp: Date;
  private readonly _metadata: AuditMetadata;
  private readonly _userAgent: string | undefined;
  private readonly _ipAddress: string | undefined;

  constructor(props: AuditLogProps) {
    this._id = props.id || this.generateId();
    this._userId = props.userId;
    this._action = props.action;
    this._resource = props.resource;
    this._timestamp = props.timestamp || new Date();
    this._metadata = props.metadata || {};
    this._userAgent = props.userAgent;
    this._ipAddress = props.ipAddress;
  }

  // Factory methods for different audit events
  static userCreated(userId: UserId, targetUserId: UserId, metadata?: AuditMetadata): AuditLog {
    return new AuditLog({
      userId,
      action: 'CREATE_USER',
      resource: `user:${targetUserId.toString()}`,
      metadata: {
        targetUserId: targetUserId.toString(),
        ...metadata,
      },
    });
  }

  static userUpdated(userId: UserId, targetUserId: UserId, changes: string[], metadata?: AuditMetadata): AuditLog {
    return new AuditLog({
      userId,
      action: 'UPDATE_USER',
      resource: `user:${targetUserId.toString()}`,
      metadata: {
        targetUserId: targetUserId.toString(),
        changes: changes.join(','),
        ...metadata,
      },
    });
  }

  static userDeleted(userId: UserId, targetUserId: UserId, metadata?: AuditMetadata): AuditLog {
    return new AuditLog({
      userId,
      action: 'DELETE_USER',
      resource: `user:${targetUserId.toString()}`,
      metadata: {
        targetUserId: targetUserId.toString(),
        ...metadata,
      },
    });
  }

  static userLogin(userId: UserId, success: boolean, metadata?: AuditMetadata): AuditLog {
    return new AuditLog({
      userId,
      action: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
      resource: `user:${userId.toString()}`,
      metadata: {
        success,
        ...metadata,
      },
    });
  }

  static userLogout(userId: UserId, metadata?: AuditMetadata): AuditLog {
    return new AuditLog({
      userId,
      action: 'LOGOUT',
      resource: `user:${userId.toString()}`,
      metadata: metadata || {},
    });
  }

  static passwordChanged(userId: UserId, targetUserId: UserId, metadata?: AuditMetadata): AuditLog {
    return new AuditLog({
      userId,
      action: 'CHANGE_PASSWORD',
      resource: `user:${targetUserId.toString()}`,
      metadata: {
        targetUserId: targetUserId.toString(),
        ...metadata,
      },
    });
  }

  static profileUpdated(userId: UserId, changes: string[], metadata?: AuditMetadata): AuditLog {
    return new AuditLog({
      userId,
      action: 'UPDATE_PROFILE',
      resource: `user:${userId.toString()}`,
      metadata: {
        changes: changes.join(','),
        ...metadata,
      },
    });
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get userId(): UserId {
    return this._userId;
  }

  get action(): string {
    return this._action;
  }

  get resource(): string {
    return this._resource;
  }

  get timestamp(): Date {
    return this._timestamp;
  }

  get metadata(): AuditMetadata {
    return { ...this._metadata };
  }

  get userAgent(): string | undefined {
    return this._userAgent;
  }

  get ipAddress(): string | undefined {
    return this._ipAddress;
  }

  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
