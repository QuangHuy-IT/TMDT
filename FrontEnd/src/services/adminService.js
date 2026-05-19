import api from '../api/axiosInstance';

const AdminService = {
  // ── Brands ────────────────────────────────────────────────────────────────
  getBrands: () => api.get('/admin/brands'),
  getBrand: (id) => api.get(`/admin/brands/${id}`),
  createBrand: (payload) => api.post('/admin/brands', payload),
  updateBrand: (id, payload) => api.put(`/admin/brands/${id}`, payload),
  deleteBrand: (id) => api.delete(`/admin/brands/${id}`),
  reorderBrands: (brandIds) => api.put('/admin/brands/reorder', brandIds),

  // ── Banners ─────────────────────────────────────────────────────────────
  getBanners: () => api.get('/admin/banners'),
  getBanner: (id) => api.get(`/admin/banners/${id}`),
  createBanner: (payload) => api.post('/admin/banners', payload),
  updateBanner: (id, payload) => api.put(`/admin/banners/${id}`, payload),
  deleteBanner: (id) => api.delete(`/admin/banners/${id}`),

  // ── Users ────────────────────────────────────────────────────────────────
  getUsers: () => api.get('/admin/users'),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, payload) => api.put(`/admin/users/${id}`, payload),

  // ── Orders ──────────────────────────────────────────────────────────────
  getOrders: () => api.get('/admin/orders'),
  getOrder: (id) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, payload) => api.put(`/admin/orders/${id}/status`, payload),

  // ── Flash Sale — Campaign ────────────────────────────────────────────────
  getFlashSaleCampaigns: () => api.get('/admin/flash-sales/campaigns'),
  createFlashSaleCampaign: (payload) => api.post('/admin/flash-sales/campaigns', payload),
  updateFlashSaleCampaign: (id, payload) => api.put(`/admin/flash-sales/campaigns/${id}`, payload),
  deleteFlashSaleCampaign: (id) => api.delete(`/admin/flash-sales/campaigns/${id}`),
  activateFlashSaleCampaign: (id) => api.patch(`/admin/flash-sales/campaigns/${id}/activate`),
  deactivateFlashSaleCampaign: (id) => api.patch(`/admin/flash-sales/campaigns/${id}/deactivate`),

  // ── Flash Sale — Session ─────────────────────────────────────────────────
  getFlashSaleSessions: (campaignId) => api.get(`/admin/flash-sales/sessions/campaign/${campaignId}`),
  createFlashSaleSession: (payload) => api.post('/admin/flash-sales/sessions', payload),
  updateFlashSaleSession: (id, payload) => api.put(`/admin/flash-sales/sessions/${id}`, payload),
  deleteFlashSaleSession: (id) => api.delete(`/admin/flash-sales/sessions/${id}`),
  updateFlashSaleSessionStatuses: () => api.post('/admin/flash-sales/sessions/update-statuses'),

  // ── Flash Sale — Products ────────────────────────────────────────────────
  getFlashSaleProducts: (sessionId) => api.get(`/admin/flash-sales/products/session/${sessionId}`),
  addFlashSaleProduct: (payload) => api.post('/admin/flash-sales/products', payload),
  updateFlashSaleProduct: (id, payload) => api.put(`/admin/flash-sales/products/${id}`, payload),
  removeFlashSaleProduct: (id) => api.delete(`/admin/flash-sales/products/${id}`),
  updateFlashSaleProductQuantity: (id, quantity) =>
    api.patch(`/admin/flash-sales/products/${id}/quantity`, { quantity }),
  incrementFlashSaleSoldQuantity: (id, quantity) =>
    api.patch(`/admin/flash-sales/products/${id}/sold-quantity`, { quantity }),
  hideFlashSaleProduct: (id) => api.patch(`/admin/flash-sales/products/${id}/hide`),
  showFlashSaleProduct: (id) => api.patch(`/admin/flash-sales/products/${id}/show`),

  // ── Vouchers ─────────────────────────────────────────────────────────────
  getVouchers: () => api.get('/admin/vouchers'),
  getVoucher: (id) => api.get(`/admin/vouchers/${id}`),
  createVoucher: (payload) => api.post('/admin/vouchers', payload),
  updateVoucher: (id, payload) => api.put(`/admin/vouchers/${id}`, payload),
  deleteVoucher: (id) => api.delete(`/admin/vouchers/${id}`),
  toggleVoucherActive: (id, isActive) =>
    api.patch(`/admin/vouchers/${id}/toggle`, { isActive }),

  // ── Product Discounts ──────────────────────────────────────────────────
  getDiscounts: () => api.get('/admin/discounts'),
  getActiveDiscounts: () => api.get('/admin/discounts/active'),
  getDiscount: (id) => api.get(`/admin/discounts/${id}`),
  createDiscount: (payload) => api.post('/admin/discounts', payload),
  updateDiscount: (id, payload) => api.put(`/admin/discounts/${id}`, payload),
  deleteDiscount: (id) => api.delete(`/admin/discounts/${id}`),
  toggleDiscount: (id) => api.post(`/admin/discounts/${id}/toggle`),
};

export default AdminService;
