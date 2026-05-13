import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import PaymentService from '../services/paymentService';
import { QRCodeSVG } from 'qrcode.react';

const fmt = (n) => n.toLocaleString('vi-VN') + '₫';

export const Checkout = () => {
  const { state, dispatch } = useContext(ShopContext);
  const { cart, user } = state;
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [shippingInfo, setShippingInfo] = useState({
    receiverName: user?.fullName || '',
    receiverPhone: user?.phone || '',
    shippingAddressText: '',
    note: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [showQR, setShowQR] = useState(false);
  const [error, setError] = useState('');

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = 30000;
  const total = subtotal + shippingFee;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handlePlaceOrder = async (e) => {
    e?.preventDefault();
    setError('');

    if (!shippingInfo.receiverName || !shippingInfo.receiverPhone || !shippingInfo.shippingAddressText) {
      setError('Vui lòng điền đầy đủ thông tin giao hàng');
      return;
    }

    if (paymentMethod === 'payos') {
      await handlePayOSPayment();
    } else {
      handleCODPayment();
    }
  };

  const handlePayOSPayment = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setError('');

    const orderData = {
      userId: user?.id,
      receiverName: shippingInfo.receiverName,
      receiverPhone: shippingInfo.receiverPhone,
      shippingAddressText: shippingInfo.shippingAddressText,
      note: shippingInfo.note,
      subtotalAmount: subtotal,
      discountAmount: 0,
      shippingFee: shippingFee,
      totalAmount: total,
      paymentMethod: 'PAYOS',
      items: cart.map((item) => ({
        variantId: item.variantId || Number(item.id) || null,
        productName: item.name,
        sku: item.sku || '',
        color: item.color || '',
        ram: item.ram || '',
        storage: item.storage || '',
        unitPrice: item.price,
        quantity: item.quantity,
        imageUrl: item.images?.[0] || '',
      })),
    };

    try {
      const response = await PaymentService.placeOrderAndPay(orderData);
      const payment = response.data;

      if (payment.qrCode) {
        setPaymentData({ payment });
        setShowQR(true);
      } else if (payment.checkoutUrl) {
        window.location.href = payment.checkoutUrl;
      }
    } catch (err) {
      console.error('PayOS payment error:', err);
      setError(err.response?.data?.message || 'Không thể tạo thanh toán PayOS. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCODPayment = () => {
    const orderData = {
      userId: user?.id,
      receiverName: shippingInfo.receiverName,
      receiverPhone: shippingInfo.receiverPhone,
      shippingAddressText: shippingInfo.shippingAddressText,
      note: shippingInfo.note,
      subtotalAmount: subtotal,
      discountAmount: 0,
      shippingFee: shippingFee,
      totalAmount: total,
      paymentMethod: 'COD',
      items: cart.map((item) => ({
        variantId: item.variantId || Number(item.id) || null,
        productName: item.name,
        sku: item.sku || '',
        color: item.color || '',
        ram: item.ram || '',
        storage: item.storage || '',
        unitPrice: item.price,
        quantity: item.quantity,
        imageUrl: item.images?.[0] || '',
      })),
    };

    PaymentService.placeOrderAndPay(orderData)
      .then((res) => {
        dispatch({ type: 'CLEAR_CART' });
        const orderCode = res.data.order.orderCode;
        navigate(`/payment/success?orderCode=${orderCode}`);
      })
      .catch((err) => {
        console.error('COD order error:', err);
        setError(err.response?.data?.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.');
      });
  };

  const handleCancelQR = () => {
    if (paymentData?.payment?.orderCode) {
      window.location.href = `/payment/cancel?orderCode=${paymentData.payment.orderCode}`;
    } else {
      setShowQR(false);
      setPaymentData(null);
    }
  };

  if (showQR && paymentData) {
    return <QRPaymentView paymentData={paymentData} onCancel={handleCancelQR} navigate={navigate} dispatch={dispatch} />;
  }

  return (
    <main className="bg-gray-50 min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 pt-10">
        <h1 className="text-3xl font-black text-gray-900 mb-10 uppercase tracking-tighter">Thanh toán</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          <div className="lg:col-span-7 space-y-8">
            <section className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                Thông tin nhận hàng
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Họ tên</label>
                  <input
                    type="text" name="receiverName"
                    value={shippingInfo.receiverName}
                    onChange={handleInputChange} required
                    className="w-full bg-gray-50 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-red-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Số điện thoại</label>
                  <input
                    type="tel" name="receiverPhone"
                    value={shippingInfo.receiverPhone}
                    onChange={handleInputChange} required
                    className="w-full bg-gray-50 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-red-500 transition-all"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Địa chỉ nhận hàng</label>
                  <input
                    type="text" name="shippingAddressText"
                    value={shippingInfo.shippingAddressText}
                    onChange={handleInputChange} required
                    className="w-full bg-gray-50 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-red-500 transition-all"
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Ghi chú (tùy chọn)</label>
                  <input
                    type="text" name="note"
                    value={shippingInfo.note}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-red-500 transition-all"
                    placeholder="Ghi chú cho đơn hàng..."
                  />
                </div>
              </div>
            </section>

            <section className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                Phương thức thanh toán
              </h2>
              <div className="space-y-3">
                <label
                  className={`flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-red-500 bg-red-50' : 'border-gray-100 hover:border-gray-200'}`}
                  onClick={() => setPaymentMethod('cod')}
                >
                  <div className="flex items-center gap-3">
                    <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="accent-red-600 w-4 h-4" />
                    <span className="font-bold text-gray-700">Thanh toán khi nhận hàng (COD)</span>
                  </div>
                  <span className="text-2xl">💵</span>
                </label>
                <label
                  className={`flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer transition-all ${paymentMethod === 'payos' ? 'border-red-500 bg-red-50' : 'border-gray-100 hover:border-gray-200'}`}
                  onClick={() => setPaymentMethod('payos')}
                >
                  <div className="flex items-center gap-3">
                    <input type="radio" name="payment" value="payos" checked={paymentMethod === 'payos'} onChange={() => setPaymentMethod('payos')} className="accent-red-600 w-4 h-4" />
                    <span className="font-bold text-gray-700">Thanh toán qua PayOS (QR Code / Chuyển khoản)</span>
                  </div>
                  <span className="text-2xl">📱</span>
                </label>
              </div>
            </section>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-gray-900 text-white p-8 rounded-[40px] shadow-2xl sticky top-24">
              <h2 className="text-xl font-bold mb-8 border-b border-gray-800 pb-4">Đơn hàng của bạn</h2>

              <div className="max-h-60 overflow-y-auto mb-8 pr-2 space-y-4">
                {cart.map(item => (
                  <div key={item.id || item._id} className="flex justify-between items-center gap-4 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <img
                          src={item.images?.[0]}
                          alt=""
                          className="w-full h-full object-contain bg-white rounded-lg p-1"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <span className="absolute -top-1 -right-1 bg-red-600 text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold text-white">
                          {item.quantity}
                        </span>
                      </div>
                      <span className="font-medium line-clamp-1">{item.name}</span>
                    </div>
                    <span className="font-bold whitespace-nowrap">{(item.price * item.quantity).toLocaleString()}đ</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4 text-sm opacity-70 border-t border-gray-800 pt-6">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span>{subtotal.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí vận chuyển</span>
                  <span>{shippingFee.toLocaleString()}đ</span>
                </div>
              </div>

              <div className="flex justify-between items-center mt-8 mb-10">
                <span className="text-lg font-bold">Tổng thanh toán</span>
                <span className="text-3xl font-black text-red-500">{fmt(total)}</span>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-red-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Đang xử lý...
                  </>
                ) : paymentMethod === 'payos' ? (
                  'THANH TOÁN QUA PAYOS'
                ) : (
                  'ĐẶT HÀNG NGAY'
                )}
              </button>
              <p className="text-[10px] text-center mt-4 opacity-40 uppercase tracking-widest">
                Bằng cách đặt hàng, bạn đồng ý với điều khoản của cửa hàng
              </p>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
};

const QRPaymentView = ({ paymentData, onCancel, navigate, dispatch }) => {
  const { payment } = paymentData;
  const [checkCount, setCheckCount] = useState(0);
  const [paid, setPaid] = useState(false);

  const checkPaymentStatus = async () => {
    try {
      const res = await PaymentService.getOrderByCode(payment.orderCode);
      if (res.data.paymentStatus === 'PAID') {
        setPaid(true);
        setTimeout(() => {
          dispatch({ type: 'CLEAR_CART' });
          navigate(`/payment/success?orderCode=${payment.orderCode}`);
        }, 2000);
      }
    } catch (err) {
      // Order not found yet (webhook hasn't processed) - expected
    }
    setCheckCount((c) => c + 1);
  };

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (!paid) checkPaymentStatus();
    }, 3000);
    return () => clearInterval(interval);
  }, [paid, checkCount]);

  const handleCancel = () => {
    onCancel();
  };

  return (
    <main className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] shadow-2xl p-8 max-w-md w-full text-center">
        {!paid ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📱</span>
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Quét mã QR để thanh toán</h2>
            <p className="text-gray-500 text-sm mb-6">
              Mã đơn: <span className="font-bold text-gray-700">{payment.orderCode}</span>
            </p>

            {(payment.qrCode && payment.qrCode.length > 10) ? (
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
                onClick={handleCancel}
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
            <h2 className="text-2xl font-black text-green-600 mb-2">Thanh toán thành công!</h2>
            <p className="text-gray-500">Đang chuyển hướng...</p>
          </div>
        )}
      </div>
    </main>
  );
};

export default Checkout;
