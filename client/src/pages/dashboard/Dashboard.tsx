import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePermission } from '../../hooks/usePermission';
import { reportService } from '../../services/report.service';
import { taskService } from '../../services/task.service';
import { projectService } from '../../services/project.service';
import { Loader } from '../../common/components';
import { PERMISSIONS } from '../../config/permissions.config';
import { getRoleDisplayName } from '../../utils/roles';
import { FolderKanban, Users, CheckSquare, Clock, AlertCircle, TrendingUp, BarChart3 } from 'lucide-react';

const Dashboard = () => {
  const { user, selectedRole } = useAuth();
  const { hasRole, hasPermission } = usePermission();
  const [stats, setStats] = useState<any>(null);
  const [taskStatusData, setTaskStatusData] = useState<Record<string, number>>({});
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = hasRole(['super_admin', 'admin']);
  const isManager = hasRole(['project_manager']);
  const isTester = hasRole(['tester']);
  const isTeamMember = hasRole(['team_member']);
  const currentUserId = (user?._id || (user as any)?.id || '').toString();
  const canViewReports = hasPermission(PERMISSIONS.REPORTS_VIEW);
  const canViewTasks = hasPermission(PERMISSIONS.TASKS_VIEW);
  const canViewProjects = hasPermission(PERMISSIONS.PROJECTS_VIEW);

  useEffect(() => {
    const fetchStats = async () => {
      if (!currentUserId && !canViewReports) return;
      try {
        if (canViewReports && isAdmin) {
          // Admin sees global system stats
          const [dashboardRes, taskStatusRes] = await Promise.all([
            reportService.getDashboardStats(),
            reportService.getTaskStatusDistribution(),
          ]);
          if (dashboardRes.success) {
            setStats(dashboardRes.data);
          }
          if (taskStatusRes.success) {
            setTaskStatusData(taskStatusRes.data);
          }
        } else if (canViewReports && isManager) {
          // Project Manager sees stats for projects they manage
          const [managerRes, taskStatusRes] = await Promise.all([
            reportService.getManagerDashboard(),
            reportService.getTaskStatusDistribution(),
          ]);
          if (managerRes.success) {
            setStats({
              totalTasks: managerRes.data.totalTasks || 0,
              totalProjects: managerRes.data.totalProjects || 0,
              completedTasks: managerRes.data.completedTasks || 0,
              inProgressTasks: managerRes.data.inProgressTasks || 0,
              pendingTasks: managerRes.data.pendingTasks || 0,
              overdueTasks: managerRes.data.overdueTasks || 0,
              taskCompletionRate: managerRes.data.taskCompletionRate || 0,
            });
          }
          if (taskStatusRes.success) {
            setTaskStatusData(taskStatusRes.data);
          }
        } else if (isTester) {
          // Tester sees testing-focused stats (permission-based data sources)
          const calls: Promise<any>[] = [];
          calls.push(canViewTasks ? taskService.getMyTasks() : Promise.resolve({ success: true, data: [] }));
          calls.push(canViewProjects ? projectService.getProjectsByContributor(currentUserId) : Promise.resolve({ success: true, data: [] }));
          const [tasksRes, projectsRes] = await Promise.all(calls);

          const myTasksData = tasksRes.success ? tasksRes.data : [];
          setMyTasks(myTasksData);
          const inProgressTasks = myTasksData.filter((t: any) => t.status === 'in_progress').length;
          const completedTasks = myTasksData.filter((t: any) => t.status === 'completed').length;
          const blockedTasks = myTasksData.filter((t: any) => t.status === 'blocked').length;
          const reviewTasks = myTasksData.filter((t: any) => t.status === 'in_review').length;
          const openTestingTasks = myTasksData.filter((t: any) => t.status !== 'completed').length;

          setStats({
            pendingTasks: openTestingTasks,
            activeProjects: projectsRes.success ? projectsRes.data.length : 0,
            completedTasks,
            inProgressTasks,
            blockedTasks,
            reviewTasks,
            bugsFound: blockedTasks,
            totalTasks: myTasksData.length,
          });
          setTaskStatusData({});
        } else {
          // Team Member sees personal contribution stats
          const calls: Promise<any>[] = [];
          calls.push(canViewTasks ? taskService.getMyTasks() : Promise.resolve({ success: true, data: [] }));
          calls.push(canViewProjects ? projectService.getProjectsByContributor(currentUserId) : Promise.resolve({ success: true, data: [] }));
          calls.push(canViewReports ? reportService.getTaskStatusDistribution() : Promise.resolve({ success: true, data: {} }));
          const [tasksRes, projectsRes, taskStatusRes] = await Promise.all(calls);

          const myTasksData = tasksRes.success ? tasksRes.data : [];
          setMyTasks(myTasksData);

          setStats({
            pendingTasks: myTasksData.filter((t: any) => t.status === 'pending').length,
            inProgressTasks: myTasksData.filter((t: any) => t.status === 'in_progress').length,
            activeProjects: projectsRes.success ? projectsRes.data.length : 0,
            completedTasks: myTasksData.filter((t: any) => t.status === 'completed').length,
            totalTasks: myTasksData.length,
          });

          if (taskStatusRes.success) {
            setTaskStatusData(taskStatusRes.data);
          }
        }
      } catch (error) {
        console.error("Dashboard data fetch failed", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [isAdmin, isManager, isTester, isTeamMember, currentUserId, canViewReports, canViewTasks, canViewProjects]);

  if (loading) return <Loader />;

  const roleDisplay = selectedRole ? getRoleDisplayName(selectedRole) : (isAdmin ? getRoleDisplayName('admin') : isManager ? getRoleDisplayName('project_manager') : isTester ? getRoleDisplayName('tester') : getRoleDisplayName('team_member'));

  // Calculate metrics
  const totalTasks = stats?.totalTasks || stats?.totalTasks || 0;
  const completedTasks = stats?.completedTasks || stats?.completedTasks || 0;
  const pendingTasks = stats?.pendingTasks || stats?.pendingTasks || 0;
  const activeProjects = stats?.activeProjects || stats?.totalProjects || 0;
  const completionRate = stats?.taskCompletionRate || (totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0);
  const inProgressTasks = stats?.inProgressTasks || 0;

  // Team Member/Tester should see their own distribution; admin/manager can use report distribution.
  const personalTaskDistribution = myTasks.reduce((acc: Record<string, number>, t: any) => {
    const key = t?.status || 'pending';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const fallbackDistribution = {
    pending: pendingTasks,
    in_progress: inProgressTasks,
    completed: completedTasks,
    blocked: stats?.overdueTasks || 0,
    in_review: 0,
  };
  const taskDistribution =
    (isTeamMember || isTester)
      ? (Object.keys(personalTaskDistribution).length > 0 ? personalTaskDistribution : fallbackDistribution)
      : (Object.keys(taskStatusData).length > 0 ? taskStatusData : fallbackDistribution);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            {isAdmin ? 'System Overview' : isManager ? 'Management Hub' : isTester ? 'Testing Dashboard' : `My Dashboard`}
          </h1>
          {isAdmin && (
            <p className="text-gray-500 font-medium mt-1">
              Platform-wide metrics and performance indicators
            </p>
          )}
          {isManager && (
            <p className="text-gray-500 font-medium mt-1">
              Project and team performance overview
            </p>
          )}
          {isTester && (
            <p className="text-gray-500 font-medium mt-1">
              Testing progress and quality metrics
            </p>
          )}
          {isTeamMember && (
            <p className="text-gray-500 font-medium mt-1">
              Your personal contributions and tasks
            </p>
          )}
        </div>
        {selectedRole && (
          <div className="px-4 py-2 bg-purple-50 border border-purple-200 rounded-xl">
            <span className="text-sm font-bold text-purple-700">
              Working as: {roleDisplay}
            </span>
          </div>
        )}
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Tasks Card */}
        <div className="p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 hover:border-blue-100 transition-all duration-300">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm shadow-blue-100">
             <CheckSquare className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2 whitespace-nowrap">
            {isAdmin ? 'System Tasks' : isManager ? 'Oversight Tasks' : isTester ? 'Testing Tasks' : 'My Tasks'}
          </h2>
          <p className="text-gray-500 font-semibold">
            {isAdmin ? 'Total tracked tasks:' : isManager ? 'Tasks under management:' : isTester ? 'Issues to verify:' : 'Pending tasks:'}
            <span className="text-blue-600 font-black ml-1">
              {isAdmin ? stats?.totalTasks : pendingTasks}
            </span>
          </p>
        </div>

        {/* Projects Card */}
        <div className="p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 hover:border-green-100 transition-all duration-300">
          <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm shadow-green-100">
             <FolderKanban className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2 whitespace-nowrap">
              {isAdmin ? 'Managed Projects' : isManager ? 'Active Portfolios' : isTester ? 'Testing Projects' : 'My Projects'}
          </h2>
          <p className="text-gray-500 font-semibold">
            {isAdmin ? 'Active system projects:' : isManager ? 'Projects managing:' : isTester ? 'Projects in testing:' : 'Active in projects:'}
            <span className="text-green-600 font-black ml-1">
              {activeProjects}
            </span>
          </p>
        </div>

        {/* Completion Card */}
        <div className="p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 hover:border-green-100 transition-all duration-300">
          <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm shadow-green-100">
             <TrendingUp className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2 whitespace-nowrap">
            {isAdmin ? 'Completion Rate' : isManager ? 'Team Efficiency' : isTester ? 'Bug Resolution' : 'Personal Progress'}
          </h2>
          <p className="text-gray-500 font-semibold">
            {isAdmin ? 'Overall system completion:' : isManager ? 'Tasks completed:' : isTester ? 'Bugs resolved:' : 'Tasks completed:'}
            <span className="text-green-600 font-black ml-1">
              {completedTasks}
            </span>
          </p>
          <div className="mt-4 w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(completionRate, 100)}%` }}
            />
          </div>
          <p className="text-xs font-bold text-gray-500 mt-2">{completionRate}% completion</p>
        </div>
      </div>

      {/* Secondary KPI Row */}
      {(isAdmin || isManager) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-bold text-gray-500">Platform Users</span>
            </div>
            <div className="text-2xl font-black text-gray-900">{stats?.totalUsers || 0}</div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-bold text-gray-500">
                {isAdmin ? 'Overdue Tasks' : 'Overdue'}
              </span>
            </div>
            <div className="text-2xl font-black text-gray-900">{stats?.overdueTasks || 0}</div>
          </div>

          {isManager && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-bold text-gray-500">Completion Rate</span>
              </div>
              <div className="text-2xl font-black text-gray-900">{completionRate}%</div>
            </div>
          )}

          {isTester && (
            <div className="bg-red-50 p-6 rounded-2xl border border-red-200">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm font-bold text-red-700">Bugs Found</span>
              </div>
              <div className="text-2xl font-black text-red-700">{stats?.bugsFound || 0}</div>
            </div>
          )}
        </div>
      )}

      {/* Task Status Breakdown */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-primary" />
          Task Status Distribution
        </h3>
       {Object.keys(taskDistribution).length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(taskDistribution).map(([status, count]) => {
              const total = Object.values(taskDistribution).reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
              const colorConfig = (() => {
                switch (status) {
                  case 'pending':
                    return { bg: 'bg-yellow-400', text: 'text-yellow-700', light: 'bg-yellow-50', border: 'border-yellow-200' };
                  case 'in_progress':
                    return { bg: 'bg-blue-500', text: 'text-blue-700', light: 'bg-blue-50', border: 'border-blue-200' };
                  case 'in_review':
                    return { bg: 'bg-purple-500', text: 'text-purple-700', light: 'bg-purple-50', border: 'border-purple-200' };
                  case 'completed':
                    return { bg: 'bg-green-500', text: 'text-green-700', light: 'bg-green-50', border: 'border-green-200' };
                  case 'blocked':
                    return { bg: 'bg-red-500', text: 'text-red-700', light: 'bg-red-50', border: 'border-red-200' };
                  default:
                    return { bg: 'bg-gray-400', text: 'text-gray-700', light: 'bg-gray-50', border: 'border-gray-200' };
                }
              })();
              return (
                <div key={status} className={`p-4 rounded-xl border-2 ${colorConfig.light} ${colorConfig.border}`}>
                  <div className="text-2xl font-black text-gray-900 mb-1">{count}</div>
                  <div className={`text-sm font-semibold mb-2 capitalize ${colorConfig.text}`}>
                    {status.replace('_', ' ')}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-full rounded-full ${colorConfig.bg}`} style={{ width: `${percentage}%` }} />
                  </div>
                  <div className="text-xs font-bold text-gray-500 mt-1">{percentage}%</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center text-gray-400">
            <BarChart3 className="w-8 h-8 mr-2" />
            <span>No task status data available</span>
          </div>
        )}
      </div>

      {/* Role-specific Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tester-specific: Bug Summary */}
        {isTester && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
              Bug Summary
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl">
                <span className="font-medium text-gray-700">Blocked / Bug Tasks</span>
                <span className="text-xl font-black text-red-600">{stats?.blockedTasks || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                <span className="font-medium text-gray-700">Testing Tasks Completed</span>
                <span className="text-xl font-black text-green-600">{stats?.completedTasks || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-xl">
                <span className="font-medium text-gray-700">In Review</span>
                <span className="text-xl font-black text-yellow-600">{stats?.reviewTasks || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
                <span className="font-medium text-gray-700">Active Testing Projects</span>
                <span className="text-xl font-black text-blue-600">{stats?.activeProjects || 0}</span>
              </div>
            </div>
          </div>
        )}

        {/* Team Member-specific: Personal Progress */}
        {isTeamMember && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center">
              <CheckSquare className="w-5 h-5 mr-2 text-green-500" />
              Your Progress
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                <span className="font-medium text-gray-700">Tasks Completed</span>
                <span className="text-xl font-black text-green-600">{stats?.completedTasks || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-xl">
                <span className="font-medium text-gray-700">Tasks In Progress</span>
                <span className="text-xl font-black text-yellow-600">{inProgressTasks}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
                <span className="font-medium text-gray-700">Total Tasks</span>
                <span className="text-xl font-black text-blue-600">{totalTasks}</span>
              </div>
              <div className="pt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 font-medium">Overall Progress</span>
                  <span className="font-bold text-gray-900">{completionRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full" style={{ width: `${completionRate}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manager-specific: Team Oversight */}
        {isManager && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-purple-500" />
              Management Overview
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-xl">
                <span className="font-medium text-gray-700">Projects Managed</span>
                <span className="text-xl font-black text-purple-600">{activeProjects}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
                <span className="font-medium text-gray-700">Tasks Under Oversight</span>
                <span className="text-xl font-black text-blue-600">{totalTasks}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                <span className="font-medium text-gray-700">Completion Rate</span>
                <span className="text-xl font-black text-green-600">{completionRate}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Admin-specific: System Health */}
        {isAdmin && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
              System Health
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
                <span className="font-medium text-gray-700">Total Users</span>
                <span className="text-xl font-black text-blue-600">{stats?.totalUsers || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                <span className="font-medium text-gray-700">Overall Completion</span>
                <span className="text-xl font-black text-green-600">{completionRate}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl">
                <span className="font-medium text-gray-700">Overdue Tasks</span>
                <span className="text-xl font-black text-red-600">{stats?.overdueTasks || 0}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
