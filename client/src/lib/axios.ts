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
    const safeMethods = ['get', 'head', 'options'];
    const requestMethod = error.config?.method?.toLowerCase();
    const isNetworkFailure =
      error?.message === 'Network Error' ||
      error?.code === 'ERR_NETWORK' ||
      (!error?.response && !!error?.request);
    const originalRequest = error.config as any;

    if (
      isNetworkFailure &&
      originalRequest &&
      !originalRequest.__deployedFallbackTried &&
      api.defaults.baseURL === API_BASE_URL &&
      safeMethods.includes(requestMethod)
    ) {
      console.warn('Local API unreachable, falling back to deployed API...');
      api.defaults.baseURL = API_DEPLOYED;
      originalRequest.baseURL = API_DEPLOYED;
      originalRequest.__deployedFallbackTried = true;
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
