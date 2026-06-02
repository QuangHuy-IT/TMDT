import api from '../api/axiosInstance';

export const voucherService = {
  getAvailableVouchers: async () => {
    const response = await api.get('/vouchers');
    return response.data;
  },

  validateVoucher: async (code, subtotal) => {
    const params = { code };
    if (subtotal != null) {
      params.subtotal = subtotal;
    }
    const response = await api.get('/vouchers/validate', { params });
    return response.data;
  },
};

export default voucherService;
