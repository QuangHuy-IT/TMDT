import api from '../api/axiosInstance';
import adminApi from '../api/adminAxiosInstance';

const ProductService = {
  getAdminProducts: () => adminApi.get('/admin/products'),
  getAdminProduct: (id) => adminApi.get(`/admin/products/${id}`),
  getAdminInventoryProducts: () => adminApi.get('/admin/inventory/products'),
  adjustInventory: (productId, payload) => adminApi.put(`/admin/inventory/${productId}/adjust`, payload),
  batchAdjustInventory: (payload) => adminApi.post('/admin/inventory/adjust', payload),
  getInventoryLogs: (page = 0, size = 10) => adminApi.get('/admin/inventory/logs', { params: { page, size } }),
  getInventoryLog: (id) => adminApi.get(`/admin/inventory/logs/${id}`),
  createProduct: (payload) => adminApi.post('/admin/products', payload),
  updateProduct: (id, payload) => adminApi.put(`/admin/products/${id}`, payload),
  deleteProduct: (id) => adminApi.delete(`/admin/products/${id}`),
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return adminApi.post('/admin/products/upload-image', formData, {
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
