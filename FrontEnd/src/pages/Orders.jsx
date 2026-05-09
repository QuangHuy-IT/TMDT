import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import api from '../api/axiosInstance';

const TABS = [
  { key: 'ALL',     label: 'Tất cả' },
  { key: 'PENDING',  label: 'Chờ xác nhận' },
  { key: 'CONFIRMED',label: 'Đang lấy hàng' },
  { key: 'PACKING',  label: 'Đang đóng gói' },
  { key: 'SHIPPING', label: 'Đang giao' },
  { key: 'DELIVERED',label: 'Giao thành công' },
  { key: 'CANCELED', label: 'Đã hủy' },
  { key: 'RETURNED', label: 'Trả hàng' },
];

const OrderStatus = {
  PENDING:    { label: 'Chờ xác nhận',  bg: 'bg-yellow-100', text: 'text-yellow-700' },
  CONFIRMED:  { label: 'Đã xác nhận',   bg: 'bg-blue-100',   text: 'text-blue-700'   },
  PACKING:    { label: 'Đang đóng gói', bg: 'bg-indigo-100', text: 'text-indigo-700' },
  SHIPPING:   { label: 'Đang giao',     bg: 'bg-purple-100', text: 'text-purple-700'},
  DELIVERED:  { label: 'Đã giao',       bg: 'bg-green-100',  text: 'text-green-700'  },
  CANCELED:   { label: 'Đã hủy',        bg: 'bg-gray-100',   text: 'text-gray-400'   },
  RETURNED:   { label: 'Trả hàng',       bg: 'bg-orange-100', text: 'text-orange-700' },
};

export const Orders = () => {
  const navigate = useNavigate();
  const { state } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [reorderStock, setReorderStock] = useState({});
  const [loadingReorder, setLoadingReorder] = useState(false);
  const [cancelingId, setCancelingId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);

  const userId = state?.user?.id;

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const endpoint = activeTab === 'ALL'
      ? `/orders/user/${userId}`
      : `/orders/user/${userId}/status/${activeTab}`;
    api.get(endpoint)
      .then(res => setOrders(res.data))
      .catch(err => console.error('Lỗi khi tải đơn hàng:', err))
      .finally(() => setLoading(false));
  }, [userId, activeTab]);

  useEffect(() => {
    if (!userId) return;
    const completedOrders = orders.filter(o =>
      ['DELIVERED', 'CANCELED', 'RETURNED'].includes(o.orderStatus)
    );
    if (completedOrders.length === 0) return;
    setLoadingReorder(true);
    Promise.all(
      completedOrders.map(o =>
        api.get(`/orders/${o.orderCode}/reorder-stock`)
          .then(res => ({ orderCode: o.orderCode, stock: res.data }))
          .catch(() => ({ orderCode: o.orderCode, stock: {} }))
      )
    ).then(results => {
      const map = {};
      results.forEach(({ orderCode, stock }) => { map[orderCode] = stock; });
      setReorderStock(map);
    }).finally(() => setLoadingReorder(false));
  }, [orders, userId]);

  const handleCancelClick = (order) => {
    setOrderToCancel(order);
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    if (!orderToCancel) return;
    setCancelingId(orderToCancel.id);
    setShowCancelModal(false);
    try {
      const res = await api.patch(`/orders/${orderToCancel.orderCode}/cancel?userId=${userId}`);
      setOrders(prev => prev.map(o => o.id === orderToCancel.id ? res.data : o));
    } catch (err) {
      console.error('Lỗi khi hủy đơn hàng:', err);
      alert(err.response?.data?.message || 'Không thể hủy đơn hàng. Vui lòng thử lại.');
    } finally {
      setCancelingId(null);
      setOrderToCancel(null);
    }
  };

  const handleReorder = (order) => {
    const stockMap = reorderStock[order.orderCode] || {};
    const outOfStock = [];
    order.items.forEach(item => {
      const variantId = item.variantId;
      if (!stockMap[variantId]) {
        outOfStock.push(item.productNameSnapshot);
      }
    });
    if (outOfStock.length > 0) {
      alert(`Các sản phẩm sau đã hết hàng: ${outOfStock.join(', ')}`);
      return;
    }
    navigate(`/order/${order.orderCode}`);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Đang tải đơn hàng...</p>
        </div>
      </main>
    );
  }

  if (!state?.user) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900">Vui lòng đăng nhập</h2>
          <p className="text-gray-500 mt-2 mb-6">Bạn cần đăng nhập để xem đơn hàng.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-200"
          >
            ĐĂNG NHẬP
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 pt-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">
            Lịch sử <span className="text-red-600">Đơn hàng</span>
          </h1>
          <div className="text-sm font-bold text-gray-400 bg-white px-4 py-2 rounded-full border border-gray-100">
            {orders.length} ĐƠN HÀNG
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto mb-8">
          <div className="flex min-w-max">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-3 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${
                  activeTab === tab.key
                    ? 'border-red-600 text-red-600 bg-red-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Order List */}
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-xl font-bold text-gray-900">Không có đơn hàng nào</h2>
            <p className="text-gray-500 mt-2 mb-6">
              {activeTab === 'ALL'
                ? 'Hãy khám phá thêm các sản phẩm tuyệt vời nhé!'
                : 'Không có đơn hàng ở trạng thái này.'}
            </p>
            {activeTab === 'ALL' && (
              <button
                onClick={() => navigate('/')}
                className="px-8 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-200"
              >
                MUA SẮM NGAY
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const statusConfig = OrderStatus[order.orderStatus] || OrderStatus.PENDING;
              const canCancel = order.orderStatus === 'PENDING';
              const canReorder = ['DELIVERED', 'CANCELED', 'RETURNED'].includes(order.orderStatus);
              const isCanceling = cancelingId === order.id;
              const stockMap = reorderStock[order.orderCode] || {};
              const hasReorderStock = canReorder && Object.values(stockMap).some(Boolean);

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 hover:shadow-xl hover:border-red-100 transition-all duration-300"
                >
                  <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className="bg-gray-50 p-5 rounded-2xl text-red-600 font-black text-sm group-hover:bg-red-600 group-hover:text-white transition-colors duration-300">
                      #{order.orderCode}
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Ngày đặt hàng</p>
                      <p className="text-sm font-bold text-gray-800">
                        {order.placedAt ? new Date(order.placedAt).toLocaleDateString('vi-VN') : '—'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{order.items?.length || 0} sản phẩm</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full md:w-auto md:gap-8 border-t md:border-none pt-4 md:pt-0">
                    <div className="text-left md:text-right">
                      <p className="text-xl font-black text-gray-900 tracking-tight">
                        {order.totalAmount?.toLocaleString('vi-VN') || order.total?.toLocaleString('vi-VN')}₫
                      </p>
                      <span className={`inline-block text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-tighter mt-1 ${statusConfig.bg} ${statusConfig.text}`}>
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {canCancel && (
                        <button
                          onClick={() => handleCancelClick(order)}
                          disabled={isCanceling}
                          className="px-5 py-2.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all active:scale-95 disabled:opacity-50"
                        >
                          {isCanceling ? 'ĐANG HỦY...' : 'HỦY ĐƠN'}
                        </button>
                      )}
                      {canReorder && (
                        <button
                          onClick={() => handleReorder(order)}
                          disabled={loadingReorder || (!hasReorderStock && Object.keys(stockMap).length > 0)}
                          className={`px-5 py-2.5 text-xs font-bold rounded-2xl transition-all active:scale-95 disabled:opacity-50 ${
                            hasReorderStock
                              ? 'bg-green-50 text-green-600 hover:bg-green-100'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                          title={!hasReorderStock ? 'Sản phẩm đã hết hàng' : 'Mua lại đơn hàng này'}
                        >
                          MUA LẠI
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/order/${order.orderCode}`)}
                        className="px-8 py-3 bg-gray-900 text-white text-xs font-bold rounded-2xl hover:bg-red-600 hover:shadow-lg hover:shadow-red-200 transition-all active:scale-95"
                      >
                        CHI TIẾT
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Support Card */}
        <div className="mt-12 p-6 bg-red-50 rounded-3xl border border-red-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-xl shadow-sm">🎧</div>
          <div>
            <h4 className="font-bold text-red-900 text-sm">Cần hỗ trợ về đơn hàng?</h4>
            <p className="text-red-700/70 text-xs font-medium">Liên hệ tổng đài 1900xxxx để được giải đáp thắc mắc 24/7.</p>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <div className="text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Xác nhận hủy đơn hàng</h3>
              <p className="text-gray-500 text-sm mb-8">
                Bạn có chắc chắn muốn hủy đơn hàng <strong>#{orderToCancel?.orderCode}</strong> không?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowCancelModal(false); setOrderToCancel(null); }}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-all"
                >
                  KHÔNG, GIỮ ĐƠN
                </button>
                <button
                  onClick={confirmCancel}
                  className="flex-1 py-3 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all"
                >
                  CÓ, HỦY ĐƠN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
