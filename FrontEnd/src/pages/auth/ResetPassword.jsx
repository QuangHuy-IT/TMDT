import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import AuthService from '../../services/authService';

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('Thiếu token đặt lại mật khẩu.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    try {
      const response = await AuthService.resetPassword(token, newPassword, confirmPassword);
      setMessage(response.data?.message || 'Đặt lại mật khẩu thành công.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể đặt lại mật khẩu.');
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
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Đặt lại mật khẩu</h2>
          <div className="h-1.5 w-12 bg-red-600 mx-auto mt-2 rounded-full" />
          <p className="mt-4 text-sm text-gray-500">Tạo mật khẩu mới cho tài khoản của bạn</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-100 font-bold">⚠ {error}</div>}
        {message && <div className="bg-emerald-50 text-emerald-700 text-xs p-3 rounded-xl border border-emerald-100 font-bold">✓ {message}</div>}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="relative">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Mật khẩu mới</label>
            <input
              type={showNewPassword ? 'text' : 'password'}
              required
              className="block w-full px-4 py-3 pr-12 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all sm:text-sm"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((current) => !current)}
              className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600 transition-colors p-1"
              tabIndex={-1}
              aria-label={showNewPassword ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}
            >
              {showNewPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          <div className="relative">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Xác nhận mật khẩu</label>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              required
              className="block w-full px-4 py-3 pr-12 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all sm:text-sm"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((current) => !current)}
              className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600 transition-colors p-1"
              tabIndex={-1}
              aria-label={showConfirmPassword ? 'Ẩn xác nhận mật khẩu' : 'Hiện xác nhận mật khẩu'}
            >
              {showConfirmPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black rounded-2xl text-white bg-red-600 hover:bg-red-700 focus:outline-none transition-all shadow-lg shadow-red-100 disabled:opacity-70 active:scale-95"
          >
            {loading ? 'ĐANG LƯU...' : 'ĐẶT LẠI MẬT KHẨU'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Quay lại{' '}
            <Link to="/login" className="font-bold text-red-600 hover:text-red-700 transition-colors">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </main>
  );
};

export default ResetPassword;