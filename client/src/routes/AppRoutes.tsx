import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '../config/routes.config';
import { PERMISSIONS } from '../config/permissions.config';
import { ProtectedRoute } from './ProtectedRoute';
import { AccessRoute } from './AccessRoute';

// Layout
import DashboardLayout from '../layouts/DashboardLayout';

// Pages
import Dashboard from '../pages/dashboard/Dashboard';
import SettingsPage from '../pages/admin/SettingsPage';
import NotFound from '../pages/errors/NotFound';

import Login from '../auth/Login';
import Signup from '../auth/Signup';

// Features
import UsersList from '../features/users/pages/UsersList';
import TeamsList from '../features/teams/pages/TeamsList';
import TeamDetails from '../features/teams/pages/TeamDetails';
import ProjectsList from '../features/projects/pages/ProjectsList';
import ProjectDetails from '../features/projects/pages/ProjectDetails';
import TasksList from '../features/tasks/pages/TasksList';
import TaskDetails from '../features/tasks/pages/TaskDetails';
import RolesList from '../features/roles/pages/RolesList';
 import DashboardReport from '../features/reports/pages/Reports';
import ActivitiesPage from '../features/activities/pages/ActivitiesPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.SIGNUP} element={<Signup />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          
          <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />

          {/* Feature Routes constrained by AccessRoute (Role OR Permission) */}
          <Route element={<AccessRoute roles={['admin', 'super_admin']} permissions={[PERMISSIONS.USERS_VIEW]} />}>
            <Route path={ROUTES.USERS} element={<UsersList />} />
            <Route path={ROUTES.USER_DETAILS()} element={<div>User Details</div>} />
          </Route>

          <Route element={<AccessRoute roles={['admin', 'project_manager', 'super_admin']} permissions={[PERMISSIONS.PROJECTS_VIEW]} />}>
            <Route path={ROUTES.PROJECTS} element={<ProjectsList />} />
            <Route path={ROUTES.PROJECT_DETAILS()} element={<ProjectDetails />} />
          </Route>

          <Route element={<AccessRoute roles={['admin', 'project_manager', 'super_admin']} permissions={[PERMISSIONS.TEAMS_VIEW]} />}>
            <Route path={ROUTES.TEAMS} element={<TeamsList />} />
            <Route path={ROUTES.TEAM_DETAILS()} element={<TeamDetails />} />
          </Route>

          <Route element={<AccessRoute roles={['admin', 'project_manager', 'super_admin', 'team_member', 'tester']} permissions={[PERMISSIONS.TASKS_VIEW]} />}>
            <Route path={ROUTES.TASKS} element={<TasksList />} />
            <Route path={ROUTES.TASK_DETAILS()} element={<TaskDetails />} />
          </Route>

          <Route element={<AccessRoute roles={['admin', 'super_admin']} permissions={[PERMISSIONS.ROLES_VIEW]} />}>
            <Route path="/roles" element={<RolesList />} />
          </Route>

          <Route element={<AccessRoute permissions={[PERMISSIONS.REPORTS_VIEW]} roles={['admin', 'super_admin', 'project_manager']} />}>
            <Route path={ROUTES.REPORTS} element={<DashboardReport />} />
          </Route>

          <Route path="/activities" element={<ActivitiesPage />} />

          <Route element={<AccessRoute roles={['admin', 'super_admin']} />}>
            <Route path={ROUTES.ADMIN_SETTINGS} element={<SettingsPage />} />
          </Route>

          {/* System Administration constrained by Role */}
          <Route element={<AccessRoute roles={['super_admin']} />}>
            <Route path={ROUTES.SUPER_ADMIN_DASHBOARD} element={<Dashboard />} />
          </Route>
        </Route>
      </Route>

      {/* Fallbacks */}
      <Route path={ROUTES.UNAUTHORIZED} element={<div className="p-8 text-red-500 font-bold">403 Unauthorized: Invalid Permissions</div>} />
      <Route path="*" element={<Navigate to={ROUTES.NOT_FOUND} replace />} />
      <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
    </Routes>
  );
};
