import { Email } from '../value-objects/email.vo';
import { Password } from '../value-objects/password.vo';
import { UserId } from '../value-objects/user-id.vo';
import { Role } from './role.entity';

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  phone?: string;
  dateOfBirth?: Date;
}

export interface UserProps {
  id?: UserId;
  email: Email;
  password: Password;
  roles: Role[];
  profile?: UserProfile;
  emailVerified?: boolean;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  lastLoginAt?: Date;
  createdBy?: UserId;
}

export class User {
  private readonly _id: UserId;
  private readonly _email: Email;
  private _password: Password;
  private _roles: Role[];
  private _profile: UserProfile;
  private _emailVerified: boolean;
  private _isActive: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _lastLoginAt: Date | undefined;
  private readonly _createdBy: UserId | undefined;

  constructor(props: UserProps) {
    this._id = props.id || UserId.generate();
    this._email = props.email;
    this._password = props.password;
    this._roles = props.roles || [Role.USER];
    this._profile = props.profile || {};
    this._emailVerified = props.emailVerified || false;
    this._isActive = props.isActive !== undefined ? props.isActive : true;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
    this._lastLoginAt = props.lastLoginAt;
    this._createdBy = props.createdBy;
  }

  // Factory method for creating new users
  static create(props: Omit<UserProps, 'id' | 'createdAt' | 'updatedAt'>): User {
    return new User({
      ...props,
      id: UserId.generate(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Getters
  get id(): UserId {
    return this._id;
  }

  get email(): Email {
    return this._email;
  }

  get password(): Password {
    return this._password;
  }

  get roles(): Role[] {
    return [...this._roles];
  }

  get profile(): UserProfile {
    return { ...this._profile };
  }

  get emailVerified(): boolean {
    return this._emailVerified;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get lastLoginAt(): Date | undefined {
    return this._lastLoginAt;
  }

  get createdBy(): UserId | undefined {
    return this._createdBy;
  }

  // Business methods
  validateProfile(): boolean {
    if (!this._profile) return false;
    
    // Basic profile validation rules
    if (this._profile.firstName && this._profile.firstName.trim().length < 2) {
      return false;
    }
    
    if (this._profile.lastName && this._profile.lastName.trim().length < 2) {
      return false;
    }
    
    if (this._profile.phone && !/^\+?[\d\s\-()]{10,}$/.test(this._profile.phone)) {
      return false;
    }
    
    if (this._profile.dateOfBirth && this._profile.dateOfBirth > new Date()) {
      return false;
    }
    
    return true;
  }

  isInRole(role: Role): boolean {
    return this._roles.some(userRole => userRole.equals(role));
  }

  canManageUser(targetUser: User): boolean {
    // System admin can manage anyone
    if (this.isInRole(Role.SYSTEM_ADMIN)) {
      return true;
    }

    // Admin can manage users but not other admins or system admins
    if (this.isInRole(Role.ADMIN)) {
      return targetUser.isInRole(Role.USER) && !targetUser.isInRole(Role.ADMIN) && !targetUser.isInRole(Role.SYSTEM_ADMIN);
    }

    // Regular users can only manage themselves
    return this._id.equals(targetUser.id);
  }

  // Update methods
  updateProfile(profile: Partial<UserProfile>): void {
    this._profile = { ...this._profile, ...profile };
    this._updatedAt = new Date();
  }

  updatePassword(newPassword: Password): void {
    this._password = newPassword;
    this._updatedAt = new Date();
  }

  verifyEmail(): void {
    this._emailVerified = true;
    this._updatedAt = new Date();
  }

  deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  activate(): void {
    this._isActive = true;
    this._updatedAt = new Date();
  }

  updateLastLogin(): void {
    this._lastLoginAt = new Date();
    this._updatedAt = new Date();
  }

  addRole(role: Role): void {
    if (!this.isInRole(role)) {
      this._roles.push(role);
      this._updatedAt = new Date();
    }
  }

  removeRole(role: Role): void {
    this._roles = this._roles.filter(userRole => !userRole.equals(role));
    this._updatedAt = new Date();
  }

  // Domain validation
  canBeCreatedBy(creator: User): boolean {
    // System admin can create anyone
    if (creator.isInRole(Role.SYSTEM_ADMIN)) {
      return true;
    }

    // Admin can only create users, not other admins or system admins
    if (creator.isInRole(Role.ADMIN)) {
      return this._roles.every(role => role.equals(Role.USER));
    }

    return false;
  }
}
