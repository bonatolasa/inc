export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  
  DASHBOARD: '/dashboard',
  
  // Feature Pages
  USERS: '/users',
  USER_DETAILS: (id: string = ':id') => `/users/${id}`,
  
  TEAMS: '/teams',
  TEAM_DETAILS: (id: string = ':id') => `/teams/${id}`,
  
  PROJECTS: '/projects',
  PROJECT_DETAILS: (id: string = ':id') => `/projects/${id}`,
  
  TASKS: '/tasks',
  TASK_DETAILS: (id: string = ':id') => `/tasks/${id}`,
  
  REPORTS: '/reports',
  
  // Roles
  SUPER_ADMIN_DASHBOARD: '/super-admin',
  ADMIN_SETTINGS: '/admin/settings',
  
  NOT_FOUND: '/404',
  UNAUTHORIZED: '/unauthorized',
};
