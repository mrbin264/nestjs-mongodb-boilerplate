import { User } from '../entities/user.entity';
import { Email } from '../value-objects/email.vo';
import { UserId } from '../value-objects/user-id.vo';
import { Role } from '../entities/role.entity';

export interface UserQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'email' | 'createdAt' | 'updatedAt' | 'lastLoginAt';
  sortOrder?: 'asc' | 'desc';
  search?: string;
  role?: Role;
  isActive?: boolean;
  emailVerified?: boolean;
}

export interface UserQueryResult {
  users: User[];
  total: number;
  hasMore: boolean;
}

export interface IUserRepository {
  /**
   * Save a user (create or update)
   */
  save(user: User): Promise<User>;

  /**
   * Find user by ID
   */
  findById(id: UserId): Promise<User | null>;

  /**
   * Find user by email
   */
  findByEmail(email: Email): Promise<User | null>;

  /**
   * Find users by role
   */
  findByRole(role: Role, options?: UserQueryOptions): Promise<UserQueryResult>;

  /**
   * Find users with query options (pagination, filtering, sorting)
   */
  findMany(options?: UserQueryOptions): Promise<UserQueryResult>;

  /**
   * Check if email exists (for uniqueness validation)
   */
  existsByEmail(email: Email, excludeUserId?: UserId): Promise<boolean>;

  /**
   * Delete user by ID
   */
  delete(id: UserId): Promise<void>;

  /**
   * Soft delete user (mark as inactive)
   */
  softDelete(id: UserId): Promise<void>;

  /**
   * Find users created by specific user
   */
  findByCreator(creatorId: UserId, options?: UserQueryOptions): Promise<UserQueryResult>;

  /**
   * Find users by multiple IDs
   */
  findByIds(ids: UserId[]): Promise<User[]>;

  /**
   * Count users by criteria
   */
  count(options?: Omit<UserQueryOptions, 'limit' | 'offset' | 'sortBy' | 'sortOrder'>): Promise<number>;

  /**
   * Update user's last login timestamp
   */
  updateLastLogin(id: UserId): Promise<void>;

  /**
   * Find users with expired verification tokens (for cleanup)
   */
  findUnverifiedUsers(daysSinceCreation: number): Promise<User[]>;

  /**
   * Batch update users
   */
  updateMany(ids: UserId[], updates: Partial<Pick<User, 'isActive' | 'emailVerified'>>): Promise<void>;
}
