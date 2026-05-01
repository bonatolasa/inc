import React, { useEffect, useState } from 'react';
import { reportService } from '../../../services/report.service';
import Loader from '../../../common/components/Loader';
import {
  BarChart3,
  Users,
  FolderKanban,
  CheckSquare,
  AlertCircle
} from 'lucide-react';

interface ReportStats {
  totalUsers?: number;
  totalProjects?: number;
  totalTasks?: number;
  completedTasks?: number;
  activeProjects?: number;
  overdueTasks?: number;
  taskCompletionRate?: number;
  projectStatus?: Record<string, number>;
  taskStatus?: Record<string, number>;
}

const Reports = () => {
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'tasks'>('overview');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const [dashboardRes, projectStatusRes, taskStatusRes] = await Promise.all([
        reportService.getDashboardStats(),
        reportService.getProjectStatusDistribution(),
        reportService.getTaskStatusDistribution(),
      ]);

      if (dashboardRes.success) {
        setStats({
          ...(dashboardRes.data || {}),
          projectStatus: projectStatusRes.success ? projectStatusRes.data : undefined,
          taskStatus: taskStatusRes.success ? taskStatusRes.data : undefined,
        });
      }
    } catch (error) {
      console.error("Failed to fetch reports", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  const totalTasks = stats?.totalTasks || 0;
  const completedTasks = stats?.completedTasks || 0;
  const completionRate = stats?.taskCompletionRate || (totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0);

  const renderOverview = () => (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-2xl font-black text-blue-600">{stats?.totalUsers || 0}</span>
          </div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Users</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <FolderKanban className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-2xl font-black text-green-600">{stats?.totalProjects || 0}</span>
          </div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Projects</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-xl">
              <CheckSquare className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-2xl font-black text-purple-600">{totalTasks}</span>
          </div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Tasks</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-50 rounded-xl">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-2xl font-black text-orange-600">{completionRate}%</span>
          </div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Task Completion</h3>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-orange-400 to-green-500 h-2 rounded-full transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Distribution */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center">
            <FolderKanban className="w-5 h-5 mr-2 text-primary" />
            Project Status Overview
          </h3>
          {stats?.projectStatus ? (
            <div className="space-y-4">
              {Object.entries(stats.projectStatus).map(([status, count]) => {
                const total = Object.values(stats.projectStatus!).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                const colors: Record<string, { bg: string; text: string; light: string }> = {
                  planning: { bg: 'bg-gray-400', text: 'text-gray-700', light: 'bg-gray-100' },
                  in_progress: { bg: 'bg-blue-500', text: 'text-blue-700', light: 'bg-blue-100' },
                  on_hold: { bg: 'bg-yellow-500', text: 'text-yellow-700', light: 'bg-yellow-100' },
                  completed: { bg: 'bg-green-500', text: 'text-green-700', light: 'bg-green-100' },
                  cancelled: { bg: 'bg-red-500', text: 'text-red-700', light: 'bg-red-100' },
                };
                const c = colors[status] || { bg: 'bg-gray-400', text: 'text-gray-700', light: 'bg-gray-100' };
                return (
                  <div key={status} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className={`font-bold capitalize ${c.text}`}>{status.replace('_', ' ')}</span>
                      <span className="font-black text-gray-900">{count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${c.bg}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              <AlertCircle className="w-12 h-12 mb-2" />
              <p>No project data available</p>
            </div>
          )}
        </div>

        {/* Task Status Distribution */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center">
            <CheckSquare className="w-5 h-5 mr-2 text-primary" />
            Task Status Overview
          </h3>
          {stats?.taskStatus ? (
            <div className="space-y-4">
              {Object.entries(stats.taskStatus).map(([status, count]) => {
                const total = Object.values(stats.taskStatus!).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                const colors: Record<string, { bg: string; text: string; light: string }> = {
                  pending: { bg: 'bg-yellow-400', text: 'text-yellow-700', light: 'bg-yellow-100' },
                  in_progress: { bg: 'bg-blue-500', text: 'text-blue-700', light: 'bg-blue-100' },
                  in_review: { bg: 'bg-purple-500', text: 'text-purple-700', light: 'bg-purple-100' },
                  completed: { bg: 'bg-green-500', text: 'text-green-700', light: 'bg-green-100' },
                  blocked: { bg: 'bg-red-500', text: 'text-red-700', light: 'bg-red-100' },
                };
                const c = colors[status] || { bg: 'bg-gray-400', text: 'text-gray-700', light: 'bg-gray-100' };
                return (
                  <div key={status} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className={`font-bold capitalize ${c.text}`}>{status.replace('_', ' ')}</span>
                      <span className="font-black text-gray-900">{count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${c.bg}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              <AlertCircle className="w-12 h-12 mb-2" />
              <p>No task data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Task Summary Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-black text-gray-900 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-primary" />
            Task Status Breakdown
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Count</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Percentage</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats?.taskStatus &&
                Object.entries(stats.taskStatus).map(([status, count]) => {
                  const total = Object.values(stats.taskStatus!).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                  const statusColors: Record<string, { bg: string; text: string; light: string }> = {
                    pending: { bg: 'bg-yellow-400', text: 'text-yellow-700', light: 'bg-yellow-100' },
                    in_progress: { bg: 'bg-blue-500', text: 'text-blue-700', light: 'bg-blue-100' },
                    in_review: { bg: 'bg-purple-500', text: 'text-purple-700', light: 'bg-purple-100' },
                    completed: { bg: 'bg-green-500', text: 'text-green-700', light: 'bg-green-100' },
                    blocked: { bg: 'bg-red-500', text: 'text-red-700', light: 'bg-red-100' },
                  };
                  const colors = statusColors[status] || { bg: 'bg-gray-400', text: 'text-gray-700', light: 'bg-gray-100' };
                  return (
                    <tr key={status} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold capitalize ${colors.light} ${colors.text}`}>
                          {status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-lg font-black text-gray-900">{count}</td>
                      <td className="px-6 py-4 text-lg font-bold text-gray-700">{percentage}%</td>
                      <td className="px-6 py-4">
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${colors.bg}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderProjectsTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center">
          <FolderKanban className="w-5 h-5 mr-2 text-primary" />
          Project Status Details
        </h3>
        {stats?.projectStatus ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(stats.projectStatus).map(([status, count]) => {
              const total = Object.values(stats.projectStatus!).reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
              const colors: Record<string, { bg: string; text: string; border: string; light: string }> = {
                planning: { bg: 'bg-gray-400', text: 'text-gray-700', border: 'border-gray-300', light: 'bg-gray-100' },
                in_progress: { bg: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-300', light: 'bg-blue-50' },
                on_hold: { bg: 'bg-yellow-500', text: 'text-yellow-700', border: 'border-yellow-300', light: 'bg-yellow-50' },
                completed: { bg: 'bg-green-500', text: 'text-green-700', border: 'border-green-300', light: 'bg-green-50' },
                cancelled: { bg: 'bg-red-500', text: 'text-red-700', border: 'border-red-300', light: 'bg-red-50' },
              };
              const c = colors[status] || { bg: 'bg-gray-400', text: 'text-gray-700', border: 'border-gray-300', light: 'bg-gray-50' };
              return (
                <div key={status} className={`p-4 rounded-xl border-2 ${c.light} ${c.border}`}>
                  <div className="text-3xl font-black text-gray-900 mb-1">{count}</div>
                  <div className="text-sm font-semibold text-gray-600 mb-3 capitalize">{status.replace('_', ' ')}</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-full rounded-full ${c.bg}`} style={{ width: `${percentage}%` }} />
                  </div>
                  <div className="text-xs font-bold text-gray-500 mt-1">{percentage}%</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center text-gray-400">
            <AlertCircle className="w-8 h-8 mr-2" />
            No project status data
          </div>
        )}
      </div>
    </div>
  );

  const renderTasksTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center">
          <CheckSquare className="w-5 h-5 mr-2 text-primary" />
          Task Status Breakdown
        </h3>
        {stats?.taskStatus ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(stats.taskStatus).map(([status, count]) => {
              const total = Object.values(stats.taskStatus!).reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
              const colors: Record<string, { bg: string; text: string; border: string; light: string }> = {
                pending: { bg: 'bg-yellow-400', text: 'text-yellow-700', border: 'border-yellow-300', light: 'bg-yellow-50' },
                in_progress: { bg: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-300', light: 'bg-blue-50' },
                in_review: { bg: 'bg-purple-500', text: 'text-purple-700', border: 'border-purple-300', light: 'bg-purple-50' },
                completed: { bg: 'bg-green-500', text: 'text-green-700', border: 'border-green-300', light: 'bg-green-50' },
                blocked: { bg: 'bg-red-500', text: 'text-red-700', border: 'border-red-300', light: 'bg-red-50' },
              };
              const c = colors[status] || { bg: 'bg-gray-400', text: 'text-gray-700', border: 'border-gray-300', light: 'bg-gray-50' };
              return (
                <div key={status} className={`p-4 rounded-xl border-2 ${c.light} ${c.border}`}>
                  <div className="text-3xl font-black text-gray-900 mb-1">{count}</div>
                  <div className="text-sm font-semibold text-gray-600 mb-3 capitalize">{status.replace('_', ' ')}</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-full rounded-full ${c.bg}`} style={{ width: `${percentage}%` }} />
                  </div>
                  <div className="text-xs font-bold text-gray-500 mt-1">{percentage}%</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center text-gray-400">
            <AlertCircle className="w-8 h-8 mr-2" />
            No task data available
          </div>
        )}
      </div>

      {/* Task Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200">
          <CheckSquare className="w-8 h-8 text-green-600 mb-3" />
          <div className="text-3xl font-black text-green-700 mb-1">{stats?.completedTasks || 0}</div>
          <div className="text-sm font-semibold text-green-600">Completed Tasks</div>
          <div className="mt-2 text-xs font-medium text-green-700">
            {completionRate}% overall completion
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200">
          <CheckSquare className="w-8 h-8 text-blue-600 mb-3" />
          <div className="text-3xl font-black text-blue-700 mb-1">{stats?.activeProjects || 0}</div>
          <div className="text-sm font-semibold text-blue-600">Active Projects</div>
          <div className="mt-2 text-xs font-medium text-blue-700">
            Currently in progress
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl border border-red-200">
          <AlertCircle className="w-8 h-8 text-red-600 mb-3" />
          <div className="text-3xl font-black text-red-700 mb-1">{stats?.overdueTasks || 0}</div>
          <div className="text-sm font-semibold text-red-600">Overdue Tasks</div>
          <div className="mt-2 text-xs font-medium text-red-700">
            Requires immediate attention
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-gray-500 font-medium mt-1">Insights into projects, tasks, and performance</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1 inline-flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'projects' && renderProjectsTab()}
      {activeTab === 'tasks' && renderTasksTab()}
    </div>
  );
};

export default Reports;
