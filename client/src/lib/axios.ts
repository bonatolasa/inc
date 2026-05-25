import axios from 'axios';
import { API_BASE_URL, API_DEPLOYED } from '../config/api.config';

const LOCAL_API_TIMEOUT_MS = 10000;
const DEPLOYED_API_TIMEOUT_MS = 15000;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_BASE_URL === API_DEPLOYED ? DEPLOYED_API_TIMEOUT_MS : LOCAL_API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (!config.timeout) {
    const requestBaseUrl = config.baseURL ?? api.defaults.baseURL;
    config.timeout = requestBaseUrl === API_DEPLOYED ? DEPLOYED_API_TIMEOUT_MS : LOCAL_API_TIMEOUT_MS;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const safeMethods = ['get', 'head', 'options'];
    const requestMethod = error.config?.method?.toLowerCase();
    const requestUrl = error.config?.url || '';
    const isLoginRequest =
      requestMethod === 'post' &&
      (requestUrl.endsWith('/auth/login') || requestUrl === '/auth/login');
    const isNetworkFailure =
      error?.message === 'Network Error' ||
      error?.code === 'ECONNABORTED' ||
      error?.code === 'ERR_NETWORK' ||
      (!error?.response && !!error?.request);
    const originalRequest = error.config as any;

    if (
      isNetworkFailure &&
      originalRequest &&
      !originalRequest.__deployedFallbackTried &&
      api.defaults.baseURL === API_BASE_URL &&
      (safeMethods.includes(requestMethod) || isLoginRequest)
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
