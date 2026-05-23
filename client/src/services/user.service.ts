import api from './api';
import { API_ENDPOINTS } from '../config/api.config';
import { User } from '../types/user.types';
import { ApiResponse } from '../types/api.types';

export interface PaginatedUsersResponse extends ApiResponse<User[]> {
  total?: number;
  page?: number;
  limit?: number;
}

export interface InviteUserResponse extends ApiResponse<User> {
  inviteEmailSent?: boolean;
}

export const userService = {
  getMe: async (): Promise<ApiResponse<User>> => {
    const response = await api.get(API_ENDPOINTS.USERS.ME);
    return response.data;
  },

  updateMe: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await api.patch(API_ENDPOINTS.USERS.ME, data);
    return response.data;
  },

  getAllUsers: async (
    page = 1,
    limit = 10,
    filters?: { name?: string; role?: string }
  ): Promise<PaginatedUsersResponse> => {
    const params: any = { page, limit };
    if (filters) {
      const nameValue = filters.name?.trim();
      const roleValue = filters.role?.trim().toLowerCase().replace(/\s+/g, '_');
      if (nameValue) params.name = nameValue;
      if (roleValue && roleValue !== 'all') params.role = roleValue;
    }

    const response = await api.get(API_ENDPOINTS.USERS.BASE, {
      params,
    });
    return response.data;
  },

  createUser: async (data: any): Promise<ApiResponse<User>> => {
    const response = await api.post(API_ENDPOINTS.USERS.BASE, data);
    return response.data;
  },

  inviteUser: async (data: any): Promise<InviteUserResponse> => {
    const response = await api.post(API_ENDPOINTS.USERS.INVITE, data);
    return response.data;
  },

  updateUser: async (id: string, data: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await api.patch(`${API_ENDPOINTS.USERS.BASE}/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`${API_ENDPOINTS.USERS.BASE}/${id}`);
    return response.data;
  },

  assignRoles: async (id: string, roles: string[]): Promise<ApiResponse<User>> => {
    const response = await api.patch(API_ENDPOINTS.USERS.ROLES(id), { roles });
    return response.data;
  },
  
  getManagerStats: async (): Promise<ApiResponse<any>> => {
    const response = await api.get(API_ENDPOINTS.USERS.MANAGERS_STATS);
    return response.data;
  },

  getTeamMembersForCreation: async (): Promise<ApiResponse<User[]>> => {
    const response = await api.get(API_ENDPOINTS.USERS.MEMBERS);
    return response.data;
  },

  getUsersByRole: async (roleName: string): Promise<ApiResponse<User[]>> => {
    const response = await api.get(API_ENDPOINTS.USERS.BY_ROLE(roleName));
    return response.data;
  },

  getUsersByTeam: async (teamId: string): Promise<ApiResponse<User[]>> => {
    const response = await api.get(API_ENDPOINTS.USERS.BY_TEAM(teamId));
    return response.data;
  },

  updateUserPermissions: async (userId: string, permissions: string[]): Promise<ApiResponse<User>> => {
    const response = await api.patch(`${API_ENDPOINTS.USERS.BASE}/${userId}/permissions`, { permissions });
    return response.data;
  },
};
