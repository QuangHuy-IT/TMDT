import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthService from '../services/authService';

export const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Kiểm tra mật khẩu khớp nhau
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }

    setLoading(true);

    try {
      // Gọi API đăng ký từ backend
      const response = await AuthService.register({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      if (response.data) {
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: ''
        });
        setSuccess('Bạn đã đăng ký thành công! Vui lòng đăng nhập để tiếp tục.');
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
      
      // Xử lý lỗi từ backend
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 409) {
        setError('Email hoặc số điện thoại đã tồn tại!');
      } else if (err.response?.status === 400) {
        setError('Vui lòng kiểm tra lại thông tin đăng ký!');
      } else {
        setError('Lỗi đăng ký. Vui lòng thử lại!');
      }
      console.error('Register error:', err);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-gray-100 animate-fade-in">
        
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">
            Tạo Tài Khoản
          </h2>
          <div className="h-1.5 w-12 bg-red-600 mx-auto mt-2 rounded-full"></div>
          <p className="mt-4 text-sm text-gray-500">
            Trở thành thành viên của <span className="font-bold text-red-600">HHShop</span> ngay hôm nay
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-100 font-bold">
            ⚠ {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 text-green-700 text-xs p-3 rounded-xl border border-green-100 font-bold">
            ✓ {success}
          </div>
        )}

        {/* Form */}
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Họ tên */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">
                Họ và Tên
              </label>
              <input
                name="fullName"
                type="text"
                required
                className="block w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all sm:text-sm"
                placeholder="Nguyễn Văn A"
                value={formData.fullName}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                className="block w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all sm:text-sm"
                placeholder="example@gmail.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            {/* Số điện thoại */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">
                Số Điện Thoại
              </label>
              <input
                name="phone"
                type="tel"
                required
                className="block w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all sm:text-sm"
                placeholder="0901234567"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            {/* Mật khẩu */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">
                  Mật khẩu
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  className="block w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all sm:text-sm"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">
                  Xác nhận
                </label>
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  className="block w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all sm:text-sm"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded cursor-pointer"
              />
            </div>
            <label htmlFor="terms" className="ml-2 block text-xs text-gray-500 leading-relaxed">
              Tôi đồng ý với <span className="text-red-600 font-bold hover:underline cursor-pointer">Điều khoản dịch vụ</span> và <span className="text-red-600 font-bold hover:underline cursor-pointer">Chính sách bảo mật</span> của HHShop.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black rounded-2xl text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all shadow-lg shadow-red-100 disabled:opacity-70 active:scale-95"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              "TẠO TÀI KHOẢN NGAY"
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-bold text-red-600 hover:text-red-700 transition-colors">
              Đăng nhập tại đây
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
};