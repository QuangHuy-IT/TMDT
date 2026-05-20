import adminApi from '../api/adminAxiosInstance';

const AdminService = {
  // ── Brands ────────────────────────────────────────────────────────────────
  getBrands: () => adminApi.get('/admin/brands'),
  getBrand: (id) => adminApi.get(`/admin/brands/${id}`),
  createBrand: (payload) => adminApi.post('/admin/brands', payload),
  updateBrand: (id, payload) => adminApi.put(`/admin/brands/${id}`, payload),
  deleteBrand: (id) => adminApi.delete(`/admin/brands/${id}`),
  reorderBrands: (brandIds) => adminApi.put('/admin/brands/reorder', brandIds),

  // ── Banners ─────────────────────────────────────────────────────────────
  getBanners: () => adminApi.get('/admin/banners'),
  getBanner: (id) => adminApi.get(`/admin/banners/${id}`),
  createBanner: (payload) => adminApi.post('/admin/banners', payload),
  updateBanner: (id, payload) => adminApi.put(`/admin/banners/${id}`, payload),
  deleteBanner: (id) => adminApi.delete(`/admin/banners/${id}`),

  // ── Users ────────────────────────────────────────────────────────────────
  getUsers: () => adminApi.get('/admin/users'),
  getUser: (id) => adminApi.get(`/admin/users/${id}`),
  updateUser: (id, payload) => adminApi.put(`/admin/users/${id}`, payload),

  // ── Orders ──────────────────────────────────────────────────────────────
  getOrders: () => adminApi.get('/admin/orders'),
  getOrder: (id) => adminApi.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, payload) => adminApi.put(`/admin/orders/${id}/status`, payload),

  // ── Flash Sale — Campaign ────────────────────────────────────────────────
  getFlashSaleCampaigns: () => adminApi.get('/admin/flash-sales/campaigns'),
  createFlashSaleCampaign: (payload) => adminApi.post('/admin/flash-sales/campaigns', payload),
  updateFlashSaleCampaign: (id, payload) => adminApi.put(`/admin/flash-sales/campaigns/${id}`, payload),
  deleteFlashSaleCampaign: (id) => adminApi.delete(`/admin/flash-sales/campaigns/${id}`),
  activateFlashSaleCampaign: (id) => adminApi.patch(`/admin/flash-sales/campaigns/${id}/activate`),
  deactivateFlashSaleCampaign: (id) => adminApi.patch(`/admin/flash-sales/campaigns/${id}/deactivate`),

  // ── Flash Sale — Session ─────────────────────────────────────────────────
  getFlashSaleSessions: (campaignId) => adminApi.get(`/admin/flash-sales/sessions/campaign/${campaignId}`),
  createFlashSaleSession: (payload) => adminApi.post('/admin/flash-sales/sessions', payload),
  updateFlashSaleSession: (id, payload) => adminApi.put(`/admin/flash-sales/sessions/${id}`, payload),
  deleteFlashSaleSession: (id) => adminApi.delete(`/admin/flash-sales/sessions/${id}`),
  updateFlashSaleSessionStatuses: () => adminApi.post('/admin/flash-sales/sessions/update-statuses'),

  // ── Flash Sale — Products ────────────────────────────────────────────────
  getFlashSaleProducts: (sessionId) => adminApi.get(`/admin/flash-sales/products/session/${sessionId}`),
  addFlashSaleProduct: (payload) => adminApi.post('/admin/flash-sales/products', payload),
  updateFlashSaleProduct: (id, payload) => adminApi.put(`/admin/flash-sales/products/${id}`, payload),
  removeFlashSaleProduct: (id) => adminApi.delete(`/admin/flash-sales/products/${id}`),
  updateFlashSaleProductQuantity: (id, quantity) =>
    adminApi.patch(`/admin/flash-sales/products/${id}/quantity`, { quantity }),
  incrementFlashSaleSoldQuantity: (id, quantity) =>
    adminApi.patch(`/admin/flash-sales/products/${id}/sold-quantity`, { quantity }),
  hideFlashSaleProduct: (id) => adminApi.patch(`/admin/flash-sales/products/${id}/hide`),
  showFlashSaleProduct: (id) => adminApi.patch(`/admin/flash-sales/products/${id}/show`),

  // ── Vouchers ─────────────────────────────────────────────────────────────
  getVouchers: () => adminApi.get('/admin/vouchers'),
  getVoucher: (id) => adminApi.get(`/admin/vouchers/${id}`),
  createVoucher: (payload) => adminApi.post('/admin/vouchers', payload),
  updateVoucher: (id, payload) => adminApi.put(`/admin/vouchers/${id}`, payload),
  deleteVoucher: (id) => adminApi.delete(`/admin/vouchers/${id}`),
  toggleVoucherActive: (id, isActive) =>
    adminApi.patch(`/admin/vouchers/${id}/toggle`, { isActive }),

  // ── Product Discounts ──────────────────────────────────────────────────
  getDiscounts: () => adminApi.get('/admin/discounts'),
  getActiveDiscounts: () => adminApi.get('/admin/discounts/active'),
  getDiscount: (id) => adminApi.get(`/admin/discounts/${id}`),
  createDiscount: (payload) => adminApi.post('/admin/discounts', payload),
  updateDiscount: (id, payload) => adminApi.put(`/admin/discounts/${id}`, payload),
  deleteDiscount: (id) => adminApi.delete(`/admin/discounts/${id}`),
  toggleDiscount: (id) => adminApi.post(`/admin/discounts/${id}/toggle`),
};

export default AdminService;
