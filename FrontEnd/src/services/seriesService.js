import api from '../api/axiosInstance';

const SeriesService = {
  getAllSeries: () => api.get('/admin/series'),
  
  getSeriesByBrand: (brandId) => api.get(`/admin/series/brand/${brandId}`),
  
  getSeries: (id) => api.get(`/admin/series/${id}`),
  
  createSeries: (payload) => api.post('/admin/series', payload),
  
  updateSeries: (id, payload) => api.put(`/admin/series/${id}`, payload),
  
  deleteSeries: (id) => api.delete(`/admin/series/${id}`),
};

export default SeriesService;
