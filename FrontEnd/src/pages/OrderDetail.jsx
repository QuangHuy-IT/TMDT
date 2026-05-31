import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import api from '../api/axiosInstance';

const OrderStatus = {
  PENDING:    { label: 'Chờ xác nhận',  bg: 'bg-yellow-100', text: 'text-yellow-700' },
  CONFIRMED:  { label: 'Đã xác nhận',   bg: 'bg-blue-100',   text: 'text-blue-700'   },
  PACKING:    { label: 'Đang đóng gói', bg: 'bg-indigo-100', text: 'text-indigo-700' },
  SHIPPING:   { label: 'Đang giao',     bg: 'bg-purple-100', text: 'text-purple-700'},
  DELIVERED:  { label: 'Đã giao',       bg: 'bg-green-100',  text: 'text-green-700'  },
  CANCELED:   { label: 'Đã hủy',        bg: 'bg-gray-100',   text: 'text-gray-400'   },
  RETURNED:   { label: 'Trả hàng',       bg: 'bg-orange-100', text: 'text-orange-700' },
};

const RETURN_WINDOW_DAYS = 7;

export const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useContext(ShopContext);
  const [orderInfo, setOrderInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(null);
  const [reordering, setReordering] = useState(false);

  const userId = state?.user?.id;

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        setOrderInfo(res.data);
      } catch (err) {
        console.error('Lỗi khi tải chi tiết đơn hàng:', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchOrder();
  }, [id]);

  const refreshOrder = async () => {
    const res = await api.get(`/orders/${id}`);
    setOrderInfo(res.data);
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      const res = await api.patch(`/orders/${orderInfo.orderCode}/cancel`);
      setOrderInfo(res.data);
      setShowModal(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể hủy đơn hàng. Vui lòng thử lại.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturn = async () => {
    setActionLoading(true);
    try {
      const res = await api.patch(`/orders/${orderInfo.orderCode}/return`);
      setOrderInfo(res.data);
      setShowModal(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể trả đơn hàng. Vui lòng thử lại.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReorder = async () => {
    if (!userId) return;
    setReordering(true);
    try {
      // Kiểm tra tồn kho từng sản phẩm trước
      const stockData = await api.get(`/orders/${orderInfo.orderCode}/reorder-stock`);
      const stockMap = stockData.data;

      const outOfStock = [];
      const availableItems = [];

      for (const item of orderInfo.items) {
        const inStock = stockMap[item.variantId];
        if (!inStock) {
          outOfStock.push(item.productNameSnapshot);
        } else {
          availableItems.push(item);
        }
      }

      if (outOfStock.length > 0) {
        alert(`Các sản phẩm sau đã hết hàng và không thể mua lại: ${outOfStock.join(', ')}`);
        if (availableItems.length === 0) {
          setReordering(false);
          return;
        }
      }

      // Thêm các sản phẩm còn hàng vào giỏ hàng
      for (const item of availableItems) {
        dispatch({
          type: 'ADD_TO_CART',
          payload: {
            variantId: item.variantId,
            id: String(item.variantId),
            name: item.productNameSnapshot,
            sku: item.skuSnapshot || '',
            color: item.colorSnapshot || '',
            ram: item.ramSnapshot ? `${item.ramSnapshot}GB` : '',
            storage: item.storageSnapshot ? `${item.storageSnapshot}GB` : '',
            unitPrice: item.unitPrice,
            price: item.unitPrice,
            quantity: item.quantity,
            imageUrl: item.imageUrl || '',
            thumbnailUrl: item.imageUrl || '',
            images: item.imageUrl ? [item.imageUrl] : [],
            // Brand is fetched from order level - use from orderInfo if available
            brand: orderInfo.brand || 'Khác',
          },
        });
      }

      // Chuyển sang checkout
      const ids = availableItems.map(item => String(item.variantId));
      const params = new URLSearchParams({ items: JSON.stringify(ids) });
      navigate(`/checkout?${params.toString()}`);
    } catch (err) {
      console.error('Lỗi kiểm tra tồn kho:', err);
      alert('Không thể kiểm tra tồn kho. Vui lòng thử lại.');
    } finally {
      setReordering(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Đang tải chi tiết đơn hàng...</p>
        </div>
      </main>
    );
  }

  if (!orderInfo) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900">Không tìm thấy đơn hàng</h2>
          <button onClick={() => navigate('/orders')} className="mt-4 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all">
            Quay lại danh sách
          </button>
        </div>
      </main>
    );
  }

  const subtotal = orderInfo.subtotalAmount;
  const shipping = orderInfo.shippingFee;
  const discount = orderInfo.discountAmount;
  const total = orderInfo.totalAmount;
  const statusConfig = OrderStatus[orderInfo.orderStatus] || OrderStatus.PENDING;
  const orderDate = orderInfo.placedAt ? new Date(orderInfo.placedAt).toLocaleDateString('vi-VN') : '—';

  const canCancel = orderInfo.orderStatus === 'PENDING';
  const canReturn = orderInfo.orderStatus === 'DELIVERED';
  const canReorder = ['DELIVERED', 'CANCELED', 'RETURNED'].includes(orderInfo.orderStatus);

  let returnDeadline = null;
  if (canReturn && orderInfo.updatedAt) {
    const deadline = new Date(orderInfo.updatedAt);
    deadline.setDate(deadline.getDate() + RETURN_WINDOW_DAYS);
    returnDeadline = deadline.toLocaleDateString('vi-VN');
    const daysLeft = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) {
      returnDeadline = null;
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-6xl mx-auto px-4 pt-10">

        {/* Back button & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <button
              onClick={() => navigate('/orders')}
              className="group text-sm font-bold text-gray-400 hover:text-red-600 mb-2 flex items-center gap-2 transition-colors"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span> QUAY LẠI DANH SÁCH
            </button>
            <h1 className="text-3xl font-black text-gray-900 uppercase">
              Chi tiết đơn hàng <span className="text-red-600">#{orderInfo.orderCode}</span>
            </h1>
          </div>
          <div className={`px-4 py-2 rounded-full font-bold text-sm ${statusConfig.bg} ${statusConfig.text} self-start`}>
            ● {statusConfig.label}
          </div>
        </div>

        {/* Action Buttons */}
        {(canCancel || canReturn || canReorder) && (
          <div className="flex flex-wrap gap-3 mb-6">
            {canCancel && (
              <button
                onClick={() => setShowModal('cancel')}
                disabled={actionLoading}
                className="px-6 py-3 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-all border border-red-100 active:scale-95 disabled:opacity-50"
              >
                ❌ HỦY ĐƠN HÀNG
              </button>
            )}
            {canReturn && returnDeadline && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowModal('return')}
                  disabled={actionLoading}
                  className="px-6 py-3 bg-orange-50 text-orange-600 font-bold rounded-2xl hover:bg-orange-100 transition-all border border-orange-100 active:scale-95 disabled:opacity-50"
                >
                  ↩️ TRẢ HÀNG (còn {Math.ceil((new Date(returnDeadline) - new Date()) / (1000 * 60 * 60 * 24))} ngày)
                </button>
              </div>
            )}
            {canReturn && !returnDeadline && (
              <div className="flex items-center gap-3">
                <span className="px-4 py-2 bg-gray-100 text-gray-400 font-bold text-sm rounded-2xl">
                  ⏰ Đã hết thời hạn trả hàng (7 ngày)
                </span>
              </div>
            )}
            {canReorder && (
              <button
                onClick={handleReorder}
                disabled={reordering}
                className="px-6 py-3 bg-green-600 text-white font-bold rounded-2xl transition-all active:scale-95 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reordering ? 'ĐANG KIỂM TRA...' : '🔄 MUA LẠI ĐƠN HÀNG'}
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Product List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                Sản phẩm mua ({orderInfo.items?.length || 0})
              </h2>
              <div className="divide-y divide-gray-100">
                {orderInfo.items?.map((item) => (
                  <div key={item.id} className="py-5 flex gap-6 items-center">
                    <div className="w-24 h-24 bg-gray-50 rounded-2xl p-2 flex-shrink-0 border border-gray-50">
                      <img
                        src={item.imageUrl || 'https://picsum.photos/200/200'}
                        alt={item.productNameSnapshot}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-bold text-gray-900 text-lg leading-tight mb-1">
                        {item.productNameSnapshot}
                      </h4>
                      {(item.colorSnapshot || item.ramSnapshot || item.storageSnapshot) && (
                        <p className="text-xs text-gray-400 font-medium mb-1">
                          {[item.colorSnapshot, item.ramSnapshot && `${item.ramSnapshot}GB RAM`, item.storageSnapshot && `${item.storageSnapshot}GB`].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-sm text-gray-500 font-medium">Số lượng: {item.quantity}</p>
                          <p className="font-bold text-red-600 text-lg mt-1">
                            {item.unitPrice?.toLocaleString('vi-VN')}₫
                          </p>
                        </div>
                        <p className="text-sm font-bold text-gray-400">
                          Tạm tính: {(item.unitPrice * item.quantity)?.toLocaleString('vi-VN')}₫
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-3xl p-6 border border-dashed border-gray-200 text-center">
              <p className="text-gray-500 text-sm">
                Đơn hàng được đặt vào lúc {orderInfo.placedAt ? new Date(orderInfo.placedAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—'} ngày <strong>{orderDate}</strong>
              </p>
            </div>
          </div>

          {/* Right: Address & Payment */}
          <div className="space-y-6">
            {/* Shipping Address */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold mb-6 uppercase tracking-wider text-gray-400">Giao hàng đến</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-black text-gray-400 block mb-1">Người nhận</label>
                  <p className="font-bold text-gray-800">{orderInfo.receiverName}</p>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black text-gray-400 block mb-1">Số điện thoại</label>
                  <p className="font-bold text-gray-800">{orderInfo.receiverPhone}</p>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black text-gray-400 block mb-1">Địa chỉ nhận hàng</label>
                  <p className="font-bold text-gray-800 leading-relaxed">{orderInfo.shippingAddressText}</p>
                </div>
                {orderInfo.note && (
                  <div>
                    <label className="text-[10px] uppercase font-black text-gray-400 block mb-1">Ghi chú</label>
                    <p className="text-gray-600 text-sm">{orderInfo.note}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-gray-900 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

              <h2 className="text-xl font-bold mb-6 relative z-10">Tóm tắt thanh toán</h2>
              <div className="space-y-4 border-b border-gray-800 pb-6 mb-6 relative z-10">
                <div className="flex justify-between text-gray-400">
                  <span>Tạm tính</span>
                  <span className="text-white font-medium">{subtotal?.toLocaleString('vi-VN')}₫</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-gray-400">
                    <span>Giảm giá</span>
                    <span className="text-green-400 font-medium">-{discount?.toLocaleString('vi-VN')}₫</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-400">
                  <span>Phí vận chuyển</span>
                  <span className="text-white font-medium">{shipping === 0 ? 'Miễn phí' : shipping?.toLocaleString('vi-VN') + '₫'}</span>
                </div>
              </div>

              <div className="flex justify-between items-center relative z-10">
                <span className="font-bold text-gray-400 uppercase text-xs tracking-widest">Tổng cộng</span>
                <span className="text-3xl font-black text-red-500 tracking-tighter">
                  {total.toLocaleString('vi-VN')}₫
                </span>
              </div>

              <button className="w-full mt-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold text-sm transition-all">
                XUẤT HÓA ĐƠN PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showModal === 'cancel' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <div className="text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Xác nhận hủy đơn hàng</h3>
              <p className="text-gray-500 text-sm mb-8">
                Bạn có chắc chắn muốn hủy đơn hàng <strong>#{orderInfo.orderCode}</strong> không?
                <br />
                <span className="text-red-500 font-medium">Hành động này không thể hoàn tác.</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(null)}
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  KHÔNG, GIỮ ĐƠN
                </button>
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  {actionLoading ? 'ĐANG HỦY...' : 'CÓ, HỦY ĐƠN'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showModal === 'return' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <div className="text-center">
              <div className="text-5xl mb-4">↩️</div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Xác nhận trả hàng</h3>
              <p className="text-gray-500 text-sm mb-2">
                Bạn muốn yêu cầu trả đơn hàng <strong>#{orderInfo.orderCode}</strong>?
              </p>
              <p className="text-orange-500 text-xs font-medium mb-8">
                Hạn trả hàng: {returnDeadline} (còn {Math.ceil((new Date(returnDeadline) - new Date()) / (1000 * 60 * 60 * 24))} ngày)
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(null)}
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  KHÔNG
                </button>
                <button
                  onClick={handleReturn}
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-orange-500 text-white font-bold rounded-2xl hover:bg-orange-600 transition-all disabled:opacity-50"
                >
                  {actionLoading ? 'ĐANG XỬ LÝ...' : 'CÓ, TRẢ HÀNG'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
