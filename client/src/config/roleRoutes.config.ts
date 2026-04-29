import { ROLES } from '../utils/roles';
import { ROUTES } from './routes.config';

export const ROLE_DEFAULT_ROUTES: Record<string, string> = {
  [ROLES.SUPER_ADMIN]: ROUTES.SUPER_ADMIN_DASHBOARD,
  [ROLES.ADMIN]: ROUTES.DASHBOARD,
  [ROLES.PROJECT_MANAGER]: ROUTES.DASHBOARD,
  [ROLES.TEAM_MEMBER]: ROUTES.DASHBOARD,
  [ROLES.TESTER]: ROUTES.DASHBOARD,
};

export const ROLE_SIDEBAR_LABELS: Record<string, string> = {
  [ROLES.SUPER_ADMIN]: 'Super Admin Panel',
  [ROLES.ADMIN]: 'Admin Dashboard',
  [ROLES.PROJECT_MANAGER]: 'Project Hub',
  [ROLES.TEAM_MEMBER]: 'My Workspace',
  [ROLES.TESTER]: 'Testing Center',
};

export const getDefaultRouteForRole = (role: string): string => {
  return ROLE_DEFAULT_ROUTES[role] || ROUTES.DASHBOARD;
};

export const getUserDefaultRoute = (roles: string[]): string => {
  // Priority order: super_admin > admin > project_manager > team_member > tester > dashboard
  const priorityOrder = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.PROJECT_MANAGER, ROLES.TEAM_MEMBER, ROLES.TESTER];

  for (const role of priorityOrder) {
    if (roles.includes(role)) {
      return getDefaultRouteForRole(role);
    }
  }

  return ROUTES.DASHBOARD;
};

export const getRoleSpecificRoute = (role: string, currentPath: string): string => {
  // When switching roles, try to stay on equivalent page if possible
  const defaultRoute = getDefaultRouteForRole(role);

  // If we're on a role-specific page that exists for the new role, keep it
  // Otherwise go to the role's default route
  return defaultRoute;
};
