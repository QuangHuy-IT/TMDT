import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import AuthService from '../services/authService';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { dispatch } = useContext(ShopContext);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Gọi API login từ backend
      const response = await AuthService.login(email, password);
      
      if (response.data) {
        const { token, refreshToken, user } = response.data;
        
        // Dispatch LOGIN_SUCCESS với token, refreshToken và user info
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { token, refreshToken, user }
        });

        setLoading(false);
        navigate(from, { replace: true });
      }
    } catch (err) {
      setLoading(false);
      
      // Xử lý lỗi từ backend
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 401) {
        setError('Email hoặc mật khẩu không đúng!');
      } else {
        setError('Lỗi đăng nhập. Vui lòng thử lại!');
      }
      console.error('Login error:', err);
    }
  };

  return (
    <main className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-gray-100">

        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Đăng Nhập</h2>
          <div className="h-1.5 w-12 bg-red-600 mx-auto mt-2 rounded-full"></div>
          <p className="mt-4 text-sm text-gray-500">
            Chào mừng bạn quay lại với <span className="font-bold text-red-600">HHShop</span>
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-100 font-bold">
            ⚠ {error}
          </div>
        )}

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
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
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Mật khẩu</label>
              <input
                type="password"
                required
                className="block w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all sm:text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input id="remember-me" type="checkbox" className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded cursor-pointer" />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-500 cursor-pointer">Ghi nhớ tôi</label>
            </div>
            <a href="#" className="text-sm font-bold text-red-600 hover:text-red-700 transition-colors">Quên mật khẩu?</a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black rounded-2xl text-white bg-red-600 hover:bg-red-700 focus:outline-none transition-all shadow-lg shadow-red-100 disabled:opacity-70 active:scale-95"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : "ĐĂNG NHẬP"}
          </button>

        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Chưa có tài khoản?{' '}
            <Link to="/signup" className="font-bold text-red-600 hover:text-red-700 transition-colors">Đăng ký ngay</Link>
          </p>
        </div>
      </div>
    </main>
  );
};

