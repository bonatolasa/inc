import { Navigate, Outlet } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission';
import { PermissionValue } from '../config/permissions.config';
import { ROUTES } from '../config/routes.config';

interface AccessRouteProps {
  permissions?: PermissionValue | PermissionValue[];
  roles?: string | string[];
}

export const AccessRoute = ({ permissions, roles }: AccessRouteProps) => {
  const { hasAccess, isPermissionLoading } = usePermission();

  if (!permissions && !roles) {
    return <Outlet />;
  }

  if (isPermissionLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return hasAccess(permissions, roles) ? <Outlet /> : <Navigate to={ROUTES.UNAUTHORIZED} replace />;
};
