import axios from 'axios';

const ADMIN_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

/**
 * Axios instance cho Admin API
 * Kết nối tới backend tại http://localhost:8080/api/admin
 */
const adminApi = axios.create({
  baseURL: ADMIN_API_BASE_URL,
});

/**
 * Request interceptor - thêm Admin JWT token vào header
 */
adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - xử lý token refresh khi hết hạn
 */
adminApi.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';
    const isAuthEndpoint =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/refresh-token');

    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('adminRefreshToken');

        if (!refreshToken) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminRefreshToken');
          localStorage.removeItem('admin');
          window.location.href = '/admin/login';
          return Promise.reject(error);
        }

        const response = await axios.post(
          `${ADMIN_API_BASE_URL}/admin/auth/refresh-token`,
          { refreshToken }
        );

        const newToken = response.data.token;
        localStorage.setItem('adminToken', newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return adminApi(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        localStorage.removeItem('admin');
        window.location.href = '/admin/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default adminApi;
