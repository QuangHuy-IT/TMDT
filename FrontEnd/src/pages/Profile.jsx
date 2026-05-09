import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { ShopContext } from '../context/ShopContext';
import UserService from '../services/userService';
import AddressService from '../services/addressService';
import { PROVINCES, getWardsByProvinceCode, getProvinceNameByCode } from '../data/provinces';

// ─── Address Card ───────────────────────────────────────────────────────────────
const AddressCard = ({ addr, onEdit, onDelete, onSetDefault, savingId }) => {
  const isDefault = addr.isDefault;
  const isProcessing = savingId === addr.id;

  return (
    <div className={`relative rounded-2xl border-2 p-5 transition-all ${isDefault ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white hover:border-red-300'}`}>
      {isDefault && (
        <span className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          Mặc định
        </span>
      )}

      <div className="space-y-1 pr-16">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900">{addr.receiverName}</span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-700">{addr.receiverPhone}</span>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          {addr.detailAddress}
          {addr.ward ? `, ${addr.ward}` : ''}
          {addr.district ? `, ${addr.district}` : ''}
          {addr.province ? `, ${addr.province}` : ''}
        </p>
      </div>

      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
        {!isDefault && (
          <button
            onClick={() => onSetDefault(addr.id)}
            disabled={isProcessing}
            className="text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors disabled:opacity-40 flex items-center gap-1"
          >
            {isProcessing ? (
              <><div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" /> Đang xử lý...</>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Đặt làm mặc định
              </>
            )}
          </button>
        )}
        <span className="text-gray-200">|</span>
        <button
          onClick={() => onEdit(addr)}
          className="text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Sửa
        </button>
        <span className="text-gray-200">|</span>
        <button
          onClick={() => onDelete(addr.id)}
          className="text-xs font-semibold text-gray-400 hover:text-red-600 transition-colors flex items-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Xóa
        </button>
      </div>
    </div>
  );
};

