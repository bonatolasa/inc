import api from './api';
import { API_ENDPOINTS } from '../config/api.config';
import { Project } from '../types/project.types';
import { ApiResponse } from '../types/api.types';

export const projectService = {
  createProject: async (data: Partial<Project>): Promise<ApiResponse<Project>> => {
    const response = await api.post(API_ENDPOINTS.PROJECTS.BASE, data);
    return response.data;
  },

  getAllProjects: async (params?: any): Promise<ApiResponse<Project[]>> => {
    const response = await api.get(API_ENDPOINTS.PROJECTS.BASE, { params });
    return response.data;
  },

  getProjectById: async (id: string): Promise<ApiResponse<Project>> => {
    const response = await api.get(`${API_ENDPOINTS.PROJECTS.BASE}/${id}`);
    return response.data;
  },

  updateProject: async (id: string, data: Partial<Project>): Promise<ApiResponse<Project>> => {
    const response = await api.patch(`${API_ENDPOINTS.PROJECTS.BASE}/${id}`, data);
    return response.data;
  },

  deleteProject: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`${API_ENDPOINTS.PROJECTS.BASE}/${id}`);
    return response.data;
  },

  getProjectsByTeam: async (teamId: string): Promise<ApiResponse<Project[]>> => {
    const response = await api.get(API_ENDPOINTS.PROJECTS.BY_TEAM(teamId));
    return response.data;
  },

  getProjectsByManager: async (managerId: string): Promise<ApiResponse<Project[]>> => {
    const response = await api.get(API_ENDPOINTS.PROJECTS.BY_MANAGER(managerId));
    return response.data;
  },

  getProjectsByContributor: async (userId: string): Promise<ApiResponse<Project[]>> => {
    if (!userId || !userId.trim()) {
      return { success: true, data: [] };
    }
    const response = await api.get(API_ENDPOINTS.PROJECTS.BY_CONTRIBUTOR(userId));
    return response.data;
  },

  updateProjectProgress: async (id: string, progress: number): Promise<ApiResponse<Project>> => {
    const response = await api.patch(API_ENDPOINTS.PROJECTS.PROGRESS(id), { progress });
    return response.data;
  }
};
