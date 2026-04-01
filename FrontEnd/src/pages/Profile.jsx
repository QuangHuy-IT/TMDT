import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';

export const Profile = () => {
  const { state } = useContext(ShopContext);
  const { user } = state; // Lấy thông tin user từ Context thực tế

  // Thông tin hiển thị (kết hợp dữ liệu context)
  const displayUser = {
    fullName: user?.fullName || "Chưa cập nhật",
    email: user?.email || "Chưa cập nhật",
    phone: user?.phone || "Chưa cập nhật",
    yearOfBirth: user?.yearOfBirth || "Chưa cập nhật",
    avatar: user?.avatarUrl || "/assets/images/profile/avatar-default.png"
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 pt-10">
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-8 border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">
            Hồ sơ của tôi
          </h1>
          <span className="bg-red-100 text-red-600 text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
            Thành viên mới
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Cột trái: Thông tin tổng quát */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden text-center p-8 sticky top-24">
              <div className="relative inline-block mb-6">
                <div className="h-32 w-32 rounded-full border-4 border-red-500 p-1 bg-white mx-auto overflow-hidden">
                  <img
                    src={displayUser.avatar}
                    alt="Avatar"
                    className="h-full w-full rounded-full object-cover"
                  />
                </div>
                <button className="absolute bottom-1 right-1 bg-gray-900 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>

              <h4 className="text-xl font-bold text-gray-900 mb-1">{displayUser.fullName}</h4>
              <p className="text-sm text-gray-500 mb-8">{displayUser.email}</p>
              
              <div className="space-y-3">
                <button className="w-full py-3 border-2 border-red-600 text-red-600 rounded-2xl font-bold hover:bg-red-600 hover:text-white transition-all duration-300">
                  Chỉnh sửa ảnh đại diện
                </button>
                <button className="w-full py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all duration-300">
                  Đổi mật khẩu
                </button>
              </div>
            </div>
          </div>

          {/* Cột phải: Form chi tiết */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Thẻ: Thông tin cá nhân */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-red-50 p-2 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h5 className="text-xl font-bold text-gray-900">Thông tin cá nhân</h5>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Họ và tên</label>
                  <input type="text" className="w-full bg-gray-50 border-0 rounded-2xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-red-500 transition-all" value={displayUser.fullName} readOnly />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email</label>
                  <input type="email" className="w-full bg-gray-50 border-0 rounded-2xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-red-500 transition-all" value={displayUser.email} readOnly />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Năm sinh</label>
                  <input type="text" className="w-full bg-gray-50 border-0 rounded-2xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-red-500 transition-all" value={displayUser.yearOfBirth} readOnly />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                  <input type="tel" className="w-full bg-gray-50 border-0 rounded-2xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-red-500 transition-all" value={displayUser.phone} readOnly />
                </div>
              </div>
            </div>

            {/* Thẻ: Địa chỉ giao hàng */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-red-50 p-2 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h5 className="text-xl font-bold text-gray-900">Địa chỉ nhận hàng</h5>
              </div>

              <form className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Địa chỉ cụ thể</label>
                  <input type="text" className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all" placeholder="Nhập số nhà, tên đường..." />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Tỉnh / Thành phố</label>
                    <input type="text" className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all" placeholder="Ví dụ: Hà Nội" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Mã Zip</label>
                    <input type="text" className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all" placeholder="100000" />
                  </div>
                </div>

                <button className="bg-red-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 active:scale-95">
                  LƯU THÔNG TIN ĐỊA CHỈ
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};