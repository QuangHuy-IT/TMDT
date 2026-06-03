import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthService from '../services/authService';

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

const VALIDATORS = {
  fullName: (v) => {
    if (!v.trim()) return 'Họ và tên không được để trống';
    if (!/^[\p{L} ]+$/u.test(v)) return 'Họ và tên chỉ được chứa chữ cái và khoảng trắng';
    return '';
  },
  email: (v) => {
    if (!v.trim()) return 'Email không được để trống';
    if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(v)) return 'Email phải có đuôi @gmail.com';
    return '';
  },
  phone: (v) => {
    if (!v.trim()) return 'Số điện thoại không được để trống';
    if (!/^\d{10}$/.test(v)) return 'Số điện thoại phải gồm 10 chữ số';
    return '';
  },
  password: (v) => {
    if (!v) return 'Mật khẩu không được để trống';
    if (v.length < 8) return 'Mật khẩu phải ít nhất 8 ký tự';
    if (!/[a-z]/.test(v)) return 'Mật khẩu phải chứa ít nhất 1 chữ thường';
    if (!/[A-Z]/.test(v)) return 'Mật khẩu phải chứa ít nhất 1 chữ in hoa';
    if (!/\d/.test(v)) return 'Mật khẩu phải chứa ít nhất 1 chữ số';
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(v)) return 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt';
    return '';
  },
};

export const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    yearOfBirth: '',
    password: '',
    confirmPassword: ''
  });
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const fieldError = (field) => touched[field] ? VALIDATORS[field]?.(formData[field]) || '' : '';

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const digits = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: digits }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleBlur = (e) => {
    setTouched(prev => ({ ...prev, [e.target.name]: true }));
  };

  const validateAll = () => {
    const fields = ['fullName', 'email', 'phone', 'password'];
    const newTouched = {};
    fields.forEach(f => { newTouched[f] = true; });
    setTouched(newTouched);
    return fields.every(f => !VALIDATORS[f](formData[f]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateAll()) return;

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }

    setLoading(true);

    try {
      const response = await AuthService.register({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        yearOfBirth: formData.yearOfBirth ? parseInt(formData.yearOfBirth) : null,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      if (response.data) {
        setSuccess('Đăng ký thành công! Mã xác thực đã được gửi đến email của bạn.');
        setLoading(false);
        setTimeout(() => navigate('/verify-otp', { state: { email: formData.email } }), 1500);
      }
    } catch (err) {
      setLoading(false);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 409) {
        setError('Email hoặc số điện thoại đã tồn tại!');
      } else if (err.response?.status === 400) {
        setError('Vui lòng kiểm tra lại thông tin đăng ký!');
      } else {
        setError('Lỗi đăng ký. Vui lòng thử lại!');
      }
    }
  };

  const handleGoogleRegister = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      if (window.google) {
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
              setError('Đăng ký Google thất bại. Vui lòng thử lại!');
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
      setError('Đăng ký Google thất bại. Vui lòng thử lại!');
    }
  };

  const handleGoogleResponse = (res, googleAvatarUrl = '') => {
    setGoogleLoading(false);
    const data = res.data;

    if (data.stage === 'login') {
      navigate('/login');
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

  const inputClass = (field) =>
    `block w-full px-4 py-3 rounded-2xl bg-gray-50 border text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all sm:text-sm${
      touched[field] && fieldError(field) ? ' border-red-400' : ' border-gray-200'
    }`;

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
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
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">
            Đăng ký tài khoản
          </h2>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-100 font-bold">
            ⚠ {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 text-xs p-3 rounded-xl border border-green-100 font-bold">
            ✓ {success}
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">
                Họ và Tên
              </label>
              <input
                name="fullName"
                type="text"
                className={inputClass('fullName')}
                placeholder="Nguyễn Văn A"
                value={formData.fullName}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading}
              />
              {fieldError('fullName') && (
                <p className="text-red-500 text-xs mt-1 ml-1">{fieldError('fullName')}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">
                Email
              </label>
              <input
                name="email"
                type="email"
                className={inputClass('email')}
                placeholder="example@gmail.com"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading}
              />
              {fieldError('email') && (
                <p className="text-red-500 text-xs mt-1 ml-1">{fieldError('email')}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">
                Số Điện Thoại
              </label>
              <input
                name="phone"
                type="tel"
                className={inputClass('phone')}
                placeholder="0901234567"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading}
              />
              {fieldError('phone') && (
                <p className="text-red-500 text-xs mt-1 ml-1">{fieldError('phone')}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    className={inputClass('password') + ' pr-12'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
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
                {fieldError('password') && (
                  <p className="text-red-500 text-xs mt-1 ml-1">{fieldError('password')}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">
                  Xác nhận
                </label>
                <div className="relative">
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="block w-full px-4 py-3 pr-12 rounded-2xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all sm:text-sm"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                    tabIndex={-1}
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
            ) : 'TẠO TÀI KHOẢN NGAY'}
          </button>

          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={googleLoading}
            className="group relative w-full flex justify-center items-center py-4 px-4 border border-gray-300 text-sm font-bold rounded-2xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-all shadow-sm active:scale-95 disabled:opacity-70 mt-4"
          >
            {googleLoading ? (
              <svg className="animate-spin h-5 w-5 text-gray-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
            )}
            {googleLoading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG KÝ BẰNG GOOGLE'}
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
