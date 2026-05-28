import React, { useState } from 'react';
import { getProductThumbnail } from '../../utils/catalog';

const fmt = (n) => n.toLocaleString('vi-VN') + '₫';

export const OrderSummary = ({
  cart,
  subtotal,
  shippingFee,
  discountAmount,
  total,
  voucherCode,
  fmt: fmtProp,
}) => {
  const [expanded, setExpanded] = useState(false);
  const fmtFn = fmtProp || fmt;

  const DISPLAY_LIMIT = 5;
  const hasMore = cart.length > DISPLAY_LIMIT;
  const visibleItems = expanded ? cart : cart.slice(0, DISPLAY_LIMIT);

  return (
    <div className="bg-gray-900 text-white p-8 rounded-[40px] shadow-2xl sticky top-24">
      <h2 className="text-xl font-bold mb-8 border-b border-gray-800 pb-4">
        Đơn hàng của bạn
      </h2>

      {/* Cart items */}
      <div className="mb-8 space-y-3">
        {visibleItems.map(item => {
          const originalPrice = item.originalPrice || 0;
          const thumbnail = item.thumbnailUrl
            || item.thumbnail
            || item.imageUrl
            || getProductThumbnail(item)
            || 'https://picsum.photos/80';

          return (
            <div
              key={item.id || item._id}
              className="flex gap-3 p-3 bg-gray-800 rounded-2xl"
            >
              {/* Image */}
              <div className="relative w-16 h-16 flex-shrink-0">
                <img
                  src={thumbnail}
                  alt=""
                  className="w-full h-full object-contain bg-white rounded-xl p-1"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                {/* Quantity badge */}
                <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold text-white border-2 border-gray-800">
                  {item.quantity}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <p className="text-sm font-semibold line-clamp-2 leading-tight">{item.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  {originalPrice > 0 && originalPrice !== item.price && (
                    <span className="text-xs text-gray-400 line-through decoration-gray-500">{fmtFn(originalPrice)}</span>
                  )}
                  <span className={`text-sm font-bold ${originalPrice > 0 && originalPrice !== item.price ? 'text-red-400' : 'text-white'}`}>
                    {fmtFn(item.price)}
                  </span>
                </div>
              </div>

              {/* Subtotal */}
              <div className="flex flex-col justify-between items-end">
                <span className="text-xs text-gray-400 opacity-60">x{item.quantity}</span>
                <span className="text-sm font-bold text-white">{fmtFn(item.price * item.quantity)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expand / Collapse */}
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(prev => !prev)}
          className="w-full mb-6 py-2.5 rounded-xl border border-gray-700 text-sm font-bold text-gray-400 hover:text-white hover:border-gray-500 transition-all"
        >
          {expanded
            ? '▲ Thu gọn'
            : `▼ Xem thêm ${cart.length - DISPLAY_LIMIT} sản phẩm`}
        </button>
      )}

      {/* Totals */}
      <div className="space-y-4 text-sm border-t border-gray-800 pt-6">
        <div className="flex justify-between opacity-70">
          <span>Tạm tính ({cart.reduce((s, i) => s + i.quantity, 0)} sản phẩm)</span>
          <span>{fmtFn(subtotal)}</span>
        </div>
        {voucherCode && (
          <div className="flex justify-between text-green-400">
            <span>Giảm giá ({voucherCode})</span>
            <span>−{fmtFn(discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between opacity-70">
          <span>Phí vận chuyển</span>
          <span>{shippingFee === 0 ? 'Miễn phí' : fmtFn(shippingFee)}</span>
        </div>
      </div>

      {/* Grand total */}
      <div className="flex justify-between items-center mt-8 mb-10">
        <span className="text-lg font-bold">Tổng thanh toán</span>
        <span className="text-3xl font-black text-red-500">{fmtFn(total)}</span>
      </div>
    </div>
  );
};
