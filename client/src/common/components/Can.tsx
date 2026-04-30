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

  const okPerm = permissions ? hasPermission(permissions) : false;
  const okRol = roles ? hasRole(roles) : false;

  if (!permissions && !roles) return <>{children}</>;

  if (okPerm || okRol) {
    return <>{children}</>;
  }

  return null;
};
