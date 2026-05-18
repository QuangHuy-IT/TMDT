import React from 'react';
import { Link } from 'react-router-dom';

// ─── CartItem ─────────────────────────────────────────────────────────────────
// Props:
//   item        – cart item object
//   checked     – boolean, is this item selected
//   onToggle    – (checked: boolean) => void
//   onQtyChange – (newQty: number) => void
//   onRemove    – () => void
// ─────────────────────────────────────────────────────────────────────────────

const CartItem = ({ item, checked, onToggle, onQtyChange, onRemove }) => {
  const thumbnail = item.images?.[0] || item.image || 'https://picsum.photos/80';
  const subtotal  = item.price * item.quantity;
  // Ưu tiên slug, fallback về _id hoặc id
  const productSlug = item.slug || item._id || item.id;

  const handleQty = (delta) => {
    const next = item.quantity + delta;
    if (next < 1 || next > 99) return;
    onQtyChange(next);
  };

  return (
    <div
      className={`
        grid items-center gap-3 px-5 py-4 border-b border-gray-100
        last:border-b-0 transition-colors duration-150
        hover:bg-orange-50/40
        ${checked ? 'bg-orange-50/30' : 'bg-white'}
      `}
      style={{ gridTemplateColumns: '44px 1fr 130px 138px 120px 80px' }}
    >
      {/* ── Checkbox ── */}
      <div className="flex justify-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onToggle(e.target.checked)}
          className="w-[17px] h-[17px] rounded accent-[#ee4d2d] cursor-pointer flex-shrink-0"
        />
      </div>

      {/* ── Product info ── */}
      <div className="flex items-center gap-3 min-w-0">
        <Link to={`/products/${productSlug}`} className="flex-shrink-0">
          <img
            src={thumbnail}
            alt={item.name}
            className="w-[76px] h-[76px] object-contain rounded-lg border border-gray-200 bg-gray-50 p-1
                       hover:border-orange-300 transition-colors"
            onError={(e) => { e.target.src = 'https://picsum.photos/80'; }}
          />
        </Link>
        <div className="min-w-0">
          <Link to={`/products/${productSlug}`}>
            <p className="text-[13.5px] text-gray-800 leading-[1.45] line-clamp-2
                          hover:text-[#ee4d2d] transition-colors font-medium">
              {item.name}
            </p>
          </Link>
          <p className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold mt-1">
            {item.brand}
          </p>
          {item.selectedStorage && (
            <span className="inline-block mt-1.5 text-[11px] text-gray-500
                             bg-gray-100 border border-gray-200 rounded px-2 py-0.5">
              {item.selectedStorage}
              {item.selectedColor?.name ? ` · ${item.selectedColor.name}` : ''}
            </span>
          )}
        </div>
      </div>

      {/* ── Unit price ── */}
      <div className="text-center">
        <span className="text-[14px] text-gray-600">
          {item.price.toLocaleString('vi-VN')}₫
        </span>
      </div>

      {/* ── Quantity control ── */}
      <div className="flex justify-center">
        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
          <button
            type="button"
            onClick={() => handleQty(-1)}
            disabled={item.quantity <= 1}
            className="w-8 h-8 flex items-center justify-center text-gray-500 bg-white
                       hover:bg-gray-100 hover:text-[#ee4d2d] transition-colors
                       disabled:opacity-30 disabled:cursor-not-allowed text-lg select-none"
          >
            −
          </button>
          <input
            type="number"
            value={item.quantity}
            min={1}
            max={99}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v) && v >= 1 && v <= 99) onQtyChange(v);
            }}
            className="w-10 h-8 border-x border-gray-300 text-center text-[13px]
                       text-gray-800 bg-white focus:outline-none
                       [appearance:textfield]
                       [&::-webkit-outer-spin-button]:appearance-none
                       [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={() => handleQty(1)}
            disabled={item.quantity >= 99}
            className="w-8 h-8 flex items-center justify-center text-gray-500 bg-white
                       hover:bg-gray-100 hover:text-[#ee4d2d] transition-colors
                       disabled:opacity-30 disabled:cursor-not-allowed text-lg select-none"
          >
            +
          </button>
        </div>
      </div>

      {/* ── Subtotal ── */}
      <div className="text-center">
        <span className="text-[14px] font-semibold text-[#ee4d2d]">
          {subtotal.toLocaleString('vi-VN')}₫
        </span>
      </div>

      {/* ── Remove ── */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onRemove}
          className="text-[13px] text-gray-400 hover:text-[#ee4d2d]
                     transition-colors bg-transparent border-none cursor-pointer p-1"
        >
          Xóa
        </button>
      </div>
    </div>
  );
};

export default CartItem;