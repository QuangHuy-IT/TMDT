import React, { useState, useMemo } from 'react';

const mockOrders = [
  { id: 'HD9421', customer: 'Nguyễn Văn Hoàng', phone: '0987654321', total: 29990000, status: 'Đang giao',  date: '18/03/2026', items: 1, address: 'Số 12, Cầu Giấy, Hà Nội' },
  { id: 'HD8810', customer: 'Trần Thị Mai',      phone: '0912345678', total: 26500000, status: 'Đã giao',    date: '17/03/2026', items: 2, address: 'Số 34, Hoàn Kiếm, Hà Nội' },
  { id: 'HD7702', customer: 'Lê Minh Tuấn',      phone: '0901234567', total: 8500000,  status: 'Đang chờ',   date: '16/03/2026', items: 1, address: 'Số 56, Đống Đa, Hà Nội' },
  { id: 'HD6631', customer: 'Phạm Thu Hà',       phone: '0978654321', total: 13500000, status: 'Đã hủy',     date: '15/03/2026', items: 1, address: 'Số 78, Ba Đình, Hà Nội' },
  { id: 'HD5540', customer: 'Hoàng Đức Anh',     phone: '0934567890', total: 22000000, status: 'Đã giao',    date: '14/03/2026', items: 3, address: 'Số 90, Tây Hồ, Hà Nội' },
  { id: 'HD4429', customer: 'Ngô Thanh Tùng',    phone: '0945678901', total: 9900000,  status: 'Đang giao',  date: '13/03/2026', items: 1, address: 'Số 11, Nam Từ Liêm, Hà Nội' },
  { id: 'HD3318', customer: 'Đỗ Minh Châu',      phone: '0956789012', total: 15500000, status: 'Đang chờ',   date: '12/03/2026', items: 2, address: 'Số 22, Thanh Xuân, Hà Nội' },
];

const statusStyle = {
  'Đang giao': { badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',    dot: 'bg-blue-400' },
  'Đã giao':   { badge: 'bg-green-500/10 text-green-400 border-green-500/20', dot: 'bg-green-400' },
  'Đang chờ':  { badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-400' },
  'Đã hủy':    { badge: 'bg-red-500/10 text-red-400 border-red-500/20',       dot: 'bg-red-400' },
};

const ALL_STATUSES = ['Tất cả', 'Đang chờ', 'Đang giao', 'Đã giao', 'Đã hủy'];

export const AdminOrders = () => {
  const [orders, setOrders] = useState(mockOrders);
  const [filterStatus, setFilterStatus] = useState('Tất cả');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const filtered = useMemo(() => {
    return orders.filter(o => {
      const matchStatus = filterStatus === 'Tất cả' || o.status === filterStatus;
      const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) ||
                          o.customer.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [orders, filterStatus, search]);

  const handleStatusChange = (orderId, newStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => ({ ...prev, status: newStatus }));
    }
  };

  const stats = useMemo(() => ({
    total:    orders.length,
    pending:  orders.filter(o => o.status === 'Đang chờ').length,
    shipping: orders.filter(o => o.status === 'Đang giao').length,
    done:     orders.filter(o => o.status === 'Đã giao').length,
    canceled: orders.filter(o => o.status === 'Đã hủy').length,
  }), [orders]);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Đơn hàng</h1>
        <p className="text-sm text-gray-500 mt-1">Quản lý và cập nhật trạng thái đơn hàng</p>
      </div>

      {/* Stat mini */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Tổng đơn',   value: stats.total,    color: 'text-white' },
          { label: 'Đang chờ',   value: stats.pending,  color: 'text-amber-400' },
          { label: 'Đang giao',  value: stats.shipping, color: 'text-blue-400' },
          { label: 'Đã giao',    value: stats.done,     color: 'text-green-400' },
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
          {ALL_STATUSES.map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                filterStatus === s
                  ? 'bg-red-600 text-white border-red-600'
                  : 'border-white/10 text-gray-400 hover:text-white hover:border-white/20'
              }`}>{s}</button>
          ))}
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
              {filtered.map(order => (
                <tr key={order.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-black text-red-400 font-mono">#{order.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-white">{order.customer}</p>
                    <p className="text-xs text-gray-500">{order.phone}</p>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className="text-sm text-gray-500">{order.date}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-bold text-white">{order.total.toLocaleString()}₫</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <select
                      value={order.status}
                      onChange={e => handleStatusChange(order.id, e.target.value)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border cursor-pointer bg-transparent focus:outline-none transition-all ${statusStyle[order.status].badge}`}
                    >
                      {['Đang chờ', 'Đang giao', 'Đã giao', 'Đã hủy'].map(s => (
                        <option key={s} value={s} className="bg-[#13151e] text-gray-300">{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-gray-600 font-bold">Không có đơn hàng nào</div>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#13151e] border border-white/10 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-white">Chi tiết đơn <span className="text-red-400">#{selectedOrder.id}</span></h3>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Khách hàng', value: selectedOrder.customer },
                { label: 'Số điện thoại', value: selectedOrder.phone },
                { label: 'Địa chỉ', value: selectedOrder.address },
                { label: 'Ngày đặt', value: selectedOrder.date },
                { label: 'Số sản phẩm', value: `${selectedOrder.items} sản phẩm` },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-start gap-4">
                  <span className="text-xs text-gray-500 uppercase tracking-wider flex-shrink-0">{row.label}</span>
                  <span className="text-sm text-gray-300 text-right">{row.value}</span>
                </div>
              ))}

              <div className="border-t border-white/5 pt-4 flex justify-between items-center">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Tổng tiền</span>
                <span className="text-xl font-black text-red-400">{selectedOrder.total.toLocaleString()}₫</span>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Trạng thái</p>
                <select
                  value={selectedOrder.status}
                  onChange={e => handleStatusChange(selectedOrder.id, e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-red-500/50 transition-all"
                >
                  {['Đang chờ', 'Đang giao', 'Đã giao', 'Đã hủy'].map(s => (
                    <option key={s} value={s} className="bg-[#13151e]">{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <button onClick={() => setSelectedOrder(null)}
              className="w-full mt-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-gray-300 font-medium transition-all">
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};