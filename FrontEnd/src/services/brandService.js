import api from '../api/axiosInstance';

export const brandService = {
  getBrands: async () => {
    const response = await api.get('/brands');
    return response.data;
  },

  getBrand: async (slug) => {
    const response = await api.get(`/brands/${slug}`);
    return response.data;
  },

  getBrandSeries: async (brandSlug) => {
    const response = await api.get(`/brands/${brandSlug}/series`);
    return response.data;
  },

  getBrandProducts: async (slug) => {
    const response = await api.get(`/products?brand=${slug}&limit=8`);
    return response.data;
  }
};

export default brandService;
