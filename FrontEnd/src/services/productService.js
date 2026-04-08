import api from '../api/axiosInstance';

const ProductService = {
  getAdminProducts: () => api.get('/admin/products'),
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
  getProducts: () => api.get('/products'),
};

export default ProductService;
