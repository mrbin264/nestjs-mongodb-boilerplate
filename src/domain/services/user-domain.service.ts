import { Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { Email } from '../value-objects/email.vo';
import { InsufficientPermissionsException } from '../exceptions/insufficient-permissions.exception';
import { InvalidPasswordException } from '../exceptions/invalid-password.exception';

@Injectable()
export class UserDomainService {
  /**
   * Validates if a user can be created by the given creator
   */
  validateUserCreation(userToCreate: User, creator: User): boolean {
    // System admin can create anyone
    if (creator.isInRole(Role.SYSTEM_ADMIN)) {
      return true;
    }

    // Admin can only create users with USER role
    if (creator.isInRole(Role.ADMIN)) {
      const hasOnlyUserRole = userToCreate.roles.length === 1 && userToCreate.isInRole(Role.USER);
      if (!hasOnlyUserRole) {
        throw new InsufficientPermissionsException(
          'create',
          'user with elevated roles',
          { creatorRoles: creator.roles.map(r => r.toString()) }
        );
      }
      return true;
    }

    // Regular users cannot create other users
    throw new InsufficientPermissionsException(
      'create',
      'user',
      { creatorRoles: creator.roles.map(r => r.toString()) }
    );
  }

  /**
   * Validates if an assignee can be assigned a specific role by the creator
   */
  canAssignRole(assignee: User, role: Role, creator: User): boolean {
    // System admin can assign any role
    if (creator.isInRole(Role.SYSTEM_ADMIN)) {
      return true;
    }

    // Admin can only assign USER role
    if (creator.isInRole(Role.ADMIN)) {
      if (!role.equals(Role.USER)) {
        throw new InsufficientPermissionsException(
          'assign',
          `role ${role.toString()}`,
          { 
            creatorRoles: creator.roles.map(r => r.toString()),
            targetRole: role.toString()
          }
        );
      }
      return true;
    }

    // Regular users cannot assign roles
    throw new InsufficientPermissionsException(
      'assign',
      'role',
      { creatorRoles: creator.roles.map(r => r.toString()) }
    );
  }

  /**
   * Validates user hierarchy - ensures lower privilege users cannot manage higher privilege users
   */
  validateUserHierarchy(manager: User, target: User): boolean {
    // System admin can manage anyone
    if (manager.isInRole(Role.SYSTEM_ADMIN)) {
      return true;
    }

    // Admin cannot manage system admins or other admins
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
    if (manager.id.equals(target.id)) {
      return true;
    }

    throw new InsufficientPermissionsException(
      'manage',
      'other users',
      {
        managerRoles: manager.roles.map(r => r.toString()),
        targetRoles: target.roles.map(r => r.toString())
      }
    );
  }

  /**
   * Validates email uniqueness constraint (business rule)
   */
  validateEmailUniqueness(email: Email, existingUsers: User[], excludeUserId?: string): boolean {
    const duplicateUser = existingUsers.find(user => {
      if (excludeUserId && user.id.toString() === excludeUserId) {
        return false;
      }
      return user.email.equals(email);
    });

    return !duplicateUser;
  }

  /**
   * Validates user profile completeness for specific operations
   */
  validateProfileCompleteness(user: User, requiredFields: string[]): boolean {
    const profile = user.profile;

    for (const field of requiredFields) {
      if (!profile[field as keyof typeof profile]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Determines if a user can perform password operations on target user
   */
  canManagePassword(manager: User, target: User): boolean {
    // Users can always change their own password
    if (manager.id.equals(target.id)) {
      return true;
    }

    // System admin can manage anyone's password
    if (manager.isInRole(Role.SYSTEM_ADMIN)) {
      return true;
    }

    // Admin can manage passwords of users they can manage
    if (manager.isInRole(Role.ADMIN)) {
      return this.validateUserHierarchy(manager, target);
    }

    return false;
  }

  /**
   * Validates user status transitions
   */
  validateStatusTransition(user: User, newStatus: 'active' | 'inactive', manager: User): boolean {
    // Users cannot deactivate themselves (prevents lockout)
    if (manager.id.equals(user.id) && newStatus === 'inactive') {
      throw new InvalidPasswordException(
        'Users cannot deactivate their own account',
        { userId: user.id.toString() }
      );
    }

    // Validate hierarchy for status changes
    return this.validateUserHierarchy(manager, user);
  }
}
