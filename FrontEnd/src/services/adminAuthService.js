import adminApi from '../api/adminAxiosInstance';

/**
 * AdminAuthService - các API liên quan đến authentication cho admin
 */
const AdminAuthService = {
  login: (email, password) => {
    return adminApi.post('/admin/auth/login', { email, password });
  },

  getCurrentAdmin: () => {
    return adminApi.get('/admin/auth/me');
  },

  refreshToken: (refreshToken) => {
    return adminApi.post('/admin/auth/refresh-token', { refreshToken });
  },

  logout: () => {
    return adminApi.post('/admin/auth/logout');
  },
};

export default AdminAuthService;
