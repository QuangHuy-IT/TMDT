import api from '../api/axiosInstance';

export const bannerService = {
  getHomeBanners: async () => {
    const response = await api.get('/banners/home');
    return response.data;
  },
  getGridBanners: async () => {
    const response = await api.get('/banners/grid');
    return response.data;
  },
  getSidebarBanners: async () => {
    const response = await api.get('/banners/sidebar');
    return response.data; // [...]
  }
};

export default bannerService;
