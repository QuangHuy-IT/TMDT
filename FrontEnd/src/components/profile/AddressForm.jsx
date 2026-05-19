import React, { useState, useCallback, useEffect } from 'react';
import { FormField, SelectField, CheckboxField } from '../ui/FormField';
import { PROVINCES, getProvinceNameByCode } from '../../data/provinces';
import ProvincesService from '../../services/provincesService';

const LocationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export const AddressForm = ({ address, onSave, onCancel, saving }) => {
  const isEdit = !!address?.id;

  // Lấy mã tỉnh — ưu tiên lookup bằng name vì address.province là name
  const initProvinceCode = address?.province
    ? (PROVINCES.find(p => p.name === address.province)?.code || String(address.province))
    : '';

  const [form, setForm] = useState({
    receiverName: address?.receiverName || '',
    receiverPhone: address?.receiverPhone || '',
    provinceCode: initProvinceCode,
    ward: address?.ward || '',
    detailAddress: address?.detailAddress || '',
    isDefault: address?.isDefault || false,
  });

  const [wards, setWards] = useState([]);
  const [loadingWards, setLoadingWards] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.receiverName.trim()) {
      errs.receiverName = 'Tên người nhận không được để trống';
    }
    if (!form.receiverPhone.trim()) {
      errs.receiverPhone = 'Số điện thoại không được để trống';
    } else if (!/^\d{10}$/.test(form.receiverPhone.trim())) {
      errs.receiverPhone = 'Số điện thoại phải gồm đúng 10 chữ số';
    }
    if (!form.provinceCode) {
      errs.province = 'Tỉnh / Thành phố không được để trống';
    }
    if (!form.ward) {
      errs.ward = 'Phường / Xã không được để trống';
    }
    if (!form.detailAddress.trim()) {
      errs.detailAddress = 'Địa chỉ cụ thể không được để trống';
    }
    return errs;
  };

  // Fetch wards khi có provinceCode (ban đầu hoặc khi sửa)
  useEffect(() => {
    if (!form.provinceCode) {
      setWards([]);
      return;
    }
    setLoadingWards(true);
    ProvincesService.getWardsByProvinceCode(form.provinceCode)
      .then(setWards)
      .catch(() => setWards([]))
      .finally(() => setLoadingWards(false));
  }, [form.provinceCode]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: type === 'checkbox' ? checked : value };
      if (name === 'provinceCode') {
        updated.ward = '';
      }
      return updated;
    });
    setFieldErrors(prev => {
      const cleared = { ...prev };
      delete cleared[name];
      if (name === 'provinceCode') delete cleared['ward'];
      return cleared;
    });
  }, []);

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    const provinceName = getProvinceNameByCode(form.provinceCode);
    onSave({
      ...form,
      province: provinceName || form.provinceCode,
      district: '',
    });
  };

  const wardOptions = wards.map(w => ({ code: w, name: w }));

  return (
    <div className="border-2 border-red-300 bg-red-50/30 rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-2">
        <div className="bg-red-100 p-1.5 rounded-lg">
          <LocationIcon />
        </div>
        <h6 className="font-bold text-gray-800">{isEdit ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}</h6>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Người nhận"
          name="receiverName"
          value={form.receiverName}
          onChange={handleChange}
          required
          placeholder="Họ và tên người nhận"
          error={fieldErrors.receiverName}
        />
        <FormField
          label="Số điện thoại"
          name="receiverPhone"
          value={form.receiverPhone}
          onChange={handleChange}
          required
          type="tel"
          placeholder="Số điện thoại người nhận"
          error={fieldErrors.receiverPhone}
          extraProps={{ maxLength: 10 }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField
          label="Tỉnh / Thành phố"
          name="provinceCode"
          value={form.provinceCode}
          onChange={handleChange}
          options={PROVINCES}
          placeholder="-- Chọn Tỉnh / Thành phố --"
          error={fieldErrors.province}
        />
        <SelectField
          label="Phường / Xã"
          name="ward"
          value={form.ward}
          onChange={handleChange}
          options={wardOptions}
          placeholder={
            !form.provinceCode
              ? '-- Chọn Tỉnh / Thành phố trước --'
              : loadingWards
              ? 'Đang tải...'
              : '-- Chọn Phường / Xã --'
          }
          disabled={!form.provinceCode || loadingWards}
          error={fieldErrors.ward}
        />
      </div>

      <FormField
        label="Địa chỉ cụ thể"
        name="detailAddress"
        value={form.detailAddress}
        onChange={handleChange}
        required
        placeholder="Số nhà, tên đường, thôn, xóm..."
        error={fieldErrors.detailAddress}
      />

      <CheckboxField
        label="Đặt làm địa chỉ mặc định"
        name="isDefault"
        checked={form.isDefault}
        onChange={handleChange}
      />

      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="bg-red-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Đang lưu...
            </>
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