// ─── Address Form ───────────────────────────────────────────────────────────────
const AddressForm = ({ address, onSave, onCancel, saving, errors }) => {
  const isEdit = !!address?.id;
  const [form, setForm] = useState({
    receiverName: address?.receiverName || '',
    receiverPhone: address?.receiverPhone || '',
    provinceCode: address?.province ? (PROVINCES.find(p => p.name === address.province)?.code || address.province) : '',
    ward: address?.ward || '',
    detailAddress: address?.detailAddress || '',
    isDefault: address?.isDefault || false,
  });

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: type === 'checkbox' ? checked : value };
      if (name === 'provinceCode') {
        updated.ward = '';
      }
      return updated;
    });
  }, []);

  const handleSubmit = () => {
    const provinceName = getProvinceNameByCode(form.provinceCode);
    onSave({
      ...form,
      province: provinceName || form.provinceCode,
      district: '',
    });
  };

  const wards = form.provinceCode ? getWardsByProvinceCode(form.provinceCode) : [];

  const field = (label, name, required, extraProps = {}) => (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        name={name}
        value={form[name]}
        onChange={handleChange}
        {...extraProps}
        className={`w-full border rounded-2xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all ${errors?.[name] ? 'border-red-400' : 'border-gray-200'}`}
      />
      {errors?.[name] && <p className="text-xs text-red-500 ml-1">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="border-2 border-red-300 bg-red-50/30 rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-2">
        <div className="bg-red-100 p-1.5 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h6 className="font-bold text-gray-800">{isEdit ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}</h6>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {field('Người nhận', 'receiverName', true, { placeholder: 'Họ và tên người nhận' })}
        {field('Số điện thoại', 'receiverPhone', true, { type: 'tel', placeholder: 'Số điện thoại người nhận' })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
            Tỉnh / Thành phố <span className="text-red-500">*</span>
          </label>
          <select
            name="provinceCode"
            value={form.provinceCode}
            onChange={handleChange}
            className={`w-full border rounded-2xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all bg-white appearance-none cursor-pointer ${errors?.province ? 'border-red-400' : 'border-gray-200'}`}
          >
            <option value="">-- Chọn Tỉnh / Thành phố --</option>
            {PROVINCES.map(p => (
              <option key={p.code} value={p.code}>{p.name}</option>
            ))}
          </select>
          {errors?.province && <p className="text-xs text-red-500 ml-1">{errors.province}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
            Phường / Xã <span className="text-red-500">*</span>
          </label>
          <select
            name="ward"
            value={form.ward}
            onChange={handleChange}
            disabled={!form.provinceCode}
            className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all bg-white appearance-none cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">-- Chọn Phường / Xã --</option>
            {wards.map(w => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
          Địa chỉ cụ thể <span className="text-red-500">*</span>
        </label>
        <input
          name="detailAddress"
          value={form.detailAddress}
          onChange={handleChange}
          placeholder="Số nhà, tên đường, thôn, xóm..."
          className={`w-full border rounded-2xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all ${errors?.detailAddress ? 'border-red-400' : 'border-gray-200'}`}
        />
        {errors?.detailAddress && <p className="text-xs text-red-500 ml-1">{errors.detailAddress}</p>}
      </div>

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          name="isDefault"
          checked={form.isDefault}
          onChange={handleChange}
          className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
        />
        <span className="text-sm font-semibold text-gray-700">Đặt làm địa chỉ mặc định</span>
      </label>

      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="bg-red-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang lưu...</>
          ) : isEdit ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ'}
        </button>
        <button
          onClick={onCancel}
          className="py-3 px-6 border border-gray-300 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all"
        >
          Hủy
        </button>
      </div>
    </div>
  );
};

// ─── Avatar Modal ──────────────────────────────────────────────────────────────
const AvatarModal = ({ currentAvatar, onClose, onSave }) => {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(currentAvatar);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file hình ảnh.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Kích thước ảnh không được vượt quá 5MB.');
      return;
    }

    setError('');
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!selectedFile) {
      setError('Vui lòng chọn một ảnh mới.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      const res = await fetch('http://localhost:8080/cloudinary/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const url = data.secure_url || data.url;
      await onSave(url);
    } catch {
      setError('Tải ảnh lên thất bại. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="bg-red-100 p-2 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900">Đổi ảnh đại diện</h3>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative mb-6">
            <div className="w-36 h-36 rounded-full border-4 border-red-500 p-1 bg-white overflow-hidden">
              <img src={preview || currentAvatar} alt="Preview" className="h-full w-full rounded-full object-cover" />
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 border-2 border-red-600 text-red-600 rounded-2xl font-bold hover:bg-red-600 hover:text-white transition-all duration-300 mb-2"
          >
            Chọn ảnh mới
          </button>

          {selectedFile && (
            <p className="text-xs text-gray-500 mb-2 truncate max-w-full px-2">
              {selectedFile.name}
            </p>
          )}

          {error && (
            <p className="text-sm text-red-500 mb-3">{error}</p>
          )}

          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={uploading || !selectedFile}
              className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang tải...</>
              ) : 'Lưu ảnh'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Password Modal ────────────────────────────────────────────────────────────
const PasswordModal = ({ onClose }) => {
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    otpCode: ['', '', '', '', '', ''],
  });

  const otpRefs = useRef([]);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
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

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendOtp = async () => {
    setError('');
    if (!form.currentPassword) {
      setError('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (!form.newPassword) {
      setError('Vui lòng nhập mật khẩu mới.');
      return;
    }
    if (form.newPassword.length < 8) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('Mật khẩu mới và xác nhận không khớp.');
      return;
    }
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
    if (code.length !== 6) {
      setError('Vui lòng nhập đủ 6 chữ số OTP.');
      return;
    }
    setLoading(true);
    try {
      await UserService.changePassword({
        otpCode: code,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });
      setSuccess('Đổi mật khẩu thành công!');
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  const formatCountdown = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="bg-red-100 p-2 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900">Đổi mật khẩu</h3>
        </div>

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-700 text-sm flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {success}
          </div>
        )}

        {step === 'form' && (
          <div className="space-y-4">
            {/* Current password */}
            <div className="relative">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">
                Mật khẩu hiện tại <span className="text-red-500">*</span>
              </label>
              <input
                type={showNew ? 'text' : 'password'}
                value={form.currentPassword}
                onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 pr-12 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                placeholder="Nhập mật khẩu hiện tại"
              />
              <button type="button" onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600">
                {showNew ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {/* New password */}
            <div className="relative">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">
                Mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <input
                type={showNew ? 'text' : 'password'}
                value={form.newPassword}
                onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 pr-12 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                placeholder="Ít nhất 8 ký tự"
              />
              <button type="button" onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600">
                {showNew ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Confirm password */}
            <div className="relative">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ml-1">
                Xác nhận mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 pr-12 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                placeholder="Nhập lại mật khẩu mới"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600">
                {showConfirm ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              onClick={handleSendOtp}
              disabled={sending || !form.currentPassword || !form.newPassword || !form.confirmPassword}
              className="w-full py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {sending ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang xác thực...</>
              ) : 'Xác nhận'}
            </button>
          </div>
        )}

        {step === 'otp' && (
          <div className="text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="text-xl font-black text-gray-900 tracking-tighter uppercase">Xác Thực Email</h4>
            <div className="h-1.5 w-12 bg-red-600 mx-auto mt-2 rounded-full"></div>
            <p className="mt-3 text-sm text-gray-500">
              Mã xác thực đã được gửi đến email của bạn.
            </p>

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
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
      </div>
    </div>
  );
};

// ─── Profile Page ──────────────────────────────────────────────────────────────
export const Profile = () => {
  const { state, dispatch } = useContext(ShopContext);
  const { user: contextUser } = state;

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [personalForm, setPersonalForm] = useState({
    fullName: '', phone: '', email: '', yearOfBirth: '',
  });

  // ── Fetch profile ──
  useEffect(() => {
    const fetch = async () => {
      setLoadingProfile(true);
      try {
        const res = await UserService.getProfile();
        const data = res.data;
        setProfile(data);
        setPersonalForm({
          fullName: data.fullName || '',
          phone: data.phone || '',
          email: data.email || '',
          yearOfBirth: data.yearOfBirth || '',
        });
      } catch {
        setError('Không thể tải thông tin hồ sơ.');
      } finally {
        setLoadingProfile(false);
      }
    };
    fetch();
  }, []);

  // ── Fetch addresses ──
  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const res = await AddressService.getAddresses();
      setAddresses(res.data);
    } catch {
      // silent fail — addresses are optional
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  // ── Personal info handlers ──
  const handlePersonalChange = (e) => {
    const { name, value } = e.target;
    setPersonalForm(prev => ({ ...prev, [name]: value }));
    setSuccessMsg('');
  };

  const handleSavePersonal = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await UserService.updateProfile({
        ...profile,
        fullName: personalForm.fullName,
        phone: personalForm.phone,
        yearOfBirth: personalForm.yearOfBirth,
      });
      setProfile(res.data);
      dispatch({ type: 'UPDATE_USER', payload: res.data });
      setEditingPersonal(false);
      setSuccessMsg('Cập nhật thông tin cá nhân thành công!');
    } catch (err) {
      setError(err.response?.data?.message || 'Cập nhật thông tin cá nhân thất bại.');
    } finally {
      setSaving(false);
    }
  };

  // ── Address handlers ──
  const handleAddAddress = () => {
    setEditingAddress(null);
    setShowAddressForm(true);
    setError('');
  };

  const handleEditAddress = (addr) => {
    setEditingAddress(addr);
    setShowAddressForm(true);
    setError('');
  };

  const handleCancelAddress = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
  };

  const handleSaveAddress = async (formData) => {
    setSaving(true);
    setError(null);
    try {
      if (editingAddress?.id) {
        await AddressService.updateAddress(editingAddress.id, formData);
        setSuccessMsg('Cập nhật địa chỉ thành công!');
      } else {
        await AddressService.createAddress(formData);
        setSuccessMsg('Thêm địa chỉ mới thành công!');
      }
      await fetchAddresses();
      handleCancelAddress();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error;
      if (msg) {
        setError(msg);
      } else {
        setError(editingAddress?.id ? 'Cập nhật địa chỉ thất bại.' : 'Thêm địa chỉ thất bại.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;
    setSavingId(id);
    try {
      await AddressService.deleteAddress(id);
      setAddresses(prev => prev.filter(a => a.id !== id));
      setSuccessMsg('Xóa địa chỉ thành công!');
    } catch {
      setError('Xóa địa chỉ thất bại.');
    } finally {
      setSavingId(null);
    }
  };

  const handleSetDefault = async (id) => {
    setSavingId(id);
    try {
      const res = await AddressService.setDefaultAddress(id);
      setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));
      setSuccessMsg('Đã đặt làm địa chỉ mặc định!');
    } catch {
      setError('Đặt mặc định thất bại.');
    } finally {
      setSavingId(null);
    }
  };

  // ── Avatar handler ──
  const handleAvatarSave = async (avatarUrl) => {
    const res = await UserService.updateAvatar(avatarUrl);
    setProfile(res.data);
    dispatch({ type: 'UPDATE_USER', payload: res.data });
    setShowAvatarModal(false);
    setSuccessMsg('Cập nhật ảnh đại diện thành công!');
  };

  const avatar = profile?.avatarUrl
    ? (profile.avatarUrl.startsWith('http') ? profile.avatarUrl : profile.avatarUrl)
    : '/assets/images/profile/avatar-default.png';

  if (loadingProfile) {
    return (
      <main className="min-h-screen bg-gray-50 pb-20">
        <div className="max-w-7xl mx-auto px-4 pt-10 flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-500 text-sm">Đang tải thông tin...</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 pt-10">
        {/* Modals */}
        {showAvatarModal && (
          <AvatarModal
            currentAvatar={avatar}
            onClose={() => setShowAvatarModal(false)}
            onSave={handleAvatarSave}
          />
        )}
        {showPasswordModal && (
          <PasswordModal onClose={() => setShowPasswordModal(false)} />
        )}

        {/* Header */}
        <div className="flex items-center gap-4 mb-8 border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Hồ sơ của tôi</h1>
          {profile?.role === 'ADMIN' && (
            <span className="bg-red-100 text-red-600 text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">Quản trị viên</span>
          )}
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-700 text-sm flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {successMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left sidebar */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden text-center p-8 sticky top-24">
              <div className="relative inline-block mb-6">
                <div className="h-32 w-32 rounded-full border-4 border-red-500 p-1 bg-white mx-auto overflow-hidden">
                  <img src={avatar} alt="Avatar" className="h-full w-full rounded-full object-cover" />
                </div>
                <button
                  onClick={() => setShowAvatarModal(true)}
                  className="absolute bottom-1 right-1 bg-gray-900 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-1">{profile?.fullName || 'Chưa cập nhật'}</h4>
              <p className="text-sm text-gray-500 mb-8">{profile?.email}</p>
              <div className="space-y-3">
                <button
                  onClick={() => setShowAvatarModal(true)}
                  className="w-full py-3 border-2 border-red-600 text-red-600 rounded-2xl font-bold hover:bg-red-600 hover:text-white transition-all duration-300"
                >
                  Đổi ảnh đại diện
                </button>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="w-full py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all duration-300"
                >
                  Đổi mật khẩu
                </button>
              </div>
            </div>
          </div>

          {/* Right content */}
          <div className="lg:col-span-8 space-y-6">

            {/* Personal info */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="bg-red-50 p-2 rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h5 className="text-xl font-bold text-gray-900">Thông tin cá nhân</h5>
                </div>
                {!editingPersonal && (
                  <button
                    onClick={() => { setEditingPersonal(true); setSuccessMsg(''); }}
                    className="text-red-600 text-sm font-bold hover:underline flex items-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Chỉnh sửa
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Họ và tên</label>
                  {editingPersonal ? (
                    <input type="text" name="fullName" value={personalForm.fullName} onChange={handlePersonalChange}
                      className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all" />
                  ) : (
                    <div className="w-full bg-gray-50 border-0 rounded-2xl px-4 py-3 text-gray-900">{personalForm.fullName || 'Chưa cập nhật'}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Email</label>
                  <div className="w-full bg-gray-50 border-0 rounded-2xl px-4 py-3 text-gray-900">{personalForm.email}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                  {editingPersonal ? (
                    <input type="tel" name="phone" value={personalForm.phone} onChange={handlePersonalChange}
                      placeholder="Nhập số điện thoại"
                      className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all" />
                  ) : (
                    <div className="w-full bg-gray-50 border-0 rounded-2xl px-4 py-3 text-gray-900">{personalForm.phone || 'Chưa cập nhật'}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Năm sinh</label>
                  {editingPersonal ? (
                    <input type="number" name="yearOfBirth" value={personalForm.yearOfBirth} onChange={handlePersonalChange}
                      min="1900" max={new Date().getFullYear()} placeholder="VD: 1995"
                      className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all" />
                  ) : (
                    <div className="w-full bg-gray-50 border-0 rounded-2xl px-4 py-3 text-gray-900">{personalForm.yearOfBirth || 'Chưa cập nhật'}</div>
                  )}
                </div>
              </div>

              {editingPersonal && (
                <div className="flex gap-3 mt-6">
                  <button onClick={handleSavePersonal} disabled={saving}
                    className="bg-red-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
                    {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang lưu...</> : 'LƯU THÔNG TIN'}
                  </button>
                  <button onClick={() => { setEditingPersonal(false); setPersonalForm(p => ({ ...p, fullName: profile?.fullName || '', phone: profile?.phone || '', yearOfBirth: profile?.yearOfBirth || '' })); setError(null); }}
                    className="py-3 px-6 border border-gray-300 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all">
                    Hủy
                  </button>
                </div>
              )}
            </div>

            {/* Shipping addresses */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-red-50 p-2 rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h5 className="text-xl font-bold text-gray-900">Địa chỉ nhận hàng</h5>
                </div>
                {!showAddressForm && (
                  <button
                    onClick={handleAddAddress}
                    className="bg-red-600 text-white text-sm font-bold px-5 py-2.5 rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-100 active:scale-95 flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Thêm địa chỉ mới
                  </button>
                )}
              </div>

              {showAddressForm && (
                <div className="mb-6">
                  <AddressForm
                    address={editingAddress}
                    onSave={handleSaveAddress}
                    onCancel={handleCancelAddress}
                    saving={saving}
                    errors={null}
                  />
                </div>
              )}

              {loadingAddresses ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="font-semibold">Chưa có địa chỉ nhận hàng nào.</p>
                  <p className="text-sm mt-1">Nhấn "Thêm địa chỉ mới" để bắt đầu.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map(addr => (
                    <AddressCard
                      key={addr.id}
                      addr={addr}
                      onEdit={handleEditAddress}
                      onDelete={handleDeleteAddress}
                      onSetDefault={handleSetDefault}
                      savingId={savingId}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </main>
  );
};
