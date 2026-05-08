import React, { createContext, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { PermissionValue } from '../config/permissions.config';

interface PermissionContextType {
  hasPermission: (permission: PermissionValue | PermissionValue[]) => boolean;
  hasRole: (roleName: string | string[]) => boolean;
  hasAccess: (permissions?: PermissionValue | PermissionValue[], roles?: string | string[]) => boolean;
  getUserPermissions: () => string[];
}

export const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const PermissionProvider = ({ children }: { children: ReactNode }) => {
  const { user, selectedRole } = useAuth();

  const getSelectedRolePermissions = (): string[] => {
    if (!user || !selectedRole || !Array.isArray(user.roles)) return [];
    const roleObj = (user.roles as any[]).find((r: any) => {
      const roleName = typeof r === 'string' ? r : r?.name;
      return (roleName || '').toLowerCase() === selectedRole.toLowerCase();
    });
    if (roleObj && typeof roleObj !== 'string' && Array.isArray(roleObj.permissions)) {
      return roleObj.permissions;
    }
    return [];
  };

  const getUserPermissions = (): string[] => {
    if (!user) return [];

    const permissions = new Set<string>();

    // When a role is selected, scope permissions to that role only.
    const selectedRolePermissions = getSelectedRolePermissions();
    if (selectedRole && selectedRolePermissions.length > 0) {
      selectedRolePermissions.forEach((p: string) => permissions.add(p));
      return Array.from(permissions);
    }

    // Fallback: use merged direct permissions if role-scoped permissions are unavailable.
    if (Array.isArray(user.permissions)) {
      user.permissions.forEach((p: string) => permissions.add(p));
    }

    return Array.from(permissions);
  };

  const hasRole = (roleName: string | string[]): boolean => {
    if (!user || !user.roles) return false;

    // If a specific role is selected, only check against that role
    if (selectedRole) {
      const checkAgainst = Array.isArray(roleName) ? roleName : [roleName];
      return checkAgainst.map(r => r.toLowerCase()).includes(selectedRole.toLowerCase());
    }

    // No role selected - check all user roles
    const userRoles = Array.isArray(user.roles)
      ? user.roles.map((r: any) => typeof r === 'string' ? r.toLowerCase() : r.name?.toLowerCase())
      : [];

    if (Array.isArray(roleName)) {
      return roleName.some(r => userRoles.includes(r.toLowerCase()));
    }
    return userRoles.includes(roleName.toLowerCase());
  };

  const hasPermission = (permission: PermissionValue | PermissionValue[]): boolean => {
    if (!user) return false;

    const userPermissions = getUserPermissions();

    if (userPermissions.includes('ALL') || userPermissions.includes('*')) return true;

    // Check single permission or array
    if (Array.isArray(permission)) {
      return permission.some(p => userPermissions.includes(p));
    }
    return userPermissions.includes(permission);
  };

  const hasAccess = (permissions?: PermissionValue | PermissionValue[], roles?: string | string[]) => {
    if (!permissions && !roles) return true;
    const okPerm = permissions ? hasPermission(permissions) : false;
    const okRole = roles ? hasRole(roles) : false;
    return okPerm || okRole;
  };

  return (
    <PermissionContext.Provider value={{ hasPermission, hasRole, hasAccess, getUserPermissions }}>
      {children}
    </PermissionContext.Provider>
  );
};
