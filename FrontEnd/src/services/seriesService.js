import api from '../api/axiosInstance';
import adminApi from '../api/adminAxiosInstance';

const SeriesService = {
  getAllSeries: () => adminApi.get('/admin/series'),
  
  getSeriesByBrand: (brandId) => adminApi.get(`/admin/series/brand/${brandId}`),
  
  getSeries: (id) => adminApi.get(`/admin/series/${id}`),
  
  createSeries: (payload) => adminApi.post('/admin/series', payload),
  
  updateSeries: (id, payload) => adminApi.put(`/admin/series/${id}`, payload),
  
  deleteSeries: (id) => adminApi.delete(`/admin/series/${id}`),
};

export default SeriesService;
