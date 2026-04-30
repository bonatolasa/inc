import api from './api';
import { API_ENDPOINTS } from '../config/api.config';
import { Notification } from '../types/notification.types';
import { ApiResponse } from '../types/api.types';

export const notificationService = {
  getMyNotifications: async (): Promise<ApiResponse<Notification[]>> => {
    const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.BASE);
    return response.data;
  },

  markAsRead: async (id: string): Promise<ApiResponse<Notification>> => {
    const response = await api.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
    return response.data;
  },

  markAllAsRead: async (): Promise<ApiResponse<null>> => {
    const response = await api.patch(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
    return response.data;
  },

  deleteNotification: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`${API_ENDPOINTS.NOTIFICATIONS.BASE}/${id}`);
    return response.data;
  }
};
