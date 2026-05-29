import React, { useState, useEffect } from 'react';
import { PROVINCES } from '../../data/provinces';
import ProvincesService from '../../services/provincesService';

const UserIcon = () => (
  <span className="bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
);

const PaymentIcon = () => (
  <span className="bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
);

const ChevronDownIcon = ({ open }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const MapPinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export const CheckoutForm = ({
  shippingInfo,
  paymentMethod,
  isProcessing,
  error,
  savedAddresses,
  selectedAddressId,
  onInputChange,
  onSelectAddress,
  onSubmit,
  onPaymentMethodChange,
}) => {
  const [wards, setWards] = useState([]);
  const [loadingWards, setLoadingWards] = useState(false);
  const [addressesExpanded, setAddressesExpanded] = useState(false);

  useEffect(() => {
    if (!shippingInfo.provinceCode) {
      setWards([]);
      return;
    }
    setLoadingWards(true);
    ProvincesService.getWardsByProvinceCode(shippingInfo.provinceCode)
      .then(setWards)
      .catch(() => setWards([]))
      .finally(() => setLoadingWards(false));
  }, [shippingInfo.provinceCode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onInputChange({ target: { name, value } });
  };

  const wardOptions = wards.map(w => ({ code: w, name: w }));
  const provinceOptions = PROVINCES.map(p => ({ code: p.code, name: p.name }));

  return (
    <>
      {/* Shipping Info */}
      <section className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <UserIcon />
          Thông tin nhận hàng
        </h2>

        {savedAddresses.length > 0 && (
          <div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-200">
            <button
              type="button"
              onClick={() => setAddressesExpanded(prev => !prev)}
              className="w-full flex items-center justify-between text-left"
            >
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase ml-1 mb-0.5">
                  Địa chỉ đã lưu
                </label>
                <p className="text-sm text-gray-600 font-medium ml-1">
                  {selectedAddressId
                    ? savedAddresses.find(a => a.id === selectedAddressId)?.receiverName || 'Đã chọn địa chỉ'
                    : 'Chọn địa chỉ nhận hàng'}
                  <span className="text-gray-400 font-normal ml-1">
                    ({savedAddresses.length} địa chỉ)
                  </span>
                </p>
              </div>
              <span className={`flex items-center gap-1 text-sm font-bold px-3 py-1.5 rounded-xl border transition-all ${
                addressesExpanded
                  ? 'bg-red-50 border-red-200 text-red-600'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-red-300'
              }`}>
                {addressesExpanded ? 'Thu gọn' : 'Chọn địa chỉ'}
                <ChevronDownIcon open={addressesExpanded} />
              </span>
            </button>

            {addressesExpanded && (
              <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {savedAddresses.map(addr => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => {
                      onSelectAddress(addr);
                      setAddressesExpanded(false);
                    }}
                    className={`text-left p-3 rounded-xl border-2 transition-all text-sm ${
                      selectedAddressId === addr.id
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 bg-white hover:border-red-300'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`mt-0.5 ${selectedAddressId === addr.id ? 'text-red-600' : 'text-gray-400'}`}>
                        {addr.isDefault ? '⭐' : '📍'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 truncate">{addr.receiverName}</p>
                        <p className="text-gray-500 text-xs truncate">{addr.receiverPhone}</p>
                        <p className="text-gray-400 text-xs leading-relaxed break-words line-clamp-2">
                          {[addr.detailAddress, addr.ward, addr.province].filter(Boolean).join(', ')}
                        </p>
                        {addr.isDefault && (
                          <span className="inline-block mt-1 text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full">
                            Mặc định
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Người nhận</label>
            <input
              type="text"
              name="receiverName"
              value={shippingInfo.receiverName}
              onChange={handleInputChange}
              required
              placeholder="Họ và tên người nhận"
              className="w-full bg-gray-50 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-red-500 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Số điện thoại</label>
            <input
              type="tel"
              name="receiverPhone"
              value={shippingInfo.receiverPhone}
              onChange={handleInputChange}
              required
              placeholder="VD: 0912345678"
              className="w-full bg-gray-50 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-red-500 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Tỉnh / Thành phố</label>
            <select
              name="provinceCode"
              value={shippingInfo.provinceCode}
              onChange={handleInputChange}
              required
              className="w-full bg-gray-50 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-red-500 transition-all"
            >
              <option value="">Chọn Tỉnh / Thành phố</option>
              {provinceOptions.map(p => (
                <option key={p.code} value={p.code}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Phường / Xã</label>
            <select
              name="ward"
              value={shippingInfo.ward}
              onChange={handleInputChange}
              required
              disabled={!shippingInfo.provinceCode || loadingWards}
              className="w-full bg-gray-50 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-red-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {!shippingInfo.provinceCode
                  ? 'Chọn Tỉnh / Thành phố trước'
                  : loadingWards
                  ? 'Đang tải...'
                  : 'Chọn Phường / Xã'}
              </option>
              {wardOptions.map(w => (
                <option key={w.code} value={w.code}>{w.name}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Địa chỉ cụ thể</label>
            <input
              type="text"
              name="detailAddress"
              value={shippingInfo.detailAddress}
              onChange={handleInputChange}
              required
              placeholder="Số nhà, tên đường, thôn, xóm..."
              className="w-full bg-gray-50 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-red-500 transition-all"
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Ghi chú (tùy chọn)</label>
            <input
              type="text"
              name="note"
              value={shippingInfo.note}
              onChange={handleInputChange}
              maxLength={500}
              placeholder="Ghi chú cho đơn hàng..."
              className="w-full bg-gray-50 border-gray-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-red-500 transition-all"
            />
          </div>
        </div>
      </section>

      {/* Payment Method */}
      <section className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <PaymentIcon />
          Phương thức thanh toán
        </h2>
        <div className="space-y-3">
          <label
            className={`flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-red-500 bg-red-50' : 'border-gray-100 hover:border-gray-200'}`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="payment"
                value="cod"
                checked={paymentMethod === 'cod'}
                onChange={() => onPaymentMethodChange('cod')}
                className="accent-red-600 w-4 h-4"
              />
              <span className="font-bold text-gray-700">Thanh toán khi nhận hàng (COD)</span>
            </div>
            <span className="text-2xl">💵</span>
          </label>

          <label
            className={`flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer transition-all ${paymentMethod === 'payos' ? 'border-red-500 bg-red-50' : 'border-gray-100 hover:border-gray-200'}`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="payment"
                value="payos"
                checked={paymentMethod === 'payos'}
                onChange={() => onPaymentMethodChange('payos')}
                className="accent-red-600 w-4 h-4"
              />
              <span className="font-bold text-gray-700">Thanh toán qua PayOS (QR Code / Chuyển khoản)</span>
            </div>
            <span className="text-2xl">📱</span>
          </label>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isProcessing}
        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-red-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Đang xử lý...
          </>
        ) : paymentMethod === 'payos' ? (
          'THANH TOÁN QUA PAYOS'
        ) : (
          'ĐẶT HÀNG NGAY'
        )}
      </button>
      <p className="text-[10px] text-center opacity-40 uppercase tracking-widest">
        Bằng cách đặt hàng, bạn đồng ý với điều khoản của cửa hàng
      </p>
    </>
  );
};
