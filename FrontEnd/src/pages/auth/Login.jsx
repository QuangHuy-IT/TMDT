import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShopContext } from '../../context/ShopContext';
import AuthService from '../../services/authService';

const decodeJwtPayload = (token) => {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decoder = new TextDecoder('utf-8');
    return JSON.parse(decoder.decode(bytes));
  } catch {
    return null;
  }
};

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { dispatch } = useContext(ShopContext);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await AuthService.login(email, password);

      if (response.data) {
        const { token, refreshToken, user } = response.data;

        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { token, refreshToken, user }
        });

        setLoading(false);
        navigate(from, { replace: true });
      }
    } catch (err) {
      setLoading(false);

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

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      if (window.google) {
        console.log('Current origin:', window.location.origin);
        console.log('Client ID:', '762465115125-doe0qlvt9ffgih9rtpk46isoah0h7kiu.apps.googleusercontent.com');
        window.google.accounts.id.initialize({
          client_id: '762465115125-doe0qlvt9ffgih9rtpk46isoah0h7kiu.apps.googleusercontent.com',
          callback: async (response) => {
            try {
              const payload = decodeJwtPayload(response.credential);

              const res = await AuthService.googleAuth({
                idToken: response.credential,
                email: payload.email,
                fullName: payload.name,
                googleId: payload.sub,
                avatarUrl: payload.picture,
              });

              handleGoogleResponse(res, payload.picture);
            } catch (err) {
              setGoogleLoading(false);
              setError('Đăng nhập Google thất bại. Vui lòng thử lại!');
              console.error('Google auth error:', err);
            }
          }
        });

        window.google.accounts.id.prompt();
      } else {
        setGoogleLoading(false);
        setError('Google OAuth chưa được tải. Vui lòng làm mới trang!');
      }
    } catch (err) {
      setGoogleLoading(false);
      setError('Đăng nhập Google thất bại. Vui lòng thử lại!');
      console.error('Google login error:', err);
    }
  };

  const handleGoogleResponse = (res, googleAvatarUrl = '') => {
    setGoogleLoading(false);
    const data = res.data;

    if (data.stage === 'login') {
      const { token, refreshToken, user } = data;
      const normalizedUser = {
        ...user,
        avatarUrl: user?.avatarUrl || googleAvatarUrl || null,
      };
      dispatch({ type: 'LOGIN_SUCCESS', payload: { token, refreshToken, user: normalizedUser } });
      navigate(from, { replace: true });
    } else if (data.stage === 'complete_profile') {
      navigate('/complete-google-register', {
        state: {
          email: data.email,
          fullName: data.fullName,
          avatarUrl: data.avatarUrl || googleAvatarUrl,
        }
      });
    } else if (data.stage === 'verify_otp') {
      navigate('/verify-otp', { state: { email: data.email } });
    }
  };

  return (
    <main className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="relative max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
        <Link
          to="/"
          className="absolute top-5 right-5 text-gray-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-full"
          title="Quay lại trang chủ"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Link>

        <div className="text-center">
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Đăng Nhập</h2>
          <div className="h-1.5 w-12 bg-red-600 mx-auto mt-2 rounded-full"></div>
          <p className="mt-4 text-sm text-gray-500">
            Chào mừng bạn quay lại với <span className="font-bold text-red-600">HHShop</span>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-100 font-bold">
            ⚠ {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Email</label>
              <input type="email" required className="block w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all sm:text-sm" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
            </div>
            <div className="relative">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">Mật khẩu</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="block w-full px-4 py-3 pr-12 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all sm:text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600 transition-colors p-1"
                tabIndex={-1}
              >
                {showPassword ? (
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
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input id="remember-me" type="checkbox" className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded cursor-pointer" />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-500 cursor-pointer">Ghi nhớ tôi</label>
            </div>
            <Link to="/forgot-password" className="text-sm font-bold text-red-600 hover:text-red-700 transition-colors">Quên mật khẩu?</Link>
          </div>

          <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black rounded-2xl text-white bg-red-600 hover:bg-red-700 focus:outline-none transition-all shadow-lg shadow-red-100 disabled:opacity-70 active:scale-95">
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : 'ĐĂNG NHẬP'}
          </button>

          <button type="button" onClick={handleGoogleLogin} disabled={googleLoading}
            className="group relative w-full flex justify-center items-center py-4 px-4 border border-gray-300 text-sm font-bold rounded-2xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-all shadow-sm active:scale-95 disabled:opacity-70 mt-4">
            {googleLoading ? (
              <svg className="animate-spin h-5 w-5 text-gray-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" className="w-5 h-5 mr-3" />
            )}
            {googleLoading ? 'ĐANG XỬ LÝ...' : 'TIẾP TỤC VỚI GOOGLE'}
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
