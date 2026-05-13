import api from '../api/axiosInstance';

const PaymentService = {

  placeOrderAndPay: (orderData) => {
    return api.post('/payment/payos/place-and-pay', orderData);
  },

  createPaymentLink: (params) => {
    return api.post('/payment/payos/create', null, { params });
  },

  getOrderByCode: (orderCode) => {
    return api.get(`/orders/${orderCode}`);
  },

  cancelOrder: (orderCode, userId) => {
    return api.patch(`/orders/${orderCode}/cancel?userId=${userId}`);
  },

  deletePendingOrder: (orderCode, userId) => {
    return api.delete(`/orders/${orderCode}?userId=${userId}`);
  },

  cancelPayOSPayment: (payosOrderCode) => {
    return api.post('/payment/payos/cancel', null, { params: { payosOrderCode } });
  },

  confirmWebhook: (webhookUrl) => {
    return api.post('/payment/payos/confirm-webhook', { webhookUrl });
  },
};

export default PaymentService;
