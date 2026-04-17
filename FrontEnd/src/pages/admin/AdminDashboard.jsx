import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShopContext } from '../../context/ShopContext';
import ProductService from '../../services/productService';

// Dữ liệu mẫu cho biểu đồ doanh thu
const revenueData = [
  { month: 'T10', value: 42 },
  { month: 'T11', value: 68 },
  { month: 'T12', value: 91 },
  { month: 'T1', value: 55 },
  { month: 'T2', value: 73 },
  { month: 'T3', value: 88 },
];

const maxVal = Math.max(...revenueData.map(d => d.value));

const mockOrders = [
  { id: 'HD9421', customer: 'Nguyễn Văn Hoàng', total: 29990000, status: 'Đang giao', date: '18/03/2026' },
  { id: 'HD8810', customer: 'Trần Thị Mai',     total: 26500000, status: 'Đã giao',   date: '17/03/2026' },
  { id: 'HD7702', customer: 'Lê Minh Tuấn',     total: 8500000,  status: 'Đang chờ',  date: '16/03/2026' },
  { id: 'HD6631', customer: 'Phạm Thu Hà',      total: 13500000, status: 'Đã hủy',    date: '15/03/2026' },
  { id: 'HD5540', customer: 'Hoàng Đức Anh',    total: 22000000, status: 'Đã giao',   date: '14/03/2026' },
];

const statusStyle = {
  'Đang giao': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Đã giao':   'bg-green-500/10 text-green-400 border-green-500/20',
  'Đang chờ':  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Đã hủy':    'bg-red-500/10 text-red-400 border-red-500/20',
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
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    const fetchAdminProducts = async () => {
      setLoadingProducts(true);
      try {
        const response = await ProductService.getAdminProducts();
        setProducts(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Cannot load products for admin dashboard', error);
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchAdminProducts();
  }, []);

  const topProducts = useMemo(() => products.slice(0, 5), [products]);

  const totalRevenue = mockOrders
    .filter(o => o.status === 'Đã giao')
    .reduce((s, o) => s + o.total, 0);

  const formatPrice = (price) => Number(price || 0).toLocaleString();
  const getThumbnail = (product) => {
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0];
    }
    return product.image || '';
  };

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Tổng quan hoạt động cửa hàng</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Doanh thu tháng"
          value={`${(totalRevenue / 1e6).toFixed(1)}M₫`}
          sub="+12% so với tháng trước"
          accent="bg-red-500"
          icon={<svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          label="Đơn hàng"
          value={mockOrders.length}
          sub="3 đơn đang xử lý"
          accent="bg-blue-500"
          icon={<svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
        />
        <StatCard
          label="Sản phẩm"
          value={products.length}
          sub={loadingProducts ? 'Đang đồng bộ dữ liệu...' : 'Từ hệ thống backend'}
          accent="bg-purple-500"
          icon={<svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
        />
        <StatCard
          label="Người dùng"
          value="128"
          sub="+8 người dùng mới"
          accent="bg-green-500"
          icon={<svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Biểu đồ doanh thu */}
        <div className="lg:col-span-2 bg-[#13151e] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-white">Doanh thu 6 tháng</h2>
              <p className="text-xs text-gray-500 mt-0.5">Đơn vị: triệu đồng</p>
            </div>
            <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-lg font-medium">↑ 20.4%</span>
          </div>

          {/* Bar chart */}
          <div className="flex items-end justify-between gap-3 h-36">
            {revenueData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] text-gray-500 font-mono">{d.value}M</span>
                <div
                  className="w-full rounded-t-lg transition-all duration-700 relative group"
                  style={{
                    height: `${(d.value / maxVal) * 100}%`,
                    background: i === revenueData.length - 1
                      ? 'linear-gradient(to top, #dc2626, #f87171)'
                      : 'rgba(255,255,255,0.07)',
                    minHeight: '8px',
                  }}
                >
                  <div className="absolute inset-0 rounded-t-lg bg-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <span className="text-[10px] text-gray-500">{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top sản phẩm */}
        <div className="bg-[#13151e] border border-white/5 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white mb-5">Top sản phẩm</h2>
          <div className="space-y-4">
            {topProducts.map((p, i) => (
              <div key={p.id || p._id || `${p.name}-${i}`} className="flex items-center gap-3">
                <span className="text-[10px] font-black text-gray-600 w-4">{i + 1}</span>
                <img
                  src={getThumbnail(p)}
                  alt=""
                  className="w-8 h-8 object-contain bg-white/5 rounded-lg p-0.5 flex-shrink-0"
                  onError={(e) => { e.target.src = 'https://picsum.photos/seed/fallback/80/80'; }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{p.name}</p>
                  <p className="text-[10px] text-gray-500">{formatPrice(p.price)}₫</p>
                </div>
                <span className="text-[10px] text-gray-500 font-mono">
                  {Math.floor(Math.random() * 50 + 10)} đã bán
                </span>
              </div>
            ))}
            {!loadingProducts && topProducts.length === 0 && (
              <p className="text-xs text-gray-500">Chưa có dữ liệu sản phẩm từ backend.</p>
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
              {mockOrders.map((order) => (
                <tr key={order.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-sm font-black text-red-400 font-mono">#{order.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-300">{order.customer}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">{order.date}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-bold text-white">{order.total.toLocaleString()}₫</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${statusStyle[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};