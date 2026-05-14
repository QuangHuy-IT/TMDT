import React, { useState, useEffect, useCallback } from 'react';
import voucherService from '../../services/voucherService';

const fmt = (n) => n != null ? Number(n).toLocaleString('vi-VN') + 'đ' : '—';

const fmtCode = (v) => v.discountType === 'PERCENT'
  ? `Giảm ${v.discountValue}%`
  : `Giảm ${fmt(v.discountValue)}`;

const VoucherSection = ({ onApply }) => {
  const [code, setCode]         = useState('');
  const [applied, setApplied]   = useState(null);
  const [error, setError]       = useState('');
  const [showList, setShowList] = useState(false);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [applying, setApplying] = useState(false);

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

  useEffect(() => { fetchVouchers(); }, [fetchVouchers]);

  const handleApply = async () => {
    setError('');
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { setError('Vui lòng nhập mã voucher.'); return; }

    setApplying(true);
    try {
      const voucher = await voucherService.validateVoucher(trimmed);
      setApplied(voucher);
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
    setApplied(v);
    setCode(v.code);
    setShowList(false);
    setError('');
    onApply?.(v);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-sm">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 text-[13.5px] font-medium text-gray-700">
          <svg className="w-4 h-4 text-[#ee4d2d]" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2">
            <path d="M20 12V22H4V12" />
            <path d="M22 7H2v5h20V7z" />
            <path d="M12 22V7" />
            <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
            <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
          </svg>
          Mã giảm giá
        </div>
        <button
          type="button"
          onClick={() => { setShowList((v) => !v); fetchVouchers(); }}
          className="text-[12.5px] text-blue-600 hover:text-[#ee4d2d] transition-colors
                     bg-transparent border-none cursor-pointer p-0"
        >
          {showList ? 'Ẩn danh sách' : 'Xem tất cả voucher'}
        </button>
      </div>

      {/* ── Voucher list from API ── */}
      {showList && (
        <div className="px-5 pt-3 pb-1">
          {loading ? (
            <p className="text-[12px] text-gray-400 py-2">Đang tải...</p>
          ) : vouchers.length === 0 ? (
            <p className="text-[12px] text-gray-400 py-2">Không có voucher khả dụng.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {vouchers.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handlePickVoucher(v)}
                  className="text-[12px] font-mono font-semibold text-[#ee4d2d]
                             border border-dashed border-[#ee4d2d] rounded px-3 py-1
                             hover:bg-orange-50 transition-colors cursor-pointer bg-transparent"
                >
                  {v.code} — {fmtCode(v)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Applied badge ── */}
      {applied && (
        <div className="mx-5 mt-3 flex items-center gap-2 text-[12.5px] text-green-700
                        bg-green-50 border border-green-200 rounded px-3 py-2">
          <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1
              1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0
              001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
          Đã áp dụng: <span className="font-bold font-mono">{applied.code}</span>
          <span className="text-green-600 ml-1">({fmtCode(applied)})</span>
          <button
            type="button"
            onClick={() => { setApplied(null); onApply?.(null); }}
            className="ml-auto text-gray-400 hover:text-red-500 transition-colors
                       bg-transparent border-none cursor-pointer text-xs"
          >
            Xóa
          </button>
        </div>
      )}

      {/* ── Input row ── */}
      <div className="px-5 py-3.5 flex items-center gap-3">
        <input
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          placeholder="Nhập mã Voucher / Mã giảm giá"
          className="flex-1 h-9 border border-gray-300 rounded px-3 text-[13px]
                     text-gray-700 placeholder:text-gray-400
                     focus:outline-none focus:border-[#ee4d2d] transition-colors"
        />
        <button
          type="button"
          onClick={handleApply}
          disabled={applying}
          className="h-9 px-5 bg-[#ee4d2d] text-white text-[13px] font-medium rounded
                     hover:bg-[#d73211] active:bg-[#c02b0e] active:scale-[0.98]
                     transition-all whitespace-nowrap cursor-pointer border-none
                     disabled:opacity-50"
        >
          {applying ? '...' : 'Áp dụng'}
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <p className="px-5 pb-3 text-[12px] text-red-500">{error}</p>
      )}
    </div>
  );
};

export default VoucherSection;
