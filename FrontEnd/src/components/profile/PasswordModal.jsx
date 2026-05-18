import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../ui/Modal';
import UserService from '../../services/userService';

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const EyeIcon = ({ visible }) => visible ? (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
) : (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PasswordInput = ({ label, name, value, onChange, placeholder, show, onToggle }) => (
  <div className="relative">
    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">
      {label} <span className="text-red-500">*</span>
    </label>
    <input
      type={show ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      className="w-full border border-gray-200 rounded-2xl px-4 py-3 pr-12 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
      placeholder={placeholder}
    />
    <button type="button" onClick={onToggle}
      className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600">
      <EyeIcon visible={show} />
    </button>
  </div>
);

export const PasswordModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState('form');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    otpCode: ['', '', '', '', '', ''],
  });

  const otpRefs = useRef([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleOtpChange = (e, index) => {
    const value = e.target.value;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...form.otpCode];
    if (value.length === 6) {
      for (let i = 0; i < 6; i++) {
        newOtp[i] = value[i] || '';
      }
      setForm(f => ({ ...f, otpCode: newOtp }));
      otpRefs.current[5]?.focus();
    } else {
      newOtp[index] = value.slice(-1);
      setForm(f => ({ ...f, otpCode: newOtp }));
      if (value && index < 5) {
        otpRefs.current[index + 1]?.focus();
      }
    }
    if (error) setError('');
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !form.otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleSendOtp = async () => {
    setError('');
    if (!form.currentPassword) { setError('Vui lòng nhập mật khẩu hiện tại.'); return; }
    if (!form.newPassword) { setError('Vui lòng nhập mật khẩu mới.'); return; }
    if (form.newPassword.length < 8) { setError('Mật khẩu mới phải có ít nhất 8 ký tự.'); return; }
    if (form.newPassword !== form.confirmPassword) { setError('Mật khẩu mới và xác nhận không khớp.'); return; }

    setSending(true);
    try {
      await UserService.sendOtpForPasswordChange();
      setStep('otp');
      setCountdown(300);
    } catch (err) {
      setError(err.response?.data?.message || 'Gửi mã OTP thất bại.');
    } finally {
      setSending(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setError('');
    setResendLoading(true);
    try {
      await UserService.sendOtpForPasswordChange();
      setCountdown(300);
      setForm(f => ({ ...f, otpCode: ['', '', '', '', '', ''] }));
    } catch (err) {
      setError(err.response?.data?.message || 'Gửi lại OTP thất bại.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = form.otpCode.join('');
    setError('');
    if (code.length !== 6) { setError('Vui lòng nhập đủ 6 chữ số OTP.'); return; }

    setLoading(true);
    try {
      await UserService.changePassword({ otpCode: code, newPassword: form.newPassword, confirmPassword: form.confirmPassword });
      setSuccess('Đổi mật khẩu thành công!');
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  const formatCountdown = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const icon = <LockIcon />;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Đổi mật khẩu" icon={icon} maxWidth="max-w-md">
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-700 text-sm flex items-center gap-2">
          <CheckCircleIcon />
          {success}
        </div>
      )}

      {step === 'form' && (
        <div className="space-y-4">
          <PasswordInput
            label="Mật khẩu hiện tại"
            value={form.currentPassword}
            onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))}
            placeholder="Nhập mật khẩu hiện tại"
            show={showNew}
            onToggle={() => setShowNew(!showNew)}
          />
          <PasswordInput
            label="Mật khẩu mới"
            value={form.newPassword}
            onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
            placeholder="Ít nhất 8 ký tự"
            show={showNew}
            onToggle={() => setShowNew(!showNew)}
          />
          <PasswordInput
            label="Xác nhận mật khẩu mới"
            value={form.confirmPassword}
            onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
            placeholder="Nhập lại mật khẩu mới"
            show={showConfirm}
            onToggle={() => setShowConfirm(!showConfirm)}
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            onClick={handleSendOtp}
            disabled={sending || !form.currentPassword || !form.newPassword || !form.confirmPassword}
            className="w-full py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang xác thực...
              </>
            ) : 'Xác nhận'}
          </button>
        </div>
      )}

      {step === 'otp' && (
        <div className="text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MailIcon />
          </div>
          <h4 className="text-xl font-black text-gray-900 tracking-tighter uppercase">Xác Thực Email</h4>
          <div className="h-1.5 w-12 bg-red-600 mx-auto mt-2 rounded-full" />
          <p className="mt-3 text-sm text-gray-500">Mã xác thực đã được gửi đến email của bạn.</p>

          {error && (
            <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-100 font-bold mt-4 text-left">
              ⚠ {error}
            </div>
          )}

          <div className="mt-6">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 text-center">
              Nhập mã xác thực 6 chữ số
            </label>
            <div className="flex justify-center gap-2">
              {form.otpCode.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (otpRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e, index)}
                  onKeyDown={(e) => handleOtpKeyDown(e, index)}
                  className="w-12 h-14 text-center text-xl font-bold rounded-2xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
                  disabled={loading}
                />
              ))}
            </div>
          </div>

          <button
            onClick={handleVerifyOtp}
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-4 px-4 mt-6 border border-transparent text-sm font-black rounded-2xl text-white bg-red-600 hover:bg-red-700 focus:outline-none transition-all shadow-lg shadow-red-100 disabled:opacity-70 active:scale-95"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : 'XÁC THỰC'}
          </button>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-500">
              Không nhận được mã?{' '}
              {countdown > 0 ? (
                <span className="text-gray-400 font-bold">Gửi lại sau {countdown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendLoading}
                  className="font-bold text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                >
                  {resendLoading ? 'Đang gửi...' : 'Gửi lại mã'}
                </button>
              )}
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
};
