import api from './api';
import { API_ENDPOINTS } from '../config/api.config';
import { Task } from '../types/task.types';
import { ApiResponse } from '../types/api.types';

export const taskService = {
  createTask: async (data: Partial<Task>): Promise<ApiResponse<Task>> => {
    const response = await api.post(API_ENDPOINTS.TASKS.BASE, data);
    return response.data;
  },

  getAllTasks: async (): Promise<ApiResponse<Task[]>> => {
    const response = await api.get(API_ENDPOINTS.TASKS.BASE);
    return response.data;
  },

  getTaskById: async (taskId: string): Promise<ApiResponse<Task>> => {
    const response = await api.get(`${API_ENDPOINTS.TASKS.BASE}/${taskId}`);
    return response.data;
  },

  getMyTasks: async (): Promise<ApiResponse<Task[]>> => {
    const response = await api.get(API_ENDPOINTS.TASKS.MY_TASKS);
    return response.data;
  },

  getTasksDueSoon: async (): Promise<ApiResponse<Task[]>> => {
    const response = await api.get(API_ENDPOINTS.TASKS.DUE_SOON);
    return response.data;
  },

  getOverdueTasks: async (): Promise<ApiResponse<Task[]>> => {
    const response = await api.get(API_ENDPOINTS.TASKS.OVERDUE);
    return response.data;
  },

  updateTask: async (taskId: string, data: Partial<Task>): Promise<ApiResponse<Task>> => {
    const response = await api.put(`${API_ENDPOINTS.TASKS.BASE}/${taskId}`, data);
    return response.data;
  },

  updateTaskProgress: async (taskId: string, progress: number): Promise<ApiResponse<Task>> => {
    const response = await api.patch(API_ENDPOINTS.TASKS.PROGRESS(taskId), { percentageComplete: progress });
    return response.data;
  },

  deleteTask: async (taskId: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`${API_ENDPOINTS.TASKS.BASE}/${taskId}`);
    return response.data;
  },

  getTasksByProject: async (projectId: string): Promise<ApiResponse<Task[]>> => {
    const response = await api.get(API_ENDPOINTS.TASKS.BY_PROJECT(projectId));
    return response.data;
  },

  getTasksByUser: async (userId: string): Promise<ApiResponse<Task[]>> => {
    const response = await api.get(API_ENDPOINTS.TASKS.BY_USER(userId));
    return response.data;
  },

  getTasksByCreator: async (userId: string): Promise<ApiResponse<Task[]>> => {
    const response = await api.get(API_ENDPOINTS.TASKS.BY_CREATOR(userId));
    return response.data;
  },

  getTaskStatistics: async (projectId: string): Promise<ApiResponse<any>> => {
    const response = await api.get(API_ENDPOINTS.TASKS.STATISTICS(projectId));
    return response.data;
  }
};
