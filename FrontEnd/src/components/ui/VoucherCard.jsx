import React, { useState } from 'react';
import { Ticket, Copy, Check, Clock, ShoppingBag, ShieldAlert } from 'lucide-react';

const VoucherCard = ({ voucher, onApply, isApplied, subtotal, compact = false }) => {
  const [copied, setCopied] = useState(false);

  if (!voucher) return null;

  const {
    code,
    discountType,
    discountValue,
    maxDiscountAmount,
    minOrderAmount,
    endAt,
    usageLimit,
    usedCount
  } = voucher;

  const remainingUsage = usageLimit != null && usedCount != null ? usageLimit - usedCount : null;
  const isEligible = minOrderAmount == null || subtotal == null || subtotal >= minOrderAmount;

  const formatCurrency = (val) => {
    return val != null ? Number(val).toLocaleString('vi-VN') + 'đ' : '';
  };

  const formatShortDiscount = (type, val) => {
    if (type === 'PERCENT') {
      return `${val}%`;
    }
    const num = Number(val);
    if (num >= 1000000) {
      return `${num / 1000000}M`;
    }
    if (num >= 1000) {
      return `${num / 1000}k`;
    }
    return num.toString();
  };

  const formatExpiry = (dateStr) => {
    if (!dateStr) return 'Không hết hạn';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes} ${day}/${month}/${year}`;
  };

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Determine card styling based on applicability
  const gradientClass = isEligible
    ? 'from-red-500 to-rose-600'
    : 'from-gray-400 to-gray-500';

  const borderClass = isEligible
    ? 'border-red-100 hover:border-red-300'
    : 'border-gray-200 opacity-75';

  return (
    <div
      className={`relative flex bg-white border rounded-2xl overflow-hidden transition-all duration-300 shadow-md hover:shadow-lg ${borderClass} ${
        compact ? 'max-w-md w-full min-h-[110px]' : 'w-full min-h-[140px]'
      }`}
    >
      {/* Ticket Left Part - Visual Indicator */}
      <div
        className={`${
          compact ? 'w-[80px] px-1' : 'w-28 px-2'
        } flex-shrink-0 bg-gradient-to-br ${gradientClass} flex flex-col items-center justify-center text-white relative text-center`}
      >
        {/* Ticket notch cutouts */}
        <div className="absolute top-0 right-0 -mr-1.5 -mt-1.5 w-3 h-3 rounded-full bg-white border border-transparent shadow-[inset_0_-1px_3px_rgba(0,0,0,0.06)] z-10"></div>
        <div className="absolute bottom-0 right-0 -mr-1.5 -mb-1.5 w-3 h-3 rounded-full bg-white border border-transparent shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)] z-10"></div>

        <Ticket className={`${compact ? 'w-4 h-4 mb-0.5' : 'w-7 h-7 mb-2'} animate-pulse`} />
        <div className={`${compact ? 'text-[10px]' : 'text-[15px]'} font-black uppercase tracking-wide leading-none`}>
          {discountType === 'PERCENT' ? 'Voucher' : 'VND'}
        </div>
        <div className={`font-black ${compact ? 'text-sm' : 'text-xl'} leading-tight mt-0.5`}>
          {compact ? formatShortDiscount(discountType, discountValue) : (discountType === 'PERCENT' ? `${discountValue}%` : formatCurrency(discountValue).replace('đ', ''))}
        </div>
        {discountType === 'FIXED' && <span className={`${compact ? 'text-[8px]' : 'text-[10px]'} font-bold`}>VNĐ</span>}
      </div>

      {/* Dotted Divider */}
      <div className="w-[1px] relative flex flex-col justify-between items-center py-1">
        <div className="w-[1px] h-full border-r border-dashed border-gray-300"></div>
      </div>

      {/* Ticket Right Part - Information */}
      <div className={`flex-grow ${compact ? 'p-2.5' : 'p-4'} flex flex-col justify-between bg-white relative overflow-hidden`}>
        <div>
          {/* Code and Copy Button */}
          <div className="flex items-center justify-between mb-1">
            <span className={`font-mono font-black ${compact ? 'text-[10px] px-1.5' : 'text-[13px] px-2'} bg-red-50 text-red-600 py-0.5 rounded border border-red-100 uppercase tracking-wider truncate max-w-[120px]`} title={code}>
              {code}
            </span>
            <button
              onClick={handleCopy}
              className="p-0.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-50 transition-colors"
              title="Sao chép mã"
            >
              {copied ? <Check className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-green-500`} /> : <Copy className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
            </button>
          </div>

          {/* Discount Description */}
          <h5 className={`font-bold ${compact ? 'text-[12px] mb-0.5' : 'text-[14px] mb-1.5'} text-gray-800 leading-snug`}>
            Giảm {discountType === 'PERCENT' ? `${discountValue}%` : formatCurrency(discountValue)}
          </h5>

          {/* Min Order & Max Discount */}
          <div className="mt-0.5 space-y-0.5">
            {minOrderAmount != null && (
              <div className={`flex items-center gap-1 ${compact ? 'text-[10px]' : 'text-[11.5px]'} text-gray-500`}>
                <ShoppingBag className={`${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-gray-400 flex-shrink-0`} />
                <span className="truncate">Đơn tối thiểu: <span className="font-bold text-gray-700">{formatCurrency(minOrderAmount)}</span></span>
              </div>
            )}
            {discountType === 'PERCENT' && maxDiscountAmount != null && (
              <div className={`flex items-center gap-1 ${compact ? 'text-[10px]' : 'text-[11.5px]'} text-gray-500`}>
                <div className={`${compact ? 'w-2.5 h-2.5 text-[8px]' : 'w-3 h-3 text-[10px]'} flex items-center justify-center font-extrabold text-gray-400 bg-gray-100 rounded-full flex-shrink-0`}>đ</div>
                <span className="truncate">Giảm tối đa: <span className="font-bold text-gray-700">{formatCurrency(maxDiscountAmount)}</span></span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Details: Expiry, Usage, Apply Button */}
        <div className={`mt-2 flex items-end justify-between ${compact ? 'pt-1.5 border-t border-gray-50' : 'pt-2 border-t border-gray-100'}`}>
          <div className="space-y-0.5 min-w-0">
            <div className={`flex items-center gap-0.5 ${compact ? 'text-[9px]' : 'text-[10.5px]'} text-gray-400`}>
              <Clock className={`${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} flex-shrink-0`} />
              <span className="truncate">HSD: {formatExpiry(endAt)}</span>
            </div>
            {remainingUsage !== null && (
              <div className={`${compact ? 'text-[9px]' : 'text-[10.5px]'} text-gray-400 truncate`}>
                Còn lại: <span className="font-bold text-gray-600">{remainingUsage} lượt</span>
              </div>
            )}
          </div>

          {onApply && (
            <button
              onClick={() => isEligible && onApply(voucher)}
              disabled={!isEligible}
              className={`px-2.5 py-1 rounded-lg ${compact ? 'text-[10px]' : 'text-[12px]'} font-black tracking-wide uppercase transition-all shadow-sm flex-shrink-0 ${
                isApplied
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : isEligible
                  ? 'bg-red-600 text-white hover:bg-red-700 active:scale-95'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isApplied ? 'Đã chọn' : 'Áp dụng'}
            </button>
          )}
        </div>

        {/* Ineligibility Warning Tooltip */}
        {!isEligible && subtotal != null && (
          <div className="absolute top-2 right-2 text-yellow-500 animate-bounce" title="Đơn hàng chưa đủ giá trị tối thiểu">
            <ShieldAlert className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
    </div>
  );
};

export default VoucherCard;
