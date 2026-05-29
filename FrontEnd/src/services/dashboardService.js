import adminApi from '../api/adminAxiosInstance';

const DashboardService = {
  getStats: (params = {}) => adminApi.get('/admin/dashboard/stats', { params }),
  getRecentOrders: () => adminApi.get('/admin/dashboard/recent-orders'),
  getRevenue: (params = {}) => adminApi.get('/admin/dashboard/revenue', { params }),
  getTopProducts: (params = {}) => adminApi.get('/admin/dashboard/top-products', { params }),
};

export default DashboardService;
