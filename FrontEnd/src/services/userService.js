import api from '../api/axiosInstance';

const UserService = {
  getProfile: () => {
    return api.get('/users/profile');
  },

  updateProfile: (profileData) => {
    return api.put('/users/profile', profileData);
  },

  updateAvatar: (avatarUrl) => {
    return api.put('/users/avatar', { avatarUrl });
  },

  sendOtpForPasswordChange: () => {
    return api.post('/users/password/send-otp');
  },

  changePassword: (data) => {
    return api.post('/users/password/change', data);
  },
};

export default UserService;
