import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { InsufficientPermissionsException } from '../exceptions/insufficient-permissions.exception';

export type ResourceType = 'user' | 'profile' | 'audit' | 'system';
export type ActionType = 'create' | 'read' | 'update' | 'delete' | 'manage';

export interface PermissionContext {
  resource: ResourceType;
  action: ActionType;
  targetUserId?: string | undefined;
  resourceId?: string | undefined;
}

export class PermissionDomainService {
  /**
   * Main permission checking method
   */
  checkPermission(user: User, context: PermissionContext): boolean {
    try {
      switch (context.resource) {
        case 'user':
          return this.checkUserPermission(user, context);
        case 'profile':
          return this.checkProfilePermission(user, context);
        case 'audit':
          return this.checkAuditPermission(user, context);
        case 'system':
          return this.checkSystemPermission(user);
        default:
          throw new InsufficientPermissionsException(
            context.action,
            context.resource,
            { userId: user.id.toString() }
          );
      }
    } catch (error) {
      if (error instanceof InsufficientPermissionsException) {
        throw error;
      }
      throw new InsufficientPermissionsException(
        context.action,
        context.resource,
        { userId: user.id.toString(), error: (error as Error).message }
      );
    }
  }

  /**
   * Validates hierarchical permission - ensures lower privilege users cannot manage higher privilege users
   */
  validateHierarchy(manager: User, target: User): boolean {
    // System admin can manage anyone
    if (manager.isInRole(Role.SYSTEM_ADMIN)) {
      return true;
    }

    // Admin can manage users but not other admins or system admins
    if (manager.isInRole(Role.ADMIN)) {
      if (target.isInRole(Role.SYSTEM_ADMIN) || target.isInRole(Role.ADMIN)) {
        throw new InsufficientPermissionsException(
          'manage',
          'user with elevated privileges',
          {
            managerRoles: manager.roles.map(r => r.toString()),
            targetRoles: target.roles.map(r => r.toString())
          }
        );
      }
      return true;
    }

    // Users can only manage themselves
    if (!manager.id.equals(target.id)) {
      throw new InsufficientPermissionsException(
        'manage',
        'other users',
        {
          managerId: manager.id.toString(),
          targetId: target.id.toString()
        }
      );
    }

    return true;
  }

  /**
   * Checks if user has any of the required roles
   */
  hasAnyRole(user: User, requiredRoles: Role[]): boolean {
    return requiredRoles.some(role => user.isInRole(role));
  }

  /**
   * Checks if user has all required roles
   */
  hasAllRoles(user: User, requiredRoles: Role[]): boolean {
    return requiredRoles.every(role => user.isInRole(role));
  }

  /**
   * Gets effective permissions for a user
   */
  getEffectivePermissions(user: User): string[] {
    const permissions: string[] = [];

    if (user.isInRole(Role.SYSTEM_ADMIN)) {
      permissions.push(
        'user:*',
        'profile:*',
        'audit:*',
        'system:*'
      );
    } else if (user.isInRole(Role.ADMIN)) {
      permissions.push(
        'user:create',
        'user:read',
        'user:update',
        'user:delete',
        'profile:read',
        'profile:update',
        'audit:read'
      );
    } else if (user.isInRole(Role.USER)) {
      permissions.push(
        'profile:read:own',
        'profile:update:own',
        'profile:delete:own'
      );
    }

    return permissions;
  }

  private checkUserPermission(user: User, context: PermissionContext): boolean {
    const { action, targetUserId } = context;

    switch (action) {
      case 'create':
        return this.hasAnyRole(user, [Role.SYSTEM_ADMIN, Role.ADMIN]);
      
      case 'read':
        if (user.isInRole(Role.SYSTEM_ADMIN) || user.isInRole(Role.ADMIN)) {
          return true;
        }
        // Users can read their own information
        return targetUserId ? user.id.toString() === targetUserId : false;
      
      case 'update':
      case 'delete':
        if (user.isInRole(Role.SYSTEM_ADMIN)) {
          return true;
        }
        if (user.isInRole(Role.ADMIN)) {
          // Admin needs hierarchy validation for updates/deletes
          return true; // Will be validated by hierarchy check in use case
        }
        // Users can update/delete themselves
        return targetUserId ? user.id.toString() === targetUserId : false;
      
      case 'manage':
        return this.hasAnyRole(user, [Role.SYSTEM_ADMIN, Role.ADMIN]);
      
      default:
        return false;
    }
  }

  private checkProfilePermission(user: User, context: PermissionContext): boolean {
    const { action, targetUserId } = context;

    switch (action) {
      case 'read':
      case 'update':
      case 'delete':
        if (user.isInRole(Role.SYSTEM_ADMIN)) {
          return true;
        }
        if (user.isInRole(Role.ADMIN)) {
          // Admin can read/update profiles of users they manage
          return true; // Will be validated by hierarchy check
        }
        // Users can manage their own profile
        return targetUserId ? user.id.toString() === targetUserId : false;
      
      default:
        return false;
    }
  }

  private checkAuditPermission(user: User, context: PermissionContext): boolean {
    const { action } = context;

    switch (action) {
      case 'read':
        // Only system admins and admins can read audit logs
        return this.hasAnyRole(user, [Role.SYSTEM_ADMIN, Role.ADMIN]);
      
      case 'create':
        // All authenticated users can create audit entries (system level)
        return true;
      
      default:
        return false;
    }
  }

  private checkSystemPermission(user: User): boolean {
    // Only system admins have system-level permissions
    return user.isInRole(Role.SYSTEM_ADMIN);
  }

  /**
   * Utility method to check if user can perform action on resource
   */
  can(user: User, action: ActionType, resource: ResourceType, targetUserId?: string | undefined): boolean {
    try {
      return this.checkPermission(user, {
        action,
        resource,
        targetUserId
      });
    } catch {
      return false;
    }
  }

  /**
   * Utility method that throws if user cannot perform action
   */
  authorize(user: User, action: ActionType, resource: ResourceType, targetUserId?: string | undefined): void {
    if (!this.can(user, action, resource, targetUserId)) {
      throw new InsufficientPermissionsException(
        action,
        resource,
        {
          userId: user.id.toString(),
          targetUserId,
          userRoles: user.roles.map(r => r.toString())
        }
      );
    }
  }
}
