import { PERMISSIONS, type PermissionValue } from './permissions.config';

export type PermissionItem = {
  key: PermissionValue;
  label: string;
};

export type PermissionGroup = {
  id: string;
  label: string;
  permissions: PermissionItem[];
};

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: 'USERS',
    label: 'User Management',
    permissions: [
      { key: PERMISSIONS.USERS_VIEW, label: 'View Users' },
      { key: PERMISSIONS.USERS_CREATE, label: 'Create Users' },
      { key: PERMISSIONS.USERS_UPDATE, label: 'Update Users' },
      { key: PERMISSIONS.USERS_DELETE, label: 'Delete Users' },
      { key: PERMISSIONS.USERS_ASSIGN_ROLES, label: 'Assign User Roles' },
    ],
  },
  {
    id: 'TEAMS',
    label: 'Team Management',
    permissions: [
      { key: PERMISSIONS.TEAMS_VIEW, label: 'View Teams' },
      { key: PERMISSIONS.TEAMS_VIEW_ALL, label: 'View All Teams' },
      { key: PERMISSIONS.TEAMS_CREATE, label: 'Create Teams' },
      { key: PERMISSIONS.TEAMS_UPDATE, label: 'Update Teams' },
      { key: PERMISSIONS.TEAMS_DELETE, label: 'Delete Teams' },
    ],
  },
  {
    id: 'PROJECTS',
    label: 'Project Management',
    permissions: [
      { key: PERMISSIONS.PROJECTS_VIEW, label: 'View Projects' },
      { key: PERMISSIONS.PROJECTS_VIEW_ALL, label: 'View All Projects' },
      { key: PERMISSIONS.PROJECTS_CREATE, label: 'Create Projects' },
      { key: PERMISSIONS.PROJECTS_UPDATE, label: 'Update Projects' },
      { key: PERMISSIONS.PROJECTS_DELETE, label: 'Delete Projects' },
    ],
  },
  {
    id: 'TASKS',
    label: 'Task Management',
    permissions: [
      { key: PERMISSIONS.TASKS_VIEW, label: 'View Tasks' },
      { key: PERMISSIONS.TASKS_VIEW_ALL, label: 'View All Tasks' },
      { key: PERMISSIONS.TASKS_CREATE, label: 'Create Tasks' },
      { key: PERMISSIONS.TASKS_UPDATE, label: 'Update Tasks' },
      { key: PERMISSIONS.TASKS_DELETE, label: 'Delete Tasks' },
      { key: PERMISSIONS.TASKS_ASSIGN, label: 'Assign Tasks' },
      { key: PERMISSIONS.TASKS_TEST_UPDATE, label: 'Legacy QA Task Update' },
      { key: PERMISSIONS.TEST_TASK, label: 'Test Task' },
      { key: PERMISSIONS.REPORT_BUG, label: 'Report Bug' },
      { key: PERMISSIONS.VERIFY_TASK, label: 'Verify Task' },
    ],
  },
  {
    id: 'ROLES',
    label: 'Role & Permission Management',
    permissions: [
      { key: PERMISSIONS.ROLES_VIEW, label: 'View Roles' },
      { key: PERMISSIONS.ROLES_CREATE, label: 'Create Roles' },
      { key: PERMISSIONS.ROLES_UPDATE, label: 'Update Roles' },
      { key: PERMISSIONS.ROLES_DELETE, label: 'Delete Roles' },
      { key: PERMISSIONS.ROLES_ASSIGN_PERMISSIONS, label: 'Assign Permissions to Roles' },
    ],
  },
  {
    id: 'COMMENTS',
    label: 'Comments',
    permissions: [
      { key: PERMISSIONS.COMMENTS_CREATE, label: 'Create Comments' },
      { key: PERMISSIONS.COMMENTS_VIEW, label: 'View Comments' },
      { key: PERMISSIONS.COMMENTS_DELETE, label: 'Delete Comments' },
    ],
  },
  {
    id: 'ATTACHMENTS',
    label: 'Attachments',
    permissions: [
      { key: PERMISSIONS.ATTACHMENTS_UPLOAD, label: 'Upload Attachments' },
      { key: PERMISSIONS.ATTACHMENTS_VIEW, label: 'View Attachments' },
      { key: PERMISSIONS.ATTACHMENTS_DELETE, label: 'Delete Attachments' },
    ],
  },
  {
    id: 'REPORTS',
    label: 'Reports & Analytics',
    permissions: [
      { key: PERMISSIONS.REPORTS_VIEW, label: 'View Reports Dashboard' },
      { key: PERMISSIONS.REPORTS_EXPORT, label: 'Export Reports' },
    ],
  },
  {
    id: 'SYSTEM',
    label: 'System',
    permissions: [
      { key: PERMISSIONS.PERMISSIONS_VIEW, label: 'View All Permissions' },
      { key: PERMISSIONS.NOTIFICATIONS_VIEW, label: 'View Notifications' },
    ],
  },
];

export const dedupePermissions = <T extends string>(permissions: T[]): T[] =>
  Array.from(new Set(permissions));
