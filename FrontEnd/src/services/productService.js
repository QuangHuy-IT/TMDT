import api from '../api/axiosInstance';

const ProductService = {
  getAdminProducts: () => api.get('/admin/products'),
  getAdminProduct: (id) => api.get(`/admin/products/${id}`),
  getAdminInventoryProducts: () => api.get('/admin/inventory/products'),
  adjustInventory: (productId, payload) => api.put(`/admin/inventory/${productId}/adjust`, payload),
  batchAdjustInventory: (payload) => api.post('/admin/inventory/adjust', payload),
  getInventoryLogs: (page = 0, size = 10) => api.get('/admin/inventory/logs', { params: { page, size } }),
  getInventoryLog: (id) => api.get(`/admin/inventory/logs/${id}`),
  createProduct: (payload) => api.post('/admin/products', payload),
  updateProduct: (id, payload) => api.put(`/admin/products/${id}`, payload),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/admin/products/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getProducts: (params = {}) => api.get('/products', { params }),
  getProductDetail: (idOrSlug) => api.get(`/products/${idOrSlug}`),
  getRelatedProducts: (productName) => api.get(`/products/related/${encodeURIComponent(productName)}`),
  getFeaturedProducts: (limit = 8) => api.get('/products/featured', { params: { limit } }),
  getLatestProducts: (limit = 12) => api.get('/products/featured/latest', { params: { limit } }),
  getFlashSaleProducts: (limit = 12) => api.get('/products/flash-sale', { params: { limit } }),
  getHomeBrandSections: (brands = ['apple', 'samsung', 'xiaomi'], limitPerBrand = 8) =>
    api.get('/products/home/sections', {
      params: { brands, limitPerBrand },
      paramsSerializer: {
        indexes: null,
      },
    }),
};

export default ProductService;
