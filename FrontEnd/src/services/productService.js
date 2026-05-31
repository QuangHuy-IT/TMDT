import api from '../api/axiosInstance';
import adminApi from '../api/adminAxiosInstance';

const pendingProductListRequests = new Map();
const pendingProductDetailRequests = new Map();

const getRequestKey = (params = {}) => JSON.stringify(
  Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([left], [right]) => left.localeCompare(right))
);

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
  getProducts: (params = {}) => {
    const key = getRequestKey(params);
    if (!pendingProductListRequests.has(key)) {
      const request = api.get('/products', { params })
        .finally(() => pendingProductListRequests.delete(key));
      pendingProductListRequests.set(key, request);
    }
    return pendingProductListRequests.get(key);
  },
  getProductDetail: (idOrSlug) => {
    const key = String(idOrSlug || '');
    if (!pendingProductDetailRequests.has(key)) {
      const request = api.get(`/products/${idOrSlug}`)
        .finally(() => pendingProductDetailRequests.delete(key));
      pendingProductDetailRequests.set(key, request);
    }
    return pendingProductDetailRequests.get(key);
  },
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
