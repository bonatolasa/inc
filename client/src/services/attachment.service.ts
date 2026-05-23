import api from './api';
import { API_ENDPOINTS } from '../config/api.config';
import { Attachment } from '../types/attachment.types';
import { ApiResponse } from '../types/api.types';

export const attachmentService = {
  uploadAttachment: async (taskId: string, file: File): Promise<ApiResponse<Attachment>> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', file.name);

    const response = await api.post(API_ENDPOINTS.TASKS.ATTACHMENTS(taskId), formData, {
      headers: {
        'Content-Type': undefined,
      },
    });
    return response.data;
  },

  getAttachmentsByTask: async (taskId: string): Promise<ApiResponse<Attachment[]>> => {
    const response = await api.get(API_ENDPOINTS.TASKS.ATTACHMENTS(taskId));
    return response.data;
  },

  deleteAttachment: async (attachmentId: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`${API_ENDPOINTS.ATTACHMENTS.BASE}/${attachmentId}`);
    return response.data;
  }
};
