import api from '../api/axiosInstance';

const AdminService = {
  // ── Brands ────────────────────────────────────────────────────────────────
  getBrands: () => api.get('/admin/brands'),
  getBrand: (id) => api.get(`/admin/brands/${id}`),
  createBrand: (payload) => api.post('/admin/brands', payload),
  updateBrand: (id, payload) => api.put(`/admin/brands/${id}`, payload),
  deleteBrand: (id) => api.delete(`/admin/brands/${id}`),

  // ── Banners ─────────────────────────────────────────────────────────────
  getBanners: () => api.get('/admin/banners'),
  getBanner: (id) => api.get(`/admin/banners/${id}`),
  createBanner: (payload) => api.post('/admin/banners', payload),
  updateBanner: (id, payload) => api.put(`/admin/banners/${id}`, payload),
  deleteBanner: (id) => api.delete(`/admin/banners/${id}`),
};

export default AdminService;
