import api from '../api/axiosInstance';

export const brandService = {
  // Lấy danh sách toàn bộ thương hiệu
  getBrands: async () => {
    const response = await api.get('/brands');
    return response.data;
  },
  
  // Lấy sản phẩm theo thương hiệu (Sửa lại cho khớp với ProductController)
  getBrandProducts: async (slug) => {
    const response = await api.get(`/products?brand=${slug}&limit=8`);
    return response.data;
  }
};

export default brandService;
