import api from '../api/axiosInstance';

export const voucherService = {
  getAvailableVouchers: async () => {
    const response = await api.get('/vouchers');
    return response.data;
  },

  validateVoucher: async (code) => {
    const response = await api.get('/vouchers/validate', { params: { code } });
    return response.data;
  },
};

export default voucherService;
