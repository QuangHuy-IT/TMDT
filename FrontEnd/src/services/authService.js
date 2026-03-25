import api from '../api/axiosInstance';

/**
 * AuthService - các API liên quan đến authentication
 */
const AuthService = {
  /**
   * Đăng ký người dùng mới
   */
  register: (userData) => {
    return api.post('/auth/register', userData);
  },

  /**
   * Đăng nhập
   */
  login: (email, password) => {
    return api.post('/auth/login', { email, password });
  },

  /**
   * Lấy thông tin người dùng hiện tại
   */
  getCurrentUser: () => {
    return api.get('/auth/me');
  },

  /**
   * Refresh access token
   */
  refreshToken: (refreshToken) => {
    return api.post('/auth/refresh-token', { refreshToken });
  },

  /**
   * Đăng xuất
   */
  logout: () => {
    return api.post('/auth/logout');
  },

  /**
   * Lấy thông tin profile
   */
  getProfile: () => {
    return api.get('/users/profile');
  },

  /**
   * Cập nhật thông tin profile
   */
  updateProfile: (profileData) => {
    return api.put('/users/profile', profileData);
  },
};

export default AuthService;
