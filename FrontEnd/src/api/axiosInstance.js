import axios from 'axios';

/**
 * Axios instance với cấu hình mặc định
 * Kết nối tới backend tại http://localhost:8080
 */
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - thêm JWT token vào header
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';
    const isAuthEndpoint =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/refresh-token');

    // Khong refresh token cho cac API auth de tranh reload trang dang nhap/dang ky khi sai thong tin
    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    // Nếu lỗi 401 và chưa retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
          // Không có refresh token, đưa user về trang login
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Gọi API refresh token
        const response = await axios.post(
          'http://localhost:8080/api/auth/refresh-token',
          { refreshToken }
        );

        const newToken = response.data.token;

        // Lưu token mới
        localStorage.setItem('token', newToken);

        // Cập nhật header authorization
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        // Retry request ban đầu
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token cũng hết hạn, đưa user về login
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
