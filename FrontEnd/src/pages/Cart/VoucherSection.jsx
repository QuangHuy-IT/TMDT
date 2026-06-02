import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Ticket, AlertCircle } from 'lucide-react';
import voucherService from '../../services/voucherService';
import VoucherCard from '../../components/ui/VoucherCard';

const VoucherSection = ({ subtotal, applied, onApply }) => {
  const [code, setCode]         = useState('');
  const [error, setError]       = useState('');
  const [showList, setShowList] = useState(false);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [applying, setApplying] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await voucherService.getAvailableVouchers();
      setVouchers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  // Helper: Calculate actual discount amount for a voucher based on subtotal
  const getActualDiscount = useCallback((v, subtotal) => {
    if (v.minOrderAmount != null && subtotal < v.minOrderAmount) {
      return 0; // Not eligible, discount is 0
    }
    if (v.discountType === 'PERCENT') {
      let discount = subtotal * (Number(v.discountValue) / 100);
      if (v.maxDiscountAmount != null) {
        discount = Math.min(discount, Number(v.maxDiscountAmount));
      }
      return discount;
    } else {
      return Math.min(Number(v.discountValue), subtotal);
    }
  }, []);

  // Helper: Calculate potential discount amount (as if eligible)
  const getPotentialDiscount = useCallback((v, subtotal) => {
    if (v.discountType === 'PERCENT') {
      let discount = subtotal * (Number(v.discountValue) / 100);
      if (v.maxDiscountAmount != null) {
        discount = Math.min(discount, Number(v.maxDiscountAmount));
      }
      return discount;
    } else {
      return Number(v.discountValue);
    }
  }, []);

  // Filter and Sort vouchers list
  const processedVouchers = useMemo(() => {
    const now = new Date();
    
    return vouchers
      .filter((v) => {
        // 1. Exclude expired vouchers
        const isExpired = v.endAt && new Date(v.endAt) < now;
        
        // 2. Exclude depleted vouchers (remaining usage <= 0)
        const remainingUsage = v.usageLimit != null && v.usedCount != null
          ? v.usageLimit - v.usedCount
          : 1;
        
        return !isExpired && remainingUsage > 0;
      })
      .sort((a, b) => {
        const discountA = getActualDiscount(a, subtotal);
        const discountB = getActualDiscount(b, subtotal);
        
        if (discountB !== discountA) {
          return discountB - discountA; // Sort by actual discount (highest first)
        }
        
        // If actual discounts are equal, sort by potential discount value
        const potA = getPotentialDiscount(a, subtotal);
        const potB = getPotentialDiscount(b, subtotal);
        return potB - potA;
      });
  }, [vouchers, subtotal, getActualDiscount, getPotentialDiscount]);

  // Reset slider index when list changes or visibility changes
  useEffect(() => {
    setStartIndex(0);
  }, [processedVouchers.length, showList]);

  const handleApply = async () => {
    setError('');
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { setError('Vui lòng nhập mã voucher.'); return; }

    setApplying(true);
    try {
      const voucher = await voucherService.validateVoucher(trimmed, subtotal);
      
      if (voucher.minOrderAmount != null && subtotal != null && subtotal < voucher.minOrderAmount) {
        setError(`Đơn hàng phải có giá trị tối thiểu ${Number(voucher.minOrderAmount).toLocaleString('vi-VN')}đ để sử dụng voucher này.`);
        setApplying(false);
        return;
      }

      setCode('');
      setShowList(false);
      onApply?.(voucher);
    } catch (e) {
      const msg = e.response?.data?.message
        || e.response?.data?.error
        || e.response?.data?.details
        || 'Mã voucher không hợp lệ hoặc đã hết hạn.';
      setError(msg);
    } finally {
      setApplying(false);
    }
  };

  const handlePickVoucher = (v) => {
    if (v.minOrderAmount != null && subtotal != null && subtotal < v.minOrderAmount) {
      setError(`Đơn hàng phải có giá trị tối thiểu ${Number(v.minOrderAmount).toLocaleString('vi-VN')}đ để sử dụng voucher này.`);
      return;
    }
    setCode('');
    setError('');
    onApply?.(v);
  };

  // Slider navigation
  const nextSlide = () => {
    if (startIndex + 4 < processedVouchers.length) {
      setStartIndex((prev) => prev + 1);
    }
  };

  const prevSlide = () => {
    if (startIndex > 0) {
      setStartIndex((prev) => prev - 1);
    }
  };

  const visibleVouchers = useMemo(() => {
    return processedVouchers.slice(startIndex, startIndex + 4);
  }, [processedVouchers, startIndex]);

  return (
    <div className="bg-white border border-gray-100 rounded-3xl shadow-xl overflow-hidden p-6 space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5 text-base font-bold text-gray-800">
          <Ticket className="w-5 h-5 text-red-600 animate-pulse" />
          Khuyến mãi & Mã giảm giá
        </div>
        <button
          type="button"
          onClick={() => { setShowList((v) => !v); fetchVouchers(); }}
          className="text-xs font-bold text-blue-600 hover:text-red-600 transition-colors bg-transparent border-none cursor-pointer p-0"
        >
          {showList ? 'Ẩn danh sách' : 'Xem tất cả voucher'}
        </button>
      </div>

      {/* ── Voucher Slider Row ── */}
      {showList && (
        <div className="pt-2 pb-4">
          {loading ? (
            <div className="flex gap-4 overflow-hidden py-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="w-full max-w-[200px] h-[110px] bg-gray-100 rounded-2xl animate-pulse flex-shrink-0"></div>
              ))}
            </div>
          ) : processedVouchers.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm flex flex-col items-center justify-center gap-2">
              <AlertCircle className="w-8 h-8 text-gray-300" />
              Không có voucher khả dụng cho đơn hàng của bạn.
            </div>
          ) : (
            <div className="relative flex items-center px-4">
              {/* Left Arrow Button */}
              {processedVouchers.length > 4 && (
                <button
                  type="button"
                  onClick={prevSlide}
                  disabled={startIndex === 0}
                  className={`absolute left-0 z-20 p-1.5 rounded-full bg-white shadow-lg border border-gray-100 hover:bg-gray-50 active:scale-95 transition-all ${
                    startIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-100 cursor-pointer'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4 text-gray-700" />
                </button>
              )}

              {/* Slider Row container */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 w-full transition-all duration-300">
                {visibleVouchers.map((v) => (
                  <VoucherCard
                    key={v.id || v.code}
                    voucher={v}
                    subtotal={subtotal}
                    isApplied={applied && applied.code === v.code}
                    onApply={handlePickVoucher}
                    compact={true}
                  />
                ))}
              </div>

              {/* Right Arrow Button */}
              {processedVouchers.length > 4 && (
                <button
                  type="button"
                  onClick={nextSlide}
                  disabled={startIndex + 4 >= processedVouchers.length}
                  className={`absolute right-0 z-20 p-1.5 rounded-full bg-white shadow-lg border border-gray-100 hover:bg-gray-50 active:scale-95 transition-all ${
                    startIndex + 4 >= processedVouchers.length ? 'opacity-30 cursor-not-allowed' : 'opacity-100 cursor-pointer'
                  }`}
                >
                  <ChevronRight className="w-4 h-4 text-gray-700" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Applied badge ── */}
      {applied && (
        <div className="flex items-center gap-2.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded-2xl px-4 py-2.5">
          <svg className="w-4 h-4 text-green-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
          <div>
            Đã áp dụng mã: <span className="font-mono font-bold text-green-800">{applied.code}</span>
            <span className="text-green-600 ml-1.5">
              ({applied.discountType === 'PERCENT' ? `Giảm ${applied.discountValue}%` : `Giảm ${Number(applied.discountValue).toLocaleString('vi-VN')}đ`})
            </span>
          </div>
          <button
            type="button"
            onClick={() => { onApply?.(null); }}
            className="ml-auto text-xs font-bold text-gray-400 hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer"
          >
            Gỡ bỏ
          </button>
        </div>
      )}

      {/* ── Input row ── */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          placeholder="Nhập mã voucher giảm giá"
          className="flex-1 h-10 border border-gray-200 rounded-xl px-4 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all shadow-inner"
        />
        <button
          type="button"
          onClick={handleApply}
          disabled={applying}
          className="h-10 px-6 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 active:bg-red-800 active:scale-[0.98] transition-all whitespace-nowrap cursor-pointer border-none disabled:opacity-50 shadow-md shadow-red-100"
        >
          {applying ? 'Đang áp dụng...' : 'Áp dụng'}
        </button>
      </div>

      {/* ── Error message ── */}
      {error && (
        <p className="text-xs font-medium text-red-500 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}
    </div>
  );
};

export default VoucherSection;
