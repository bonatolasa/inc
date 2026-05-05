export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
export const API_DEPLOYED = import.meta.env.VITE_API_DEPLOYED || 'https://pro-mgt.onrender.com/api';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    VERIFY_PASSWORD: '/auth/verify-password',
    ACCEPT_INVITE: '/auth/accept-invite',
  },
  USERS: {
    ME: '/users/me',
    BASE: '/users',
    INVITE: '/users/invite',
    ROLES: (userId: string) => `/users/${userId}/roles`,
    MANAGERS_STATS: '/users/managers/stats',
    MEMBERS: '/users/members',
    BY_ROLE: (roleName: string) => `/users/role/${roleName}`,
    BY_TEAM: (teamId: string) => `/users/team/${teamId}`,
  },
  TEAMS: {
    BASE: '/teams',
    MY_TEAM: '/teams/my-team',
    MY_TEAMS: '/teams/my-teams',
    ADD_MEMBER: (teamId: string, userId: string) => `/teams/${teamId}/members/${userId}`,
    BY_MANAGER: (managerId: string) => `/teams/manager/${managerId}`,
    MEMBERS: (teamId: string) => `/teams/${teamId}/members`,
  },
  PROJECTS: {
    BASE: '/projects',
    BY_TEAM: (teamId: string) => `/projects/team/${teamId}`,
    BY_MANAGER: (managerId: string) => `/projects/manager/${managerId}`,
    BY_CONTRIBUTOR: (userId: string) => `/projects/contributor/${userId}`,
    PROGRESS: (projectId: string) => `/projects/${projectId}/progress`,
  },
  TASKS: {
    BASE: '/tasks',
    MY_TASKS: '/tasks/my-tasks',
    DUE_SOON: '/tasks/due-soon',
    OVERDUE: '/tasks/overdue',
    BY_PROJECT: (projectId: string) => `/tasks/project/${projectId}`,
    BY_USER: (userId: string) => `/tasks/user/${userId}`,
    BY_CREATOR: (userId: string) => `/tasks/creator/${userId}`,
    PROGRESS: (taskId: string) => `/tasks/${taskId}/progress`,
    STATISTICS: (projectId: string) => `/tasks/statistics/${projectId}`,
    COMMENTS: (taskId: string) => `/tasks/${taskId}/comments`,
    ATTACHMENTS: (taskId: string) => `/tasks/${taskId}/attachments`,
  },
  REPORTS: {
    DASHBOARD: '/reports/dashboard',
    MANAGER_DASHBOARD: '/reports/manager-dashboard',
    PROJECT_PERFORMANCE: (projectId: string) => `/reports/project-performance/${projectId}`,
    USER_PERFORMANCE: (userId: string) => `/reports/user-performance/${userId}`,
    TEAM_PERFORMANCE: (teamId: string) => `/reports/team-performance/${teamId}`,
    TEAM_WORKLOAD: (teamId: string) => `/reports/team-workload/${teamId}`,
    TASK_STATUS: '/reports/task-status-distribution',
    PROJECT_STATUS: '/reports/project-status-distribution',
    TIME_TRACKING: '/reports/time-tracking',
  },
  ROLES: {
    BASE: '/roles',
    RENAME: (roleName: string) => `/roles/${roleName}/rename`,
    DISPLAY_NAME: (roleName: string) => `/roles/${roleName}/display-name`,
    PERMISSIONS: (roleName: string) => `/roles/${roleName}/permissions`,
  },
  PERMISSIONS: {
    BASE: '/permissions',
  },
  NOTIFICATIONS: {
    BASE: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
  },
  COMMENTS: {
    BASE: '/comments',
  },
  ATTACHMENTS: {
    BASE: '/attachments',
    DOWNLOAD: (filename: string) => `/uploads/${filename}`,
  },
  ACTIVITIES: {
    BASE: '/activities',
  }
};
