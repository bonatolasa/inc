import { Role } from '../types/user.types';

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  PROJECT_MANAGER: 'project_manager',
  TEAM_MEMBER: 'team_member',
  TESTER: 'tester'
} as const;

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  project_manager: 'Project Manager',
  team_member: 'Team Member',
  tester: 'Tester',
};

export type RoleName = typeof ROLES[keyof typeof ROLES];

export const getRoleDisplayName = (role: string | Role): string => {
  if (role && typeof role === 'object' && role.displayName) {
    return role.displayName;
  }

  const roleKey = typeof role === 'string' ? role : role.name;
  return ROLE_DISPLAY_NAMES[roleKey] ||
    roleKey
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
};
