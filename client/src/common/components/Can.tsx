import React, { ReactNode } from 'react';
import { usePermission } from '../../hooks/usePermission';
import { PermissionValue } from '../../config/permissions.config';

interface CanProps {
  permissions?: PermissionValue | PermissionValue[];
  roles?: string | string[];
  children: ReactNode;
}

export const Can: React.FC<CanProps> = ({ permissions, roles, children }) => {
  const { hasPermission, hasRole } = usePermission();

  if (!permissions && !roles) return <>{children}</>;

  // Permission-first behavior:
  // If permissions are provided, enforce them.
  // Roles are used only when permissions are not supplied.
  if (permissions) {
    return hasPermission(permissions) ? <>{children}</> : null;
  }

  return roles && hasRole(roles) ? <>{children}</> : null;
};
