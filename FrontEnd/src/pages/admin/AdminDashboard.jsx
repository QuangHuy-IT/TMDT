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

  const [hoveredIndex, setHoveredIndex] = useState(null);

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
          rawRevenue: 0,
        }));
      } else {
        return [
          { month: 'T1', value: 0, rawRevenue: 0 },
          { month: 'T2', value: 0, rawRevenue: 0 },
          { month: 'T3', value: 0, rawRevenue: 0 },
          { month: 'T4', value: 0, rawRevenue: 0 },
          { month: 'T5', value: 0, rawRevenue: 0 },
          { month: 'T6', value: 0, rawRevenue: 0 },
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
          rawRevenue: item.revenue || 0,
        };
      } else {
        const [month, year] = item.month.split('/');
        return {
          month: `T${parseInt(month)}`,
          value: item.revenue > 0 ? Math.round(item.revenue / 1000000 * 10) / 10 : 0,
          rawRevenue: item.revenue || 0,
        };
      }
    });
  }, [monthlyRevenue, startDate, endDate]);

  const maxVal = useMemo(() => {
    const values = chartData.map(d => d.value);
    return Math.max(...values, 1);
  }, [chartData]);

  // Metric summaries for the period
  const peakDay = useMemo(() => {
    if (!chartData || chartData.length === 0) return null;
    return chartData.reduce((max, item) => item.rawRevenue > max.rawRevenue ? item : max, chartData[0]);
  }, [chartData]);

  const averageRevenue = useMemo(() => {
    if (!chartData || chartData.length === 0) return 0;
    const total = chartData.reduce((sum, item) => sum + item.rawRevenue, 0);
    return Math.round(total / chartData.length);
  }, [chartData]);

  const activeDaysCount = useMemo(() => {
    if (!chartData) return 0;
    return chartData.filter(item => item.rawRevenue > 0).length;
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
      return 'Tổng doanh thu';
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

  const svgWidth = 600;
  const svgHeight = 200;
  const svgPadding = { top: 20, right: 20, bottom: 30, left: 30 };

  const svgPoints = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    const usableWidth = svgWidth - svgPadding.left - svgPadding.right;
    const usableHeight = svgHeight - svgPadding.top - svgPadding.bottom;
    
    return chartData.map((d, i) => {
      const x = svgPadding.left + (i / Math.max(chartData.length - 1, 1)) * usableWidth;
      const y = maxVal > 0 
        ? svgPadding.top + (1 - (d.value / maxVal)) * usableHeight
        : svgHeight - svgPadding.bottom;
      return { x, y, data: d, index: i };
    });
  }, [chartData, maxVal]);

  const svgLinePath = useMemo(() => {
    if (svgPoints.length === 0) return '';
    return `M ${svgPoints[0].x} ${svgPoints[0].y} ` + svgPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
  }, [svgPoints]);

  const svgAreaPath = useMemo(() => {
    if (svgPoints.length === 0) return '';
    return `${svgLinePath} L ${svgPoints[svgPoints.length - 1].x} ${svgHeight - svgPadding.bottom} L ${svgPoints[0].x} ${svgHeight - svgPadding.bottom} Z`;
  }, [svgPoints, svgLinePath]);

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
        <div className="lg:col-span-2 bg-[#13151e] border border-white/5 rounded-2xl p-6 relative">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {getChartTitle()}
              </h2>
              <p className="text-[10px] text-gray-500 mt-0.5">Đơn vị: triệu đồng | Di chuột để xem chi tiết</p>
            </div>
            
            <div className="flex items-center gap-3">

              {/* Growth badge */}
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
          </div>

          {/* SVG Chart Container */}
          <div className="relative w-full h-[200px]">
            {loadingRevenue ? (
              <div className="absolute inset-0 flex items-center justify-center bg-[#13151e]/50 z-10">
                <div className="w-6 h-6 border-2 border-white/10 border-t-red-500 rounded-full animate-spin"></div>
              </div>
            ) : null}

            {chartData.length > 0 ? (
              <svg 
                viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
                className="w-full h-full overflow-visible"
              >
                <defs>
                  {/* Area gradient */}
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y-axis grids and labels */}
                {[0, 0.5, 1].map((ratio) => {
                  const y = svgPadding.top + ratio * (svgHeight - svgPadding.top - svgPadding.bottom);
                  const displayValue = maxVal * (1 - ratio);
                  return (
                    <g key={ratio}>
                      <line 
                        x1={svgPadding.left} 
                        y1={y} 
                        x2={svgWidth - svgPadding.right} 
                        y2={y} 
                        stroke="rgba(255,255,255,0.03)" 
                        strokeDasharray="4 4"
                      />
                      <text 
                        x={0} 
                        y={y + 3} 
                        textAnchor="start" 
                        className="text-[10px] fill-gray-500 font-mono font-bold"
                      >
                        {displayValue > 0 ? `${displayValue.toFixed(1)}M` : '0M'}
                      </text>
                    </g>
                  );
                })}

                {/* Draw Area / Line Chart */}
                {svgPoints.length > 0 && (
                  <>
                    {/* Area fill */}
                    <path 
                      d={svgAreaPath} 
                      fill="url(#areaGrad)" 
                    />
                    {/* Line stroke */}
                    <path 
                      d={svgLinePath} 
                      fill="none" 
                      stroke="#ef4444" 
                      strokeWidth="2.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      style={{ filter: 'drop-shadow(0px 3px 4px rgba(239, 68, 68, 0.2))' }}
                    />
                    {/* Data joint dots */}
                    {svgPoints.map((p, idx) => {
                      const isHovered = hoveredIndex === idx;
                      return (
                        <circle
                          key={idx}
                          cx={p.x}
                          cy={p.y}
                          r={isHovered ? 5.5 : 3}
                          fill={isHovered ? '#ffffff' : '#ef4444'}
                          stroke={isHovered ? '#ef4444' : '#ffffff'}
                          strokeWidth={isHovered ? 2.5 : 1}
                          className="transition-all duration-150"
                        />
                      );
                    })}
                  </>
                )}

                {/* Hover vertical guidelining */}
                {hoveredIndex !== null && svgPoints[hoveredIndex] && (
                  <line
                    x1={svgPoints[hoveredIndex].x}
                    y1={svgPadding.top}
                    x2={svgPoints[hoveredIndex].x}
                    y2={svgHeight - svgPadding.bottom}
                    stroke="rgba(239, 68, 68, 0.25)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    className="pointer-events-none"
                  />
                )}

                {/* X-axis date labels */}
                {svgPoints.map((p, idx) => {
                  const showLabel = chartData.length <= 7 
                    ? true 
                    : chartData.length <= 15 
                      ? idx % 2 === 0 
                      : chartData.length <= 31 
                        ? idx % 5 === 0 || idx === chartData.length - 1
                        : idx % 10 === 0 || idx === chartData.length - 1;
                  if (!showLabel) return null;
                  return (
                    <text
                      key={idx}
                      x={p.x}
                      y={svgHeight - 12}
                      textAnchor="middle"
                      className="text-[9px] fill-gray-500 font-medium"
                    >
                      {p.data.month}
                    </text>
                  );
                })}

                {/* Invisible hover-capture rectangles */}
                {svgPoints.map((p, idx) => {
                  const stepWidth = (svgWidth - svgPadding.left - svgPadding.right) / Math.max(chartData.length - 1, 1);
                  return (
                    <rect
                      key={idx}
                      x={p.x - stepWidth / 2}
                      y={svgPadding.top}
                      width={stepWidth}
                      height={svgHeight - svgPadding.top - svgPadding.bottom}
                      fill="transparent"
                      className="cursor-pointer pointer-events-auto"
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                  );
                })}
              </svg>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                Không có dữ liệu trong khoảng thời gian này
              </div>
            )}

            {/* Interactive Floating Tooltip */}
            {hoveredIndex !== null && chartData[hoveredIndex] && svgPoints[hoveredIndex] && (
              <div 
                className="absolute z-20 bg-[#1e2230] border border-white/10 rounded-xl p-3 shadow-2xl pointer-events-none transition-all duration-75 flex flex-col gap-1 min-w-[120px]"
                style={{
                  left: `${Math.min(Math.max((svgPoints[hoveredIndex].x / svgWidth) * 100, 15), 85)}%`,
                  top: `${Math.max((svgPoints[hoveredIndex].y / svgHeight) * 100 - 30, 20)}%`,
                  transform: 'translate(-50%, -100%)',
                }}
              >
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block border-b border-white/5 pb-1">
                  {chartData[hoveredIndex].month}
                </span>
                <span className="text-xs font-black text-white block mt-0.5">
                  {Number(chartData[hoveredIndex].rawRevenue).toLocaleString('vi-VN')}₫
                </span>
                <span className="text-[9px] font-bold text-red-400 flex items-center gap-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  {chartData[hoveredIndex].value}M triệu VNĐ
                </span>
              </div>
            )}
          </div>

          {/* Metrics Summary Row */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider truncate">Đỉnh doanh thu</p>
                <p className="text-xs font-black text-white mt-0.5 truncate">
                  {peakDay ? `${formatPrice(peakDay.rawRevenue)}₫` : '0₫'}
                </p>
                {peakDay && peakDay.rawRevenue > 0 && (
                  <p className="text-[8px] text-gray-600 font-medium truncate">Mốc: {peakDay.month}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider truncate">Trung bình ngày</p>
                <p className="text-xs font-black text-white mt-0.5 truncate">{formatPrice(averageRevenue)}₫</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider truncate">Ngày có đơn</p>
                <p className="text-xs font-black text-white mt-0.5 truncate">{activeDaysCount} ngày</p>
                {chartData.length > 0 && (
                  <p className="text-[8px] text-gray-600 font-medium truncate">
                    Tỷ lệ: {Math.round((activeDaysCount / chartData.length) * 100)}%
                  </p>
                )}
              </div>
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
        <div className="overflow-x-auto scrollbar-hide">
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
