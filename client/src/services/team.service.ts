import api from './api';
import { API_ENDPOINTS } from '../config/api.config';
import { Team } from '../types/team.types';
import { User } from '../types/user.types';
import { ApiResponse } from '../types/api.types';

export const teamService = {
  createTeam: async (data: Partial<Team>): Promise<ApiResponse<Team>> => {
    const response = await api.post(API_ENDPOINTS.TEAMS.BASE, data);
    return response.data;
  },

  getAllTeams: async (): Promise<ApiResponse<Team[]>> => {
    const response = await api.get(API_ENDPOINTS.TEAMS.BASE);
    return response.data;
  },

  getTeamById: async (id: string): Promise<ApiResponse<Team>> => {
    const response = await api.get(`${API_ENDPOINTS.TEAMS.BASE}/${id}`);
    return response.data;
  },

  updateTeam: async (id: string, data: Partial<Team>): Promise<ApiResponse<Team>> => {
    const response = await api.patch(`${API_ENDPOINTS.TEAMS.BASE}/${id}`, data);
    return response.data;
  },

  deleteTeam: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`${API_ENDPOINTS.TEAMS.BASE}/${id}`);
    return response.data;
  },

  addMember: async (teamId: string, userId: string): Promise<ApiResponse<Team>> => {
    const response = await api.post(API_ENDPOINTS.TEAMS.ADD_MEMBER(teamId, userId));
    return response.data;
  },

  getTeamsByManager: async (managerId: string): Promise<ApiResponse<Team[]>> => {
    const response = await api.get(API_ENDPOINTS.TEAMS.BY_MANAGER(managerId));
    return response.data;
  },

  getMyTeam: async (): Promise<ApiResponse<Team>> => {
    const response = await api.get(API_ENDPOINTS.TEAMS.MY_TEAM);
    return response.data;
  },

  getMyTeams: async (): Promise<ApiResponse<Team[]>> => {
    const response = await api.get(API_ENDPOINTS.TEAMS.MY_TEAMS);
    return response.data;
  },

  getTeamMembers: async (teamId: string): Promise<ApiResponse<User[]>> => {
    const response = await api.get(API_ENDPOINTS.TEAMS.MEMBERS(teamId));
    return response.data;
  }
};
