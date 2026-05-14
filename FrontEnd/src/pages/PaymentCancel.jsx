import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import PaymentService from '../services/paymentService';

export const PaymentCancel = () => {
  const [searchParams] = useSearchParams();
  const orderCode = searchParams.get('orderCode');
  const payosOrderCode = searchParams.get('payosOrderCode');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cancelPayment = async () => {
      console.log('PaymentCancel mounted, payosOrderCode:', payosOrderCode, 'orderCode:', orderCode);
      if (payosOrderCode) {
        try {
          await PaymentService.cancelPayOSPayment(payosOrderCode);
        } catch (err) {
          console.error('Error cancelling PayOS payment:', err);
        }
      } else if (orderCode) {
        // Fallback: extract payosOrderCode from orderCode (e.g. ORD1778670506465 -> 1778670506465)
        const extractedCode = orderCode.replace('ORD', '');
        console.log('payosOrderCode missing in URL, extracted from orderCode:', extractedCode);
        try {
          await PaymentService.cancelPayOSPayment(extractedCode);
        } catch (err) {
          console.error('Error cancelling PayOS payment:', err);
        }
      }
      setLoading(false);
    };

    cancelPayment();
  }, [payosOrderCode, orderCode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Đang xử lý...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] shadow-2xl p-8 max-w-lg w-full text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">❌</span>
        </div>

        <h1 className="text-2xl font-black text-red-600 mb-2">Thanh toán bị hủy</h1>
        <p className="text-gray-500 mb-6">
          Thanh toán đã bị hủy. Không có đơn hàng nào được tạo.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/"
            className="py-3 border-2 border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 transition-all"
          >
            Về trang chủ
          </Link>
          <Link
            to="/cart"
            className="py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all"
          >
            Quay lại giỏ hàng
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;
