import api from './api';
import { API_ENDPOINTS } from '../config/api.config';
import { Activity } from '../types/activity.types';
import { ApiResponse } from '../types/api.types';

export const activityService = {
  getAllActivities: async (): Promise<ApiResponse<Activity[]>> => {
    const response = await api.get(API_ENDPOINTS.ACTIVITIES.BASE);
    return response.data;
  }
};
