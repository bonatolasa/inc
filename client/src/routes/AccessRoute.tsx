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

  const hasPerm = permissions ? hasPermission(permissions) : false;
  const hasRol = roles ? hasRole(roles) : false;

  if (!permissions && !roles) {
    return <Outlet />;
  }

  if (hasPerm || hasRol) {
    return <Outlet />;
  }

  return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
};
