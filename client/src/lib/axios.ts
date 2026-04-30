import axios from 'axios';
import { API_BASE_URL, API_DEPLOYED } from '../config/api.config';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Check if network error and currently using local URL
    if (error.message === 'Network Error' && api.defaults.baseURL === API_BASE_URL) {
      console.warn('Local API unreachable, falling back to deployed API...');
      api.defaults.baseURL = API_DEPLOYED;
      
      // Update the current request to use the deployed URL
      const originalRequest = error.config;
      originalRequest.baseURL = API_DEPLOYED;
      
      // Retry the requested call
      return api(originalRequest);
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
