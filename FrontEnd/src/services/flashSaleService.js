import api from '../api/axiosInstance';

export const flashSaleService = {
  // Public endpoints
  getFlashSaleData: async () => {
    const response = await api.get('/flash-sales');
    return response.data;
  },
  getActiveCampaigns: async () => {
    const response = await api.get('/flash-sales/campaigns');
    return response.data;
  },
  getSessionById: async (sessionId) => {
    const response = await api.get(`/flash-sales/sessions/${sessionId}`);
    return response.data;
  },
};

export default flashSaleService;
