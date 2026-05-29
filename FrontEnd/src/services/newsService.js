import api from '../api/axiosInstance';
import adminApi from '../api/adminAxiosInstance';

export const newsService = {
  // ── Public API ────────────────────────────────────────────────────────────────
  getPublishedNews: async (page = 0, size = 20) => {
    const response = await api.get('/news', { params: { page, size } });
    return response.data;
  },

  getNewsByCategory: async (category, page = 0, size = 20) => {
    const response = await api.get(`/news/category/${category}`, { params: { page, size } });
    return response.data;
  },

  getNewsById: async (id) => {
    const response = await api.get(`/news/${id}`);
    return response.data;
  },

  getNewsBySlug: async (slug) => {
    const response = await api.get(`/news/slug/${slug}`);
    return response.data;
  },

  searchNews: async (keyword, page = 0, size = 20) => {
    const response = await api.get('/news/search', { params: { keyword, page, size } });
    return response.data;
  },

  getFeaturedNews: async () => {
    const response = await api.get('/news/featured');
    return response.data;
  },

  getRecentNews: async (limit = 6) => {
    const response = await api.get('/news/recent', { params: { limit } });
    return response.data;
  },
};

const AdminNewsService = {
  // ── Admin API ─────────────────────────────────────────────────────────────
  getAllNews: (page = 0, size = 10) => adminApi.get('/admin/news', { params: { page, size } }),

  getNews: (id) => adminApi.get(`/admin/news/${id}`),

  createNews: (payload) => adminApi.post('/admin/news', payload),

  updateNews: (id, payload) => adminApi.put(`/admin/news/${id}`, payload),

  deleteNews: (id) => adminApi.delete(`/admin/news/${id}`),

  togglePublished: (id) => adminApi.patch(`/admin/news/${id}/toggle-published`),
};

export default AdminNewsService;
