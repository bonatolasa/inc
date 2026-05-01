import api from './api';
import { API_ENDPOINTS } from '../config/api.config';
import { ApiResponse } from '../types/api.types';

export interface Permission {
  _id: string;
  name: string;
  description?: string;
}

export const permissionService = {
  createPermission: async (data: Partial<Permission>): Promise<ApiResponse<Permission>> => {
    const response = await api.post(API_ENDPOINTS.PERMISSIONS.BASE, data);
    return response.data;
  },

  viewPermissions: async (): Promise<ApiResponse<Permission[]>> => {
    const response = await api.get(API_ENDPOINTS.PERMISSIONS.BASE);
    return response.data;
  }
};
