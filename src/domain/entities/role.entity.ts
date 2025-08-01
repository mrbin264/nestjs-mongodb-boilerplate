export class Role {
  public static readonly SYSTEM_ADMIN = new Role('system_admin', 3);
  public static readonly ADMIN = new Role('admin', 2);
  public static readonly USER = new Role('user', 1);

  private static readonly roleHierarchy = [
    Role.USER,
    Role.ADMIN,
    Role.SYSTEM_ADMIN,
  ];

  private constructor(
    private readonly _value: string,
    private readonly _level: number,
  ) {}

  get value(): string {
    return this._value;
  }

  get level(): number {
    return this._level;
  }

  static fromString(value: string): Role {
    switch (value.toLowerCase()) {
      case 'system_admin':
        return Role.SYSTEM_ADMIN;
      case 'admin':
        return Role.ADMIN;
      case 'user':
        return Role.USER;
      default:
        throw new Error(`Invalid role: ${value}`);
    }
  }

  static getAllRoles(): Role[] {
    return [...Role.roleHierarchy];
  }

  equals(other: Role): boolean {
    return this._value === other._value;
  }

  isHigherThan(other: Role): boolean {
    return this._level > other._level;
  }

  isLowerThan(other: Role): boolean {
    return this._level < other._level;
  }

  canManage(targetRole: Role): boolean {
    // System admin can manage any role
    if (this.equals(Role.SYSTEM_ADMIN)) {
      return true;
    }

    // Admin can only manage user role
    if (this.equals(Role.ADMIN)) {
      return targetRole.equals(Role.USER);
    }

    // User role cannot manage any other roles
    return false;
  }

  toString(): string {
    return this._value;
  }

  toJSON(): string {
    return this._value;
  }
}
