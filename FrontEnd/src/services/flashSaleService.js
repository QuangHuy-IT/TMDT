import api from '../api/axiosInstance';

export const flashSaleService = {
  getActiveFlashSale: async () => {
    const response = await api.get('/flash-sales/active');
    return response.data;
  },
  getAllActiveFlashSales: async () => {
    const response = await api.get('/flash-sales/all-active');
    return response.data;
  }
};

export default flashSaleService;
