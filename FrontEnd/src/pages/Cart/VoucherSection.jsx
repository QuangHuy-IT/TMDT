import React, { useState } from 'react';

// ─── VoucherSection ────────────────────────────────────────────────────────────
// Khu vực nhập / chọn mã voucher giảm giá.
// Props:
//   onApply – (code: string) => void   (tuỳ chọn, kết nối lên parent nếu cần)
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_CODES = ['SHOPEE10', 'GIAM50K', 'FREESHIP'];

const VoucherSection = ({ onApply }) => {
  const [code, setCode]         = useState('');
  const [applied, setApplied]   = useState('');
  const [error, setError]       = useState('');
  const [showList, setShowList] = useState(false);

  const handleApply = () => {
    setError('');
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { setError('Vui lòng nhập mã voucher.'); return; }
    if (!MOCK_CODES.includes(trimmed)) { setError('Mã không hợp lệ hoặc đã hết hạn.'); return; }
    setApplied(trimmed);
    setCode('');
    setShowList(false);
    onApply?.(trimmed);
  };

  const handlePickCode = (c) => {
    setCode(c);
    setShowList(false);
    setError('');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-sm">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 text-[13.5px] font-medium text-gray-700">
          {/* ticket icon */}
          <svg className="w-4 h-4 text-[#ee4d2d]" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2">
            <path d="M20 12V22H4V12" />
            <path d="M22 7H2v5h20V7z" />
            <path d="M12 22V7" />
            <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
            <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
          </svg>
          Shopee Voucher
        </div>
        <button
          type="button"
          onClick={() => setShowList((v) => !v)}
          className="text-[12.5px] text-blue-600 hover:text-[#ee4d2d] transition-colors
                     bg-transparent border-none cursor-pointer p-0"
        >
          {showList ? 'Ẩn danh sách' : 'Xem tất cả voucher'}
        </button>
      </div>

      {/* ── Mock voucher list ── */}
      {showList && (
        <div className="px-5 pt-3 pb-1 flex flex-wrap gap-2">
          {MOCK_CODES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => handlePickCode(c)}
              className="text-[12px] font-mono font-semibold text-[#ee4d2d]
                         border border-dashed border-[#ee4d2d] rounded px-3 py-1
                         hover:bg-orange-50 transition-colors cursor-pointer bg-transparent"
            >
              {c}
            </button>
          ))}
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
          Đã áp dụng mã: <span className="font-bold font-mono">{applied}</span>
          <button
            type="button"
            onClick={() => { setApplied(''); onApply?.(''); }}
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
          className="h-9 px-5 bg-[#ee4d2d] text-white text-[13px] font-medium rounded
                     hover:bg-[#d73211] active:bg-[#c02b0e] active:scale-[0.98]
                     transition-all whitespace-nowrap cursor-pointer border-none"
        >
          Áp dụng
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