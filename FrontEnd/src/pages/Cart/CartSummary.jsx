import React from 'react';

// ─── CartSummary ──────────────────────────────────────────────────────────────
// Thanh tổng kết cố định ở cuối trang.
// Props:
//   allChecked      – boolean
//   totalItems      – tổng số item trong cart (để hiển thị "Chọn tất cả (N)")
//   selectedQty     – số lượng sản phẩm đã chọn (tính theo qty, không phải line)
//   grandTotal      – tổng tiền các sản phẩm đã chọn
//   onToggleAll     – (checked: boolean) => void
//   onDeleteSelected– () => void
//   onCheckout      – () => void
// ─────────────────────────────────────────────────────────────────────────────

const fmt = (n) => n.toLocaleString('vi-VN') + '₫';

const CartSummary = ({
  allChecked,
  totalItems,
  selectedQty,
  grandTotal,
  voucherDiscount,
  finalTotal,
  onToggleAll,
  onDeleteSelected,
  onCheckout,
}) => (
  <div
    className="
      sticky bottom-0 z-30
      bg-white border-t border-gray-200
      shadow-[0_-2px_12px_rgba(0,0,0,0.08)]
    "
  >
    <div className="max-w-[980px] mx-auto px-4 py-3.5 flex items-center justify-between flex-wrap gap-3">

      {/* ── Left ── */}
      <div className="flex items-center gap-5 flex-wrap">
        {/* Select-all checkbox */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={(e) => onToggleAll(e.target.checked)}
            className="w-[17px] h-[17px] rounded accent-[#ee4d2d] cursor-pointer"
          />
          <span className="text-[13.5px] text-gray-700">
            Chọn tất cả
            <span className="text-gray-400 ml-1">({totalItems})</span>
          </span>
        </label>

        {/* Delete selected */}
        <button
          type="button"
          onClick={onDeleteSelected}
          className="text-[13.5px] text-gray-500 hover:text-[#ee4d2d]
                     transition-colors bg-transparent border-none cursor-pointer p-0"
        >
          Xóa
        </button>
      </div>

      {/* ── Right ── */}
      <div className="flex items-center gap-6">
        {/* Total info */}
        <div className="text-right">
          <p className="text-[13px] text-gray-500 leading-none mb-1">
            Tổng thanh toán
            {selectedQty > 0 && (
              <span className="text-gray-600 font-medium"> ({selectedQty} sản phẩm)</span>
            )}
            :
          </p>
          <p className="text-[22px] font-semibold text-[#ee4d2d] leading-none">
            {fmt(finalTotal)}
          </p>
        </div>

        {/* Checkout CTA */}
        <button
          type="button"
          onClick={onCheckout}
          className="
            h-[44px] px-9
            bg-[#ee4d2d] text-white text-[15px] font-medium
            rounded hover:bg-[#d73211] active:bg-[#c02b0e]
            active:scale-[0.98] transition-all
            whitespace-nowrap cursor-pointer border-none
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          disabled={selectedQty === 0}
        >
          Mua hàng
        </button>
      </div>

    </div>
  </div>
);

export default CartSummary;