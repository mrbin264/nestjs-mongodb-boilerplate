import { Role } from '../../../src/domain/entities/role.entity';

describe('Role Entity', () => {
  describe('Role Creation', () => {
    it('should have predefined roles', () => {
      expect(Role.SYSTEM_ADMIN.value).toBe('system_admin');
      expect(Role.ADMIN.value).toBe('admin');
      expect(Role.USER.value).toBe('user');
    });

    it('should have correct hierarchy levels', () => {
      expect(Role.SYSTEM_ADMIN.level).toBe(3);
      expect(Role.ADMIN.level).toBe(2);
      expect(Role.USER.level).toBe(1);
    });

    it('should create roles from string', () => {
      expect(Role.fromString('system_admin')).toBe(Role.SYSTEM_ADMIN);
      expect(Role.fromString('admin')).toBe(Role.ADMIN);
      expect(Role.fromString('user')).toBe(Role.USER);
    });

    it('should be case insensitive when creating from string', () => {
      expect(Role.fromString('SYSTEM_ADMIN')).toBe(Role.SYSTEM_ADMIN);
      expect(Role.fromString('Admin')).toBe(Role.ADMIN);
      expect(Role.fromString('USER')).toBe(Role.USER);
    });

    it('should throw error for invalid role string', () => {
      expect(() => Role.fromString('invalid_role')).toThrow('Invalid role: invalid_role');
    });
  });

  describe('Role Comparison', () => {
    it('should check role equality', () => {
      const role1 = Role.ADMIN;
      const role2 = Role.fromString('admin');
      const role3 = Role.USER;

      expect(role1.equals(role2)).toBe(true);
      expect(role1.equals(role3)).toBe(false);
    });

    it('should check role hierarchy - higher than', () => {
      expect(Role.SYSTEM_ADMIN.isHigherThan(Role.ADMIN)).toBe(true);
      expect(Role.SYSTEM_ADMIN.isHigherThan(Role.USER)).toBe(true);
      expect(Role.ADMIN.isHigherThan(Role.USER)).toBe(true);
      
      expect(Role.USER.isHigherThan(Role.ADMIN)).toBe(false);
      expect(Role.ADMIN.isHigherThan(Role.SYSTEM_ADMIN)).toBe(false);
    });

    it('should check role hierarchy - lower than', () => {
      expect(Role.USER.isLowerThan(Role.ADMIN)).toBe(true);
      expect(Role.USER.isLowerThan(Role.SYSTEM_ADMIN)).toBe(true);
      expect(Role.ADMIN.isLowerThan(Role.SYSTEM_ADMIN)).toBe(true);
      
      expect(Role.ADMIN.isLowerThan(Role.USER)).toBe(false);
      expect(Role.SYSTEM_ADMIN.isLowerThan(Role.ADMIN)).toBe(false);
    });
  });

  describe('Role Management', () => {
    it('should determine what roles can be managed', () => {
      expect(Role.SYSTEM_ADMIN.canManage(Role.SYSTEM_ADMIN)).toBe(true);
      expect(Role.SYSTEM_ADMIN.canManage(Role.ADMIN)).toBe(true);
      expect(Role.SYSTEM_ADMIN.canManage(Role.USER)).toBe(true);

      expect(Role.ADMIN.canManage(Role.SYSTEM_ADMIN)).toBe(false);
      expect(Role.ADMIN.canManage(Role.ADMIN)).toBe(false);
      expect(Role.ADMIN.canManage(Role.USER)).toBe(true);

      expect(Role.USER.canManage(Role.SYSTEM_ADMIN)).toBe(false);
      expect(Role.USER.canManage(Role.ADMIN)).toBe(false);
      expect(Role.USER.canManage(Role.USER)).toBe(false);
    });
  });

  describe('Role Serialization', () => {
    it('should convert to string', () => {
      expect(Role.SYSTEM_ADMIN.toString()).toBe('system_admin');
      expect(Role.ADMIN.toString()).toBe('admin');
      expect(Role.USER.toString()).toBe('user');
    });

    it('should serialize to JSON', () => {
      expect(Role.SYSTEM_ADMIN.toJSON()).toBe('system_admin');
      expect(Role.ADMIN.toJSON()).toBe('admin');
      expect(Role.USER.toJSON()).toBe('user');
    });
  });

  describe('Role Utilities', () => {
    it('should get all roles', () => {
      const allRoles = Role.getAllRoles();
      
      expect(allRoles).toHaveLength(3);
      expect(allRoles).toContain(Role.USER);
      expect(allRoles).toContain(Role.ADMIN);
      expect(allRoles).toContain(Role.SYSTEM_ADMIN);
    });

    it('should maintain hierarchy order in getAllRoles', () => {
      const allRoles = Role.getAllRoles();
      
      expect(allRoles[0]).toBe(Role.USER);
      expect(allRoles[1]).toBe(Role.ADMIN);
      expect(allRoles[2]).toBe(Role.SYSTEM_ADMIN);
    });
  });
});
