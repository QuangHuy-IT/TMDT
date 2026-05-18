import React, { useState, useEffect, useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import PaymentService from '../../services/paymentService';

const fmt = (n) => n.toLocaleString('vi-VN') + '₫';

export const QRPaymentView = ({ paymentData, onCancel, onSuccess, navigate }) => {
  const { payment } = paymentData;
  const [paid, setPaid] = useState(false);
  const intervalRef = useRef(null);

  const checkPaymentStatus = useCallback(async () => {
    try {
      const res = await PaymentService.getOrderByCode(payment.orderCode);
      if (res.data.paymentStatus === 'PAID') {
        setPaid(true);
        clearInterval(intervalRef.current);
        onSuccess();
        setTimeout(() => {
          navigate(`/payment/success?orderCode=${payment.orderCode}`);
        }, 2000);
        return true;
      }
    } catch {
      // Order not found yet (webhook hasn't processed) - expected
    }
    return false;
  }, [payment.orderCode, navigate, onSuccess]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (!paid) checkPaymentStatus();
    }, 3000);
    return () => clearInterval(intervalRef.current);
  }, [paid, checkPaymentStatus]);

  return (
    <main className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] shadow-2xl p-8 max-w-md w-full text-center">
        {!paid ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📱</span>
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">
              Quét mã QR để thanh toán
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Mã đơn: <span className="font-bold text-gray-700">{payment.orderCode}</span>
            </p>

            {payment.qrCode && payment.qrCode.length > 10 ? (
              <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                <div className="w-64 h-64 mx-auto bg-white rounded-xl p-2 flex items-center justify-center">
                  <QRCodeSVG
                    value={payment.qrCode}
                    size={224}
                    level="M"
                    includeMargin={false}
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Quét mã QR bằng ứng dụng ngân hàng hoặc ví điện tử
                </p>
              </div>
            ) : payment.checkoutUrl ? (
              <div className="mb-6">
                <a
                  href={payment.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block w-full bg-red-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-red-700 transition-all"
                >
                  Mở trang thanh toán PayOS
                </a>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 text-center text-sm text-red-600">
                Không nhận được thông tin thanh toán từ PayOS. Vui lòng thử lại.
              </div>
            )}

            <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-left">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Tài khoản nhận:</span>
                <span className="font-bold">{payment.accountName}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Số tài khoản:</span>
                <span className="font-mono font-bold">{payment.accountNumber}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Ngân hàng:</span>
                <span className="font-bold">{payment.bin}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Số tiền:</span>
                <span className="font-black text-red-600 text-lg">{fmt(payment.amount)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-3 border-2 border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={checkPaymentStatus}
                className="flex-1 py-3 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-all"
              >
                Đã thanh toán
              </button>
            </div>

            <p className="text-xs text-gray-400 mt-4">
              Trang sẽ tự động kiểm tra mỗi 3 giây. Vui lòng không đóng trình duyệt.
            </p>
          </>
        ) : (
          <div className="py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <span className="text-4xl">✅</span>
            </div>
            <h2 className="text-2xl font-black text-green-600 mb-2">
              Thanh toán thành công!
            </h2>
            <p className="text-gray-500">Đang chuyển hướng...</p>
          </div>
        )}
      </div>
    </main>
  );
};
