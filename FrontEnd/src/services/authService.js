import api from '../api/axiosInstance';

/**
 * AuthService - các API liên quan đến authentication
 */
const AuthService = {
  register: (userData) => {
    return api.post('/auth/register', userData);
  },

  login: (email, password) => {
    return api.post('/auth/login', { email, password });
  },

  googleAuth: (googleData) => {
    return api.post('/auth/google', googleData);
  },

  completeGoogleProfile: (profileData) => {
    return api.post('/auth/google/complete-profile', profileData);
  },

  sendOtp: (email) => {
    return api.post('/auth/otp/send', { email });
  },

  verifyOtp: (email, otpCode) => {
    return api.post('/auth/otp/verify', { email, otpCode });
  },

  getCurrentUser: () => {
    return api.get('/auth/me');
  },

  refreshToken: (refreshToken) => {
    return api.post('/auth/refresh-token', { refreshToken });
  },

  logout: () => {
    return api.post('/auth/logout');
  },

  getProfile: () => {
    return api.get('/users/profile');
  },

  updateProfile: (profileData) => {
    return api.put('/users/profile', profileData);
  },
};

export default AuthService;
