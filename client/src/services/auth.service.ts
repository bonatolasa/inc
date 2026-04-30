import api from './api';
import { API_ENDPOINTS } from '../config/api.config';
import { ApiResponse } from '../types/api.types';

export const authService = {
  login: async (data: any): Promise<ApiResponse<{ accessToken?: string; token?: string, user: any }>> => {
    const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, data);
    return response.data;
  },
  
  register: async (data: any): Promise<ApiResponse<any>> => {
    const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, data);
    return response.data;
  },

  verifyPassword: async (password: string): Promise<ApiResponse<any>> => {
    const response = await api.post(API_ENDPOINTS.AUTH.VERIFY_PASSWORD, { password });
    return response.data;
  }
};
