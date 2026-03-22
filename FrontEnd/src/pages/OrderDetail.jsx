import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { products } from '../data/products'; // Kết nối với dữ liệu gốc

export const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Giả lập tìm kiếm thông tin đơn hàng dựa trên ID
  // Trong thực tế, bạn sẽ fetch từ API tại đây
  const orderInfo = {
    id: id || 'ORD-9999',
    status: 'Đang giao',
    statusColor: 'bg-blue-100 text-blue-600',
    date: '12/03/2026',
    address: 'Số 123, Đường Cầu Giấy, Quận Cầu Giấy, Hà Nội',
    customer: 'Nguyễn Văn Hoàng',
    phone: '0987 654 321',
    items: [
      { 
        ...products[0], // Lấy iPhone 15 Pro Max từ data gốc
        quantity: 1 
      },
      { 
        id: 99, 
        name: 'Ốp lưng MagSafe Silicone', 
        price: 1290000, 
        quantity: 1, 
        image: 'https://picsum.photos/seed/case/200/200' 
      }
    ],
    shipping: 30000,
  };

  // Tính toán tổng tiền dựa trên các items
  const subtotal = orderInfo.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal + orderInfo.shipping;

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-6xl mx-auto px-4 pt-10">
        
        {/* Nút quay lại & Tiêu đề */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <button 
              onClick={() => navigate('/orders')} 
              className="group text-sm font-bold text-gray-400 hover:text-red-600 mb-2 flex items-center gap-2 transition-colors"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span> QUAY LẠI DANH SÁCH
            </button>
            <h1 className="text-3xl font-black text-gray-900 uppercase">
              Chi tiết đơn hàng <span className="text-red-600">#{orderInfo.id}</span>
            </h1>
          </div>
          <div className={`px-4 py-2 rounded-full font-bold text-sm ${orderInfo.statusColor} self-start`}>
            ● {orderInfo.status}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cột trái: Danh sách sản phẩm */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                Sản phẩm mua ({orderInfo.items.length})
              </h2>
              <div className="divide-y divide-gray-100">
                {orderInfo.items.map((item) => (
                  <div key={item.id} className="py-5 flex gap-6 items-center">
                    <div className="w-24 h-24 bg-gray-50 rounded-2xl p-2 flex-shrink-0 border border-gray-50">
                      <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-bold text-gray-900 text-lg leading-tight mb-1">{item.name}</h4>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-sm text-gray-500 font-medium">Số lượng: {item.quantity}</p>
                          <p className="font-bold text-red-600 text-lg mt-1">
                            {item.price.toLocaleString('vi-VN')}₫
                          </p>
                        </div>
                        <p className="text-sm font-bold text-gray-400">
                          Tạm tính: {(item.price * item.quantity).toLocaleString('vi-VN')}₫
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Thông tin thời gian đơn hàng */}
            <div className="bg-white rounded-3xl p-6 border border-dashed border-gray-200 text-center">
              <p className="text-gray-500 text-sm">
                Đơn hàng được đặt vào lúc 14:30 ngày <strong>{orderInfo.date}</strong>
              </p>
            </div>
          </div>

          {/* Cột phải: Thông tin nhận hàng & Thanh toán */}
          <div className="space-y-6">
            {/* Địa chỉ */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold mb-6 uppercase tracking-wider text-gray-400">Giao hàng đến</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-black text-gray-400 block mb-1">Người nhận</label>
                  <p className="font-bold text-gray-800">{orderInfo.customer}</p>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black text-gray-400 block mb-1">Số điện thoại</label>
                  <p className="font-bold text-gray-800">{orderInfo.phone}</p>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black text-gray-400 block mb-1">Địa chỉ nhận hàng</label>
                  <p className="font-bold text-gray-800 leading-relaxed">{orderInfo.address}</p>
                </div>
              </div>
            </div>

            {/* Tổng kết tiền */}
            <div className="bg-gray-900 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
              {/* Trang trí background nhẹ */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              
              <h2 className="text-xl font-bold mb-6 relative z-10">Tóm tắt thanh toán</h2>
              <div className="space-y-4 border-b border-gray-800 pb-6 mb-6 relative z-10">
                <div className="flex justify-between text-gray-400">
                  <span>Tạm tính</span>
                  <span className="text-white font-medium">{subtotal.toLocaleString('vi-VN')}₫</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Phí vận chuyển</span>
                  <span className="text-white font-medium">{orderInfo.shipping === 0 ? 'Miễn phí' : orderInfo.shipping.toLocaleString('vi-VN') + '₫'}</span>
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
    </main>
  );
};