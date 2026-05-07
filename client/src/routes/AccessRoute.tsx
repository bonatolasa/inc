import { Navigate, Outlet } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission';
import { PermissionValue } from '../config/permissions.config';
import { ROUTES } from '../config/routes.config';

interface AccessRouteProps {
  permissions?: PermissionValue | PermissionValue[];
  roles?: string | string[];
}

export const AccessRoute = ({ permissions, roles }: AccessRouteProps) => {
  const { hasPermission, hasRole } = usePermission();

  if (!permissions && !roles) {
    return <Outlet />;
  }

  // Permission-first guard:
  // when permissions are defined, they control access for flexible custom roles.
  if (permissions) {
    return hasPermission(permissions) ? <Outlet /> : <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }

  return roles && hasRole(roles) ? <Outlet /> : <Navigate to={ROUTES.UNAUTHORIZED} replace />;
};
