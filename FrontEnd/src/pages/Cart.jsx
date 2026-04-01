import React, { useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';

export const Cart = () => {
  const { state, dispatch } = useContext(ShopContext);
  const { cart, isAuthenticated } = state;
  const navigate = useNavigate();
  const location = useLocation();

  // KIỂM TRA ĐĂNG NHẬP: Nếu chưa đăng nhập, đá về trang Login
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location }, replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = subtotal > 0 ? 30000 : 0;
  const total = subtotal + shippingFee;

  const handleUpdateQuantity = (id, quantity) => {
    if (quantity < 1) return;
    dispatch({ type: 'UPDATE_CART_QUANTITY', payload: { id, quantity } });
  };

  const handleRemoveItem = (id) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: id });
  };

  const handleClearCart = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?')) {
      dispatch({ type: 'CLEAR_CART' });
    }
  };

  if (!isAuthenticated) return null;

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="mb-6 flex justify-center">
          <div className="bg-gray-100 p-8 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">Giỏ hàng đang trống</h2>
        <p className="text-gray-500 mb-8">Có vẻ như bạn chưa thêm sản phẩm nào vào giỏ hàng.</p>
        <Link to="/" className="inline-block bg-red-600 text-white px-10 py-3 rounded-full font-bold hover:bg-red-700 transition-all shadow-lg hover:shadow-red-200">
          MUA SẮM NGAY
        </Link>
      </div>
    );
  }

  return (
    <main className="bg-gray-50 min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 pt-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4 border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">GIỎ HÀNG CỦA BẠN</h1>
            <p className="text-gray-500 text-sm">Bạn đang có {cart.length} sản phẩm trong giỏ</p>
          </div>
          <button onClick={handleClearCart} className="text-red-500 text-sm font-bold hover:underline">
            Xóa tất cả
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Danh sách sản phẩm */}
          <div className="lg:col-span-8 space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-4 flex gap-4 shadow-sm border border-gray-100 group">
                <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={item.images[0]} alt={item.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform" />
                </div>

                <div className="flex-grow flex flex-col justify-between py-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link to={`/product/${item._id}`}>   {/* ← dùng _id gốc */}
                        {item.name}
                      </Link>
                      {/* Sửa: item.category → item.brand (data không có field category) */}
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.brand}</span>
                    </div>
                    <button onClick={() => handleRemoveItem(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center border border-gray-200 rounded-full px-2">
                      <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} className="p-2 text-gray-400 hover:text-red-600">-</button>
                      <span className="w-8 text-center font-bold text-sm text-gray-800">{item.quantity}</span>
                      <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} className="p-2 text-gray-400 hover:text-red-600">+</button>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-red-600">{(item.price * item.quantity).toLocaleString()}đ</p>
                      <p className="text-[10px] text-gray-400">{item.price.toLocaleString()}đ / cái</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tổng kết đơn hàng */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Chi tiết đơn hàng</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-500">
                  <span>Tạm tính:</span>
                  <span className="font-bold text-gray-900">{subtotal.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Phí vận chuyển:</span>
                  <span className="font-bold text-gray-900">{shippingFee.toLocaleString()}đ</span>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-200 pt-6 mb-8">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Tổng cộng:</span>
                  <span className="text-2xl font-black text-red-600">{total.toLocaleString()}đ</span>
                </div>
              </div>

              <button onClick={() => navigate('/checkout')} className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 mb-4 active:scale-95">
                TIẾN HÀNH THANH TOÁN
              </button>
              <button onClick={() => navigate('/')} className="w-full bg-gray-50 text-gray-600 py-3 rounded-2xl font-bold hover:bg-gray-100 transition-all">
                Tiếp tục mua sắm
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};