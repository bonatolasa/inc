import api from './api';
import { API_ENDPOINTS } from '../config/api.config';
import { ApiResponse } from '../types/api.types';

export const reportService = {
  getDashboardStats: async (): Promise<ApiResponse<any>> => {
    const response = await api.get(API_ENDPOINTS.REPORTS.DASHBOARD);
    return response.data;
  },

  getManagerDashboard: async (): Promise<ApiResponse<any>> => {
    const response = await api.get(API_ENDPOINTS.REPORTS.MANAGER_DASHBOARD);
    return response.data;
  },

  getProjectPerformance: async (projectId: string): Promise<ApiResponse<any>> => {
    const response = await api.get(API_ENDPOINTS.REPORTS.PROJECT_PERFORMANCE(projectId));
    return response.data;
  },

  getUserPerformance: async (userId: string): Promise<ApiResponse<any>> => {
    const response = await api.get(API_ENDPOINTS.REPORTS.USER_PERFORMANCE(userId));
    return response.data;
  },

  getTeamPerformance: async (teamId: string): Promise<ApiResponse<any>> => {
    const response = await api.get(API_ENDPOINTS.REPORTS.TEAM_PERFORMANCE(teamId));
    return response.data;
  },

  getTeamWorkload: async (teamId: string): Promise<ApiResponse<any>> => {
    const response = await api.get(API_ENDPOINTS.REPORTS.TEAM_WORKLOAD(teamId));
    return response.data;
  },

  getTaskStatusDistribution: async (): Promise<ApiResponse<any>> => {
    const response = await api.get(API_ENDPOINTS.REPORTS.TASK_STATUS);
    return response.data;
  },

  getProjectStatusDistribution: async (): Promise<ApiResponse<any>> => {
    const response = await api.get(API_ENDPOINTS.REPORTS.PROJECT_STATUS);
    return response.data;
  },

  getTimeTrackingReport: async (): Promise<ApiResponse<any>> => {
    const response = await api.get(API_ENDPOINTS.REPORTS.TIME_TRACKING);
    return response.data;
  }
};
