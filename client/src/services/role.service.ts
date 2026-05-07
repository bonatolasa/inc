import api from './api';
import { API_ENDPOINTS } from '../config/api.config';
import { Role } from '../types/user.types';
import { ApiResponse } from '../types/api.types';

export const roleService = {
  getAllRoles: async (): Promise<ApiResponse<Role[]>> => {
    const response = await api.get(API_ENDPOINTS.ROLES.BASE);
    return response.data;
  },

  createRole: async (data: Partial<Role>): Promise<ApiResponse<Role>> => {
    const response = await api.post(API_ENDPOINTS.ROLES.BASE, data);
    return response.data;
  },

  getRoleByName: async (roleName: string): Promise<ApiResponse<Role>> => {
    const response = await api.get(`${API_ENDPOINTS.ROLES.BASE}/${roleName}`);
    return response.data;
  },

  renameRole: async (roleName: string, newName: string): Promise<ApiResponse<Role>> => {
    const response = await api.patch(API_ENDPOINTS.ROLES.RENAME(roleName), { newName });
    return response.data;
  },

  updateDisplayName: async (roleName: string, displayName: string): Promise<ApiResponse<Role>> => {
    const response = await api.patch(API_ENDPOINTS.ROLES.DISPLAY_NAME(roleName), { displayName });
    return response.data;
  },

  addPermissions: async (roleName: string, permissions: string[]): Promise<ApiResponse<Role>> => {
    const response = await api.patch(API_ENDPOINTS.ROLES.PERMISSIONS(roleName), { permissions });
    return response.data;
  },

  removePermissions: async (roleName: string, permissions: string[]): Promise<ApiResponse<Role>> => {
    const response = await api.delete(API_ENDPOINTS.ROLES.PERMISSIONS(roleName), { data: { permissions } });
    return response.data;
  },

  updatePermissions: async (
    roleName: string,
    nextPermissions: string[],
    currentPermissions: string[] = [],
  ): Promise<ApiResponse<Role>> => {
    const currentSet = new Set(currentPermissions);
    const nextSet = new Set(nextPermissions);

    const toAdd = nextPermissions.filter((permission) => !currentSet.has(permission));
    const toRemove = currentPermissions.filter((permission) => !nextSet.has(permission));

    let latestResponse: ApiResponse<Role> | null = null;

    if (toAdd.length > 0) {
      latestResponse = await roleService.addPermissions(roleName, toAdd);
    }

    if (toRemove.length > 0) {
      latestResponse = await roleService.removePermissions(roleName, toRemove);
    }

    if (latestResponse) {
      return latestResponse;
    }

    const response = await api.get(`${API_ENDPOINTS.ROLES.BASE}/${roleName}`);
    return response.data;
  },

  deleteRole: async (roleName: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`${API_ENDPOINTS.ROLES.BASE}/${roleName}`);
    return response.data;
  }
};
