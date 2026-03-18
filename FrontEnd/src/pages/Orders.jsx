import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';

export const Orders = () => {
  const navigate = useNavigate();
  // Giả sử bạn sẽ lấy userId hoặc danh sách orders thật từ context sau này
  const { state } = useContext(ShopContext);
  
  // Dữ liệu mẫu (Sau này sẽ fetch từ API dựa trên user đã login)
  const orders = [
    { id: 'HD9421', date: '12/03/2026', total: 25900000, status: 'Đang giao', items: 2 },
    { id: 'HD8810', date: '01/03/2026', total: 1500000, status: 'Đã giao', items: 1 },
    { id: 'HD7702', date: '20/02/2026', total: 5490000, status: 'Đã hủy', items: 1 },
  ];

  if (orders.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-2xl font-bold text-gray-900">Bạn chưa có đơn hàng nào</h2>
          <p className="text-gray-500 mt-2 mb-6">Hãy khám phá thêm các sản phẩm tuyệt vời nhé!</p>
          <button 
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-200"
          >
            MUA SẮM NGAY
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-4xl mx-auto px-4 pt-10">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">
            Lịch sử <span className="text-red-600">Đơn hàng</span>
          </h1>
          <div className="text-sm font-bold text-gray-400 bg-white px-4 py-2 rounded-full border border-gray-100">
            {orders.length} ĐƠN HÀNG
          </div>
        </div>

        <div className="space-y-4">
          {orders.map((order) => (
            <div 
              key={order.id} 
              className="group bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 hover:shadow-xl hover:border-red-100 transition-all duration-300"
            >
              <div className="flex items-center gap-6 w-full md:w-auto">
                <div className="bg-gray-50 p-5 rounded-2xl text-red-600 font-black text-sm group-hover:bg-red-600 group-hover:text-white transition-colors duration-300">
                  #{order.id}
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Ngày đặt hàng</p>
                  <p className="text-sm font-bold text-gray-800">{order.date}</p>
                  <p className="text-xs text-gray-500 mt-1">{order.items} sản phẩm trong đơn</p>
                </div>
              </div>

              <div className="flex items-center justify-between w-full md:w-auto md:gap-12 border-t md:border-none pt-4 md:pt-0">
                <div className="text-left md:text-right">
                  <p className="text-xl font-black text-gray-900 tracking-tight">
                    {order.total.toLocaleString('vi-VN')}₫
                  </p>
                  <span className={`inline-block text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-tighter mt-1 ${
                    order.status === 'Đã giao' ? 'bg-green-100 text-green-600' : 
                    order.status === 'Đã hủy' ? 'bg-gray-100 text-gray-400' : 
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {order.status}
                  </span>
                </div>
                
                <button 
                  onClick={() => navigate(`/order/${order.id}`)}
                  className="px-8 py-3 bg-gray-900 text-white text-xs font-black rounded-2xl hover:bg-red-600 hover:shadow-lg hover:shadow-red-200 transition-all active:scale-95"
                >
                  CHI TIẾT
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Thông báo hỗ trợ */}
        <div className="mt-12 p-6 bg-red-50 rounded-3xl border border-red-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-xl shadow-sm">🎧</div>
          <div>
            <h4 className="font-bold text-red-900 text-sm">Cần hỗ trợ về đơn hàng?</h4>
            <p className="text-red-700/70 text-xs font-medium">Liên hệ tổng đài 1900xxxx để được giải đáp thắc mắc 24/7.</p>
          </div>
        </div>
      </div>
    </main>
  );
};