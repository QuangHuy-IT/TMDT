import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthService from '../../services/authService';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await AuthService.forgotPassword(email);
      setMessage(response.data?.message || 'Nếu email tồn tại, chúng tôi đã gửi liên kết đặt lại mật khẩu.');
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gửi yêu cầu quên mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="relative max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
        <Link
          to="/login"
          className="absolute top-5 right-5 text-gray-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-full"
          title="Quay lại đăng nhập"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        <div className="text-center">
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Quên mật khẩu</h2>
          <div className="h-1.5 w-12 bg-red-600 mx-auto mt-2 rounded-full" />
          <p className="mt-4 text-sm text-gray-500">Nhập email để nhận link đặt lại mật khẩu</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-100 font-bold">⚠ {error}</div>}
        {message && <div className="bg-emerald-50 text-emerald-700 text-xs p-3 rounded-xl border border-emerald-100 font-bold">✓ {message}</div>}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Email</label>
            <input
              type="email"
              required
              className="block w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all sm:text-sm"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black rounded-2xl text-white bg-red-600 hover:bg-red-700 focus:outline-none transition-all shadow-lg shadow-red-100 disabled:opacity-70 active:scale-95"
          >
            {loading ? 'ĐANG GỬI...' : 'GỬI LINK ĐẶT LẠI'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Đã nhớ mật khẩu?{' '}
            <Link to="/login" className="font-bold text-red-600 hover:text-red-700 transition-colors">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </main>
  );
};

export default ForgotPassword;