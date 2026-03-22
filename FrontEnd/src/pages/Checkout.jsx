import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';

export const Checkout = () => {
  const { state, dispatch } = useContext(ShopContext);
  const { cart, user } = state;
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState('cod');

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = 30000;
  const total = subtotal + shippingFee;

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    // Sửa: Dùng PLACE_ORDER thay vì CLEAR_CART để đơn hàng được lưu vào context/localStorage
    dispatch({ type: 'PLACE_ORDER', payload: { total } });
    alert('Chúc mừng! Đơn hàng của bạn đã được đặt thành công.');
    navigate('/orders');
  };

  return (
    <main className="bg-gray-50 min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 pt-10">
        <h1 className="text-3xl font-black text-gray-900 mb-10 uppercase tracking-tighter">Thanh toán</h1>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* CỘT TRÁI: THÔNG TIN GIAO HÀNG */}
          <div className="lg:col-span-7 space-y-8">
            <section className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                Thông tin nhận hàng
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Họ tên</label>
                  <input type="text" defaultValue={user?.name} required className="w-full bg-gray-50 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-red-500 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Số điện thoại</label>
                  <input type="tel" required className="w-full bg-gray-50 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-red-500 transition-all" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Địa chỉ nhận hàng</label>
                  <input type="text" required className="w-full bg-gray-50 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-red-500 transition-all" placeholder="Số nhà, tên đường, phường/xã..." />
                </div>
              </div>
            </section>

            <section className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                Phương thức thanh toán
              </h2>
              <div className="space-y-3">
                <label className={`flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-red-500 bg-red-50' : 'border-gray-100'}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="payment" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="accent-red-600 w-4 h-4" />
                    <span className="font-bold text-gray-700">Thanh toán khi nhận hàng (COD)</span>
                  </div>
                  <span className="text-2xl">💵</span>
                </label>
                <label className={`flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer transition-all ${paymentMethod === 'bank' ? 'border-red-500 bg-red-50' : 'border-gray-100'}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="payment" checked={paymentMethod === 'bank'} onChange={() => setPaymentMethod('bank')} className="accent-red-600 w-4 h-4" />
                    <span className="font-bold text-gray-700">Chuyển khoản ngân hàng</span>
                  </div>
                  <span className="text-2xl">🏦</span>
                </label>
              </div>
            </section>
          </div>

          {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG */}
          <div className="lg:col-span-5">
            <div className="bg-gray-900 text-white p-8 rounded-[40px] shadow-2xl sticky top-24">
              <h2 className="text-xl font-bold mb-8 border-b border-gray-800 pb-4">Đơn hàng của bạn</h2>

              <div className="max-h-60 overflow-y-auto mb-8 pr-2 space-y-4 custom-scrollbar">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center gap-4 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img src={item.image} alt="" className="w-12 h-12 object-contain bg-white rounded-lg p-1" />
                        <span className="absolute -top-2 -right-2 bg-red-600 text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">{item.quantity}</span>
                      </div>
                      <span className="font-medium line-clamp-1">{item.name}</span>
                    </div>
                    <span className="font-bold">{(item.price * item.quantity).toLocaleString()}đ</span>
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
                <span className="text-3xl font-black text-red-500">{total.toLocaleString()}đ</span>
              </div>

              <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-red-900/20 transition-all active:scale-95">
                ĐẶT HÀNG NGAY
              </button>
              <p className="text-[10px] text-center mt-4 opacity-40 uppercase tracking-widest">
                Bằng cách đặt hàng, bạn đồng ý với điều khoản của HHShop
              </p>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
};