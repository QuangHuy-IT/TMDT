import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import PaymentService from '../services/paymentService';

const fmt = (n) => n.toLocaleString('vi-VN') + '₫';

export const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderCode = searchParams.get('orderCode');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderCode) {
      setError('Không tìm thấy mã đơn hàng');
      setLoading(false);
      return;
    }

    let attempts = 0;
    const maxAttempts = 10;

    const checkOrder = async () => {
      try {
        const res = await PaymentService.getOrderByCodePublic(orderCode);
        setOrder(res.data);
        setLoading(false);
        return;
      } catch (err) {
        attempts++;
        if (attempts >= maxAttempts) {
          setError('Không tìm thấy đơn hàng. Vui lòng kiểm tra lại sau vài phút.');
          setLoading(false);
        }
      }
    };

    checkOrder();
    const interval = setInterval(() => {
      if (loading) checkOrder();
    }, 2000);
    return () => clearInterval(interval);
  }, [orderCode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">{error}</h2>
          <Link to="/" className="inline-block mt-4 px-6 py-3 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all">
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = order?.paymentStatus === 'PAID';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] shadow-2xl p-8 max-w-lg w-full text-center">
        <div className={`w-20 h-20 ${isPaid ? 'bg-green-100' : 'bg-yellow-100'} rounded-full flex items-center justify-center mx-auto mb-6`}>
          <span className="text-4xl">{isPaid ? '✅' : '⏳'}</span>
        </div>

        <h1 className={`text-2xl font-black mb-2 ${isPaid ? 'text-green-600' : 'text-yellow-600'}`}>
          {isPaid ? 'Thanh toán thành công!' : 'Đơn hàng đang chờ thanh toán'}
        </h1>

        <p className="text-gray-500 mb-6">
          {isPaid
            ? 'Cảm ơn bạn đã đặt hàng! Đơn hàng của bạn đã được thanh toán thành công.'
            : 'Đơn hàng của bạn đã được tạo. Vui lòng hoàn tất thanh toán để chúng tôi xử lý đơn hàng.'}
        </p>

        <div className="bg-gray-50 rounded-2xl p-5 mb-6 text-left">
          <div className="flex justify-between mb-3 pb-3 border-b border-gray-200">
            <span className="text-gray-500 text-sm">Mã đơn hàng</span>
            <span className="font-bold text-gray-800">{order.orderCode}</span>
          </div>
          <div className="flex justify-between mb-3 pb-3 border-b border-gray-200">
            <span className="text-gray-500 text-sm">Phương thức</span>
            <span className="font-bold text-gray-800">
              {order.paymentMethod === 'PAYTOS' ? 'PayOS (QR Code)' :
               order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : order.paymentMethod}
            </span>
          </div>
          <div className="flex justify-between mb-3 pb-3 border-b border-gray-200">
            <span className="text-gray-500 text-sm">Trạng thái thanh toán</span>
            <span className={`font-bold ${isPaid ? 'text-green-600' : 'text-yellow-600'}`}>
              {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
            </span>
          </div>
          <div className="flex justify-between mb-3 pb-3 border-b border-gray-200">
            <span className="text-gray-500 text-sm">Trạng thái đơn hàng</span>
            <span className="font-bold text-gray-800">{order.orderStatus}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Tổng tiền</span>
            <span className="text-xl font-black text-red-600">{fmt(Number(order.totalAmount))}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/orders"
            className="py-3 border-2 border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 transition-all"
          >
            Xem đơn hàng
          </Link>
          <Link
            to="/"
            className="py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all"
          >
            Tiếp tục mua sắm
          </Link>
        </div>

        {!isPaid && order.paymentMethod === 'PAYTOS' && (
          <p className="text-xs text-gray-400 mt-4">
            Nếu đã thanh toán, vui lòng chờ vài giây để hệ thống cập nhật.
          </p>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
