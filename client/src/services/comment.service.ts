import api from './api';
import { API_ENDPOINTS } from '../config/api.config';
import { Comment } from '../types/comment.types';
import { ApiResponse } from '../types/api.types';

export const commentService = {
  createComment: async (taskId: string, message: string): Promise<ApiResponse<Comment>> => {
    const response = await api.post(API_ENDPOINTS.TASKS.COMMENTS(taskId), { message });
    return response.data;
  },

  getCommentsByTask: async (taskId: string): Promise<ApiResponse<Comment[]>> => {
    const response = await api.get(API_ENDPOINTS.TASKS.COMMENTS(taskId));
    return response.data;
  },

  deleteComment: async (commentId: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`${API_ENDPOINTS.COMMENTS.BASE}/${commentId}`);
    return response.data;
  }
};
