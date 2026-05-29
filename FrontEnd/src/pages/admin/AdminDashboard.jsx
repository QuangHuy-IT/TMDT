import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShopContext } from '../../context/ShopContext';
import ProductService from '../../services/productService';
import DashboardService from '../../services/dashboardService';

const statusStyle = {
  'Đang giao': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Đã giao':   'bg-green-500/10 text-green-400 border-green-500/20',
  'Đang chờ':  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Đã xác nhận': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Đang đóng gói': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Đã hủy':    'bg-red-500/10 text-red-400 border-red-500/20',
  'Trả hàng':  'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

const StatCard = ({ label, value, sub, icon, accent }) => (
  <div className={`relative bg-[#13151e] border border-white/5 rounded-2xl p-5 overflow-hidden`}>
    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20 ${accent}`}></div>
    <div className="relative z-10">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${accent} bg-opacity-10`}>
        {icon}
      </div>
      <p className="text-2xl font-black text-white tracking-tight">{value}</p>
      <p className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-wider">{label}</p>
      {sub && <p className="text-[11px] text-gray-600 mt-1">{sub}</p>}
    </div>
  </div>
);

export const AdminDashboard = () => {
  const { state } = useContext(ShopContext);
  const navigate = useNavigate();

  // Stats data
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    pendingOrders: 0,
    revenueGrowthPercent: 0,
    ordersGrowthPercent: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Top products data (from orders)
  const [topProducts, setTopProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Recent orders data
  const [recentOrders, setRecentOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Monthly revenue data
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [loadingRevenue, setLoadingRevenue] = useState(true);

  // Date range filter state
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  // Quick filter presets
  const handleQuickFilter = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days + 1);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoadingStats(true);
      try {
        const params = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        const response = await DashboardService.getStats(params);
        setStats(response.data);
      } catch (error) {
        console.error('Cannot load dashboard stats', error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchDashboardData();
  }, [startDate, endDate]);

  useEffect(() => {
    const fetchTopProducts = async () => {
      setLoadingProducts(true);
      try {
        const params = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        params.limit = 5;
        const response = await DashboardService.getTopProducts(params);
        setTopProducts(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Cannot load top products', error);
        setTopProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchTopProducts();
  }, [startDate, endDate]);

  useEffect(() => {
    const fetchRecentOrders = async () => {
      setLoadingOrders(true);
      try {
        const response = await DashboardService.getRecentOrders();
        setRecentOrders(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Cannot load recent orders', error);
        setRecentOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchRecentOrders();
  }, []);

  useEffect(() => {
    const fetchMonthlyRevenue = async () => {
      setLoadingRevenue(true);
      try {
        const params = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        const response = await DashboardService.getRevenue(params);
        setMonthlyRevenue(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Cannot load monthly revenue', error);
        setMonthlyRevenue([]);
      } finally {
        setLoadingRevenue(false);
      }
    };

    fetchMonthlyRevenue();
  }, [startDate, endDate]);


  // Format revenue data for chart (convert to millions)
  const chartData = useMemo(() => {
    if (monthlyRevenue.length === 0) {
      // Calculate days in range
      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      
      if (daysDiff <= 31) {
        return Array.from({ length: daysDiff }, (_, i) => ({
          month: `Ng${i + 1}`,
          value: 0,
        }));
      } else {
        return [
          { month: 'T1', value: 0 },
          { month: 'T2', value: 0 },
          { month: 'T3', value: 0 },
          { month: 'T4', value: 0 },
          { month: 'T5', value: 0 },
          { month: 'T6', value: 0 },
        ];
      }
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    return monthlyRevenue.map((item) => {
      if (daysDiff <= 31) {
        return {
          month: item.month,
          value: item.revenue > 0 ? Math.round(item.revenue / 1000000 * 10) / 10 : 0,
        };
      } else {
        const [month, year] = item.month.split('/');
        return {
          month: `T${parseInt(month)}`,
          value: item.revenue > 0 ? Math.round(item.revenue / 1000000 * 10) / 10 : 0,
        };
      }
    });
  }, [monthlyRevenue, startDate, endDate]);

  const maxVal = useMemo(() => {
    const values = chartData.map(d => d.value);
    return Math.max(...values, 1);
  }, [chartData]);

  const formatPrice = (price) => Number(price || 0).toLocaleString();
  const getThumbnail = (product) => {
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0];
    }
    return product.image || '';
  };

  const formatGrowth = (percent) => {
    const sign = percent >= 0 ? '↑' : '↓';
    return `${sign} ${Math.abs(percent).toFixed(1)}%`;
  };

  const formatGrowthColor = (percent) => {
    return percent >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const getRevenueLabel = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    if (daysDiff === 1) {
      return 'Doanh thu hôm nay';
    } else if (daysDiff <= 7) {
      return `Doanh thu ${daysDiff} ngày`;
    } else if (daysDiff <= 31) {
      return `Doanh thu ${daysDiff} ngày`;
    } else {
      return 'Doanh thu';
    }
  };

  const getChartTitle = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    if (daysDiff <= 31) {
      return 'Doanh thu theo ngày';
    } else {
      return 'Doanh thu theo tháng';
    }
  };

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Tổng quan hoạt động cửa hàng</p>
        </div>
        
        {/* Date Range Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick filter buttons */}
          <div className="flex items-center gap-1 bg-[#13151e] border border-white/10 rounded-lg p-1">
            <button
              onClick={() => handleQuickFilter(1)}
              className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors hover:bg-white/10"
            >
              Hôm nay
            </button>
            <button
              onClick={() => handleQuickFilter(7)}
              className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors hover:bg-white/10"
            >
              7 ngày
            </button>
            <button
              onClick={() => handleQuickFilter(30)}
              className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors hover:bg-white/10"
            >
              30 ngày
            </button>
          </div>
          
          {/* Date inputs */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-[#13151e] border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-500/50 transition-colors"
            />
            <span className="text-gray-500 text-sm">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-[#13151e] border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-500/50 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={getRevenueLabel()}
          value={loadingStats ? '...' : `${(stats.totalRevenue / 1e6).toFixed(1)}M₫`}
          sub={loadingStats ? 'Đang tải...' : `So với kỳ trước: ${formatGrowth(stats.revenueGrowthPercent)}`}
          accent="bg-red-500"
          icon={<svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label="Đơn hàng"
          value={loadingStats ? '...' : stats.totalOrders}
          sub={loadingStats ? 'Đang tải...' : `${stats.pendingOrders} đơn đang xử lý`}
          accent="bg-blue-500"
          icon={<svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
        />
        <StatCard
          label="Sản phẩm"
          value={loadingStats ? '...' : stats.totalProducts}
          sub={loadingProducts ? 'Đang đồng bộ dữ liệu...' : 'Từ hệ thống backend'}
          accent="bg-purple-500"
          icon={<svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
        />
        <StatCard
          label="Người dùng"
          value={loadingStats ? '...' : stats.totalUsers}
          sub={loadingStats ? 'Đang tải...' : formatGrowth(stats.ordersGrowthPercent) + ' người dùng mới'}
          accent="bg-green-500"
          icon={<svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Biểu đồ doanh thu */}
        <div className="lg:col-span-2 bg-[#13151e] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-white">{getChartTitle()}</h2>
              <p className="text-xs text-gray-500 mt-0.5">Đơn vị: triệu đồng</p>
            </div>
            {loadingStats ? (
              <span className="text-xs text-gray-500 bg-gray-500/10 border border-gray-500/20 px-2 py-1 rounded-lg font-medium animate-pulse">
                Đang tải...
              </span>
            ) : (
              <span className={`text-xs ${formatGrowthColor(stats.revenueGrowthPercent)} bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-lg font-medium`}>
                {formatGrowth(stats.revenueGrowthPercent)}
              </span>
            )}
          </div>

          {/* Bar chart */}
          <div className="overflow-x-auto">
            <div 
              className="flex items-end justify-between gap-1 h-36 min-w-full"
              style={{ minWidth: chartData.length > 15 ? `${chartData.length * 30}px` : '100%' }}
            >
              {chartData.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0" style={{ width: `${Math.max(100 / chartData.length, 3)}%`, maxWidth: '60px', minWidth: '24px' }}>
                  <span className="text-[10px] text-gray-500 font-mono">{d.value}M</span>
                  <div
                    className="w-full rounded-t-lg transition-all duration-700 relative group"
                    style={{
                      height: `${Math.max((d.value / maxVal) * 100, 2)}%`,
                      background: i === chartData.length - 1
                        ? 'linear-gradient(to top, #dc2626, #f87171)'
                        : 'rgba(255,255,255,0.07)',
                      minHeight: '8px',
                    }}
                  >
                    <div className="absolute inset-0 rounded-t-lg bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <span className="text-[10px] text-gray-500 truncate">{d.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top sản phẩm bán chạy */}
        <div className="bg-[#13151e] border border-white/5 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white mb-5">Top sản phẩm bán chạy</h2>
          <div className="space-y-4">
            {loadingProducts ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-8 h-8 bg-gray-700 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-700 rounded w-3/4 mb-1"></div>
                      <div className="h-2 bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : topProducts.length > 0 ? (
              topProducts.map((p, i) => (
                <div key={p.variantId || `${p.productName}-${i}`} className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-gray-600 w-4">{i + 1}</span>
                  <img
                    src={p.image || 'https://picsum.photos/seed/default/80/80'}
                    alt=""
                    className="w-8 h-8 object-contain bg-white/5 rounded-lg p-0.5 flex-shrink-0"
                    onError={(e) => { e.target.src = 'https://picsum.photos/seed/fallback/80/80'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{p.productName}</p>
                    <p className="text-[10px] text-gray-500">{formatPrice(p.price)}₫</p>
                  </div>
                  <span className="text-[10px] text-green-400 font-medium">
                    {p.soldCount} đã bán
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500">Chưa có sản phẩm nào được bán trong khoảng thời gian này.</p>
            )}
          </div>
        </div>
      </div>

      {/* Đơn hàng gần đây */}
      <div className="bg-[#13151e] border border-white/5 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-sm font-bold text-white">Đơn hàng gần đây</h2>
          <button
            onClick={() => navigate('/admin/orders')}
            className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
          >
            Xem tất cả →
          </button>
        </div>
        <div className="overflow-x-auto">
          {loadingOrders ? (
            <div className="p-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 py-3 animate-pulse">
                  <div className="h-4 bg-gray-700 rounded w-20"></div>
                  <div className="h-4 bg-gray-700 rounded w-32"></div>
                  <div className="h-4 bg-gray-700 rounded w-24"></div>
                  <div className="h-4 bg-gray-700 rounded w-28"></div>
                  <div className="h-4 bg-gray-700 rounded w-20"></div>
                </div>
              ))}
            </div>
          ) : recentOrders.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="text-[10px] text-gray-500 uppercase tracking-widest border-b border-white/5">
                  <th className="text-left px-6 py-3 font-medium">Mã đơn</th>
                  <th className="text-left px-6 py-3 font-medium">Khách hàng</th>
                  <th className="text-left px-6 py-3 font-medium">Ngày đặt</th>
                  <th className="text-right px-6 py-3 font-medium">Tổng tiền</th>
                  <th className="text-center px-6 py-3 font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-red-400 font-mono">#{order.orderCode}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-300">{order.customerName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">{order.createdAt}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-white">{formatPrice(order.totalAmount)}₫</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${statusStyle[order.orderStatus] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-gray-500 text-sm">
              Chưa có đơn hàng nào.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
