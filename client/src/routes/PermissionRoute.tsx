import { Navigate, Outlet } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission';
import { PermissionValue } from '../config/permissions.config';
import { ROUTES } from '../config/routes.config';

interface PermissionRouteProps {
  permission: PermissionValue | PermissionValue[];
}

export const PermissionRoute = ({ permission }: PermissionRouteProps) => {
  const { hasPermission, isPermissionLoading } = usePermission();

  if (isPermissionLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!hasPermission(permission)) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }

  return <Outlet />;
};
