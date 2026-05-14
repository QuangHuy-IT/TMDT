import React, { useEffect, useState, useMemo } from 'react';
import AdminService from '../../services/adminService';

const STATUS_CONFIG = {
  PENDING:    { label: 'Đang chờ',    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-400' },
  CONFIRMED:  { label: 'Đã xác nhận', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20', dot: 'bg-blue-400' },
  PACKING:    { label: 'Đóng gói',    badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', dot: 'bg-indigo-400' },
  SHIPPING:   { label: 'Đang giao',   badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20', dot: 'bg-purple-400' },
  DELIVERED:  { label: 'Đã giao',     badge: 'bg-green-500/10 text-green-400 border-green-500/20', dot: 'bg-green-400' },
  CANCELED:   { label: 'Đã hủy',      badge: 'bg-red-500/10 text-red-400 border-red-500/20', dot: 'bg-red-400' },
  RETURNED:   { label: 'Trả hàng',     badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20', dot: 'bg-orange-400' },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG);
const STATUS_LABELS = ['Tất cả', ...Object.values(STATUS_CONFIG).map(s => s.label)];

// Map status label → enum key
const labelToKey = {};
Object.entries(STATUS_CONFIG).forEach(([k, v]) => { labelToKey[v.label] = k; });

export const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('Tất cả');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await AdminService.getOrders();
      setOrders(Array.isArray(res.data) ? res.data : (res.data?.data ?? []));
    } catch (e) {
      console.error('[AdminOrders] fetch error:', e);
      setFetchError(e.response?.data?.message || 'Không thể tải danh sách đơn hàng. Đảm bảo backend đang chạy.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetail = async (orderId) => {
    setDetailLoading(true);
    setSelectedOrderDetail(null);
    try {
      const res = await AdminService.getOrder(orderId);
      setSelectedOrderDetail(res.data);
    } catch (e) {
      console.error(e);
      alert('Không thể tải chi tiết đơn hàng');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    if (!window.confirm(`Cập nhật trạng thái đơn hàng thành "${STATUS_CONFIG[newStatus]?.label || newStatus}"?`)) return;
    setUpdatingStatus(orderId);
    try {
      const res = await AdminService.updateOrderStatus(orderId, { orderStatus: newStatus });
      const updated = res.data;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, orderStatus: updated.orderStatus } : o));
      if (selectedOrder?.id === orderId) setSelectedOrder(prev => ({ ...prev, orderStatus: updated.orderStatus }));
      if (selectedOrderDetail?.id === orderId) setSelectedOrderDetail(prev => ({ ...prev, orderStatus: updated.orderStatus }));
    } catch (e) {
      alert('Cập nhật thất bại: ' + (e.response?.data?.message || e.message));
    } finally {
      setUpdatingStatus(null);
    }
  };

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const statusLabel = STATUS_CONFIG[o.orderStatus]?.label || o.orderStatus;
      const matchStatus = filterStatus === 'Tất cả' || statusLabel === filterStatus;
      const matchSearch = (o.orderCode || '').toLowerCase().includes(search.toLowerCase()) ||
                         (o.receiverName || '').toLowerCase().includes(search.toLowerCase()) ||
                         (o.userEmail || '').toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [orders, filterStatus, search]);

  const stats = useMemo(() => ({
    total:     orders.length,
    pending:   orders.filter(o => o.orderStatus === 'PENDING').length,
    shipping:  orders.filter(o => ['CONFIRMED', 'PACKING', 'SHIPPING'].includes(o.orderStatus)).length,
    delivered: orders.filter(o => o.orderStatus === 'DELIVERED').length,
    canceled:  orders.filter(o => o.orderStatus === 'CANCELED').length,
  }), [orders]);

  const formatMoney = (v) => v != null ? Number(v).toLocaleString('vi-VN') + '₫' : '—';
  const getStatus = (s) => STATUS_CONFIG[s] || { label: s, badge: 'bg-gray-500/10 text-gray-400 border-gray-500/20', dot: 'bg-gray-400' };

  const openDetail = async (order) => {
    setSelectedOrder(order);
    await fetchOrderDetail(order.id);
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Đơn hàng</h1>
        <p className="text-sm text-gray-500 mt-1">Quản lý và cập nhật trạng thái đơn hàng</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Tổng đơn',   value: stats.total,     color: 'text-white' },
          { label: 'Đang chờ',   value: stats.pending,   color: 'text-amber-400' },
          { label: 'Đang xử lý', value: stats.shipping,  color: 'text-blue-400' },
          { label: 'Đã giao',    value: stats.delivered, color: 'text-green-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#13151e] border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-gray-500">{s.label}</span>
            <span className={`text-xl font-black ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Filter + Search */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex gap-2 flex-wrap">
          {STATUS_LABELS.map(label => {
            const isActive = filterStatus === label;
            const dotColor = label === 'Tất cả' ? 'bg-gray-400' : Object.values(STATUS_CONFIG).find(s => s.label === label)?.dot;
            return (
              <button key={label} onClick={() => setFilterStatus(label)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  isActive
                    ? 'bg-red-600 text-white border-red-600'
                    : 'border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                }`}>
                {dotColor && <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${dotColor}`} />}
                {label}
              </button>
            );
          })}
        </div>
        <div className="relative flex-1 md:max-w-xs ml-auto">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm mã đơn, khách hàng..."
            className="w-full bg-[#13151e] border border-white/5 rounded-xl py-2 pl-9 pr-4 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-all" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#13151e] border border-white/5 rounded-2xl overflow-hidden">
        {loading && <div className="px-6 py-4 text-sm text-gray-400 border-b border-white/5">Đang tải...</div>}
        {fetchError && (
          <div className="px-6 py-4 border-b border-red-500/20 bg-red-500/5">
            <p className="text-sm text-red-400 font-medium">Lỗi: {fetchError}</p>
            <button onClick={fetchOrders} className="mt-2 text-xs text-red-400 underline hover:text-red-300">Thử lại</button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-gray-500 uppercase tracking-widest border-b border-white/5">
                <th className="text-left px-6 py-3 font-medium">Mã đơn</th>
                <th className="text-left px-6 py-3 font-medium">Khách hàng</th>
                <th className="text-left px-6 py-3 font-medium hidden lg:table-cell">Ngày đặt</th>
                <th className="text-right px-6 py-3 font-medium">Tổng tiền</th>
                <th className="text-center px-6 py-3 font-medium">Trạng thái</th>
                <th className="text-center px-6 py-3 font-medium">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => {
                const st = getStatus(order.orderStatus);
                return (
                  <tr key={order.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-red-400 font-mono">#{order.orderCode}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-white">{order.receiverName || order.userFullName || '—'}</p>
                      <p className="text-xs text-gray-500">{order.receiverPhone || order.userEmail || ''}</p>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-sm text-gray-500">{order.placedAt || order.createdAt || '—'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-white">{formatMoney(order.totalAmount)}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${st.badge}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => openDetail(order)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <div className="py-16 text-center text-gray-600 font-bold">Không có đơn hàng nào</div>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#13151e] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 bg-[#13151e] z-10">
              <h3 className="text-lg font-black text-white">
                Chi tiết đơn <span className="text-red-400">#{selectedOrder.orderCode}</span>
              </h3>
              <button onClick={() => { setSelectedOrder(null); setSelectedOrderDetail(null); }}
                className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {detailLoading && (
              <div className="py-8 text-center text-gray-500 text-sm">Đang tải chi tiết...</div>
            )}

            {!detailLoading && selectedOrderDetail && (
              <div className="px-6 py-5 space-y-5">

                {/* Customer info */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">Người nhận</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Tên', value: selectedOrderDetail.receiverName || '—' },
                      { label: 'SĐT', value: selectedOrderDetail.receiverPhone || '—' },
                      { label: 'Địa chỉ', value: selectedOrderDetail.shippingAddress || '—' },
                      { label: 'Email', value: selectedOrderDetail.userEmail || '—' },
                    ].map(row => (
                      <div key={row.label} className="bg-white/3 rounded-xl px-4 py-3">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{row.label}</p>
                        <p className="text-sm text-gray-200 font-medium">{row.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">Sản phẩm ({selectedOrderDetail.items?.length || 0})</h4>
                  {selectedOrderDetail.items?.map(item => (
                    <div key={item.id} className="flex items-center justify-between gap-3 bg-white/3 rounded-xl px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{item.productName}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          SKU: {item.sku}
                          {item.ram && item.storage && ` · ${item.ram}GB / ${item.storage}GB`}
                          {item.color && ` · ${item.color}`}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-white">{formatMoney(item.lineTotal)}</p>
                        <p className="text-[10px] text-gray-500">×{item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-2 bg-white/3 rounded-xl px-4 py-3">
                  {[
                    { label: 'Tạm tính', value: selectedOrderDetail.subtotalAmount },
                    { label: 'Giảm giá', value: selectedOrderDetail.discountAmount },
                    { label: 'Phí ship', value: selectedOrderDetail.shippingFee },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">{row.label}</span>
                      <span className="text-sm text-gray-300">{row.value != null ? formatMoney(row.value) : '—'}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center border-t border-white/5 pt-2 mt-1">
                    <span className="text-sm font-black text-white">Tổng cộng</span>
                    <span className="text-lg font-black text-red-400">{formatMoney(selectedOrderDetail.totalAmount)}</span>
                  </div>
                </div>

                {/* Payment */}
                <div className="flex items-center justify-between bg-white/3 rounded-xl px-4 py-3">
                  <span className="text-xs text-gray-500">Thanh toán</span>
                  <span className="text-sm font-medium text-gray-300">{selectedOrderDetail.paymentMethod}</span>
                </div>

                {/* Status change */}
                <div className="space-y-2">
                  <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Cập nhật trạng thái</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ALL_STATUSES.map(s => {
                      const cfg = STATUS_CONFIG[s];
                      const isCurrent = selectedOrderDetail.orderStatus === s;
                      return (
                        <button
                          key={s}
                          onClick={() => !isCurrent && handleStatusChange(selectedOrderDetail.id, s)}
                          disabled={updatingStatus !== null || isCurrent}
                          className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-all text-center ${
                            isCurrent
                              ? `${cfg.badge} cursor-default`
                              : 'border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300 disabled:opacity-30'
                          }`}
                        >
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="px-6 py-4 border-t border-white/5 sticky bottom-0 bg-[#13151e]">
              <button onClick={() => { setSelectedOrder(null); setSelectedOrderDetail(null); }}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-gray-300 font-medium transition-all">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
