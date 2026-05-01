import { Navigate, Outlet } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission';
import { ROUTES } from '../config/routes.config';

interface RoleBasedRouteProps {
  roles: string | string[];
}

export const RoleBasedRoute = ({ roles }: RoleBasedRouteProps) => {
  const { hasRole } = usePermission();

  if (!hasRole(roles)) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }

  return <Outlet />;
};
