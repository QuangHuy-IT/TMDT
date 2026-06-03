import React from 'react';
import { Link } from 'react-router-dom';
import { getProductThumbnail } from '../../utils/catalog';
import { getSafeProductSlug } from '../../utils/slug';

// ─── CartItem ─────────────────────────────────────────────────────────────────
// Props:
//   item        – cart item object
//   checked     – boolean, is this item selected
//   onToggle    – (checked: boolean) => void
//   onQtyChange – (newQty: number) => void
//   onRemove    – () => void
// ─────────────────────────────────────────────────────────────────────────────

const CartItem = ({ item, checked, onToggle, onQtyChange, onRemove }) => {
  const thumbnail = item.thumbnailUrl
    || item.thumbnail
    || item.imageUrl
    || getProductThumbnail(item)
    || 'https://picsum.photos/80';
  const subtotal  = item.price * item.quantity;
  const productSlug = getSafeProductSlug(
    item.variantSlug,
    item.selectedVariant?.slug,
    item.slug,
    item.productSlug,
  );

  const variantParts = [
    item.ram,
    item.storage,
    item.color || item.selectedColor?.name,
  ].filter((part) => part && String(part).trim());
  const variantLabel = variantParts.join(' · ');

  const availableStock = Number(item.stock ?? item.quantityOnHand ?? 0);
  const isOutOfStock = availableStock <= 0;
  
  const maxStock = React.useMemo(() => {
    let cap = Math.min(99, Math.max(0, availableStock));
    if (item.isFlashSale) {
      const fsQty = Number(item.flashSaleQuantity || 0);
      const fsSold = Number(item.flashSaleSoldQuantity || 0);
      const remainingFs = fsQty - fsSold;
      if (remainingFs > 0) {
        const limit = Number(item.flashSaleLimitPerUser || item.limitPerUser || 1);
        cap = Math.min(cap, remainingFs, limit);
      }
    }
    return cap;
  }, [availableStock, item]);

  const handleQty = (delta) => {
    const next = item.quantity + delta;
    if (next < 1) return;
    if (maxStock > 0 && next > maxStock) return;
    onQtyChange(next);
  };

  return (
    <div
      className={`
        grid items-center gap-3 px-5 py-4 border-b border-gray-100
        last:border-b-0 transition-colors duration-150
        ${checked ? 'bg-red-50/40' : 'hover:bg-gray-50'}
      `}
      style={{ gridTemplateColumns: '44px 1fr 130px 138px 120px 80px' }}
    >
      {/* ── Checkbox ── */}
      <div className="flex justify-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onToggle(e.target.checked)}
          className="w-[17px] h-[17px] rounded accent-red-600 cursor-pointer flex-shrink-0"
        />
      </div>

      {/* ── Product info ── */}
      <div className="flex items-center gap-3 min-w-0">
        {productSlug ? (
        <Link to={`/products/${productSlug}`} className="flex-shrink-0">
          <img
            src={thumbnail}
            alt={item.name}
            className="w-[76px] h-[76px] object-contain rounded-lg border border-gray-200
                       bg-gray-50 p-1 hover:border-red-300 transition-colors"
            onError={(e) => { e.target.src = 'https://picsum.photos/80'; }}
          />
        </Link>
        ) : (
          <img
            src={thumbnail}
            alt={item.name}
            className="w-[76px] h-[76px] object-contain rounded-lg border border-gray-200 bg-gray-50 p-1"
            onError={(e) => { e.target.src = 'https://picsum.photos/80'; }}
          />
        )}
        <div className="min-w-0">
          {productSlug ? (
          <Link to={`/products/${productSlug}`}>
            <p className="text-[13.5px] text-gray-800 leading-[1.45] line-clamp-2
                          hover:text-red-500 transition-colors font-medium">
              {item.name}
            </p>
          </Link>
          ) : (
            <p className="text-[13.5px] text-gray-800 leading-[1.45] line-clamp-2 font-medium">
              {item.name}
            </p>
          )}
          <p className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold mt-1">
            {item.brand}
          </p>
          {variantLabel && (
            <span className="inline-block mt-1.5 text-[11px] text-gray-500
                             bg-gray-100 border border-gray-200 rounded px-2 py-0.5">
              {variantLabel}
            </span>
          )}
        </div>
      </div>

      {/* ── Unit price ── */}
      <div className="text-center flex flex-col items-center">
        {item.originalPrice > 0 && item.originalPrice !== item.price && (
          <span className="text-[12px] text-gray-400 line-through">
            {item.originalPrice.toLocaleString('vi-VN')}₫
          </span>
        )}
        <span className="text-[14px] text-gray-600">
          {item.price.toLocaleString('vi-VN')}₫
        </span>
      </div>

      {/* ── Quantity control ── */}
      <div className="flex flex-col items-center gap-1">
        <div className={`flex items-center border rounded-md overflow-hidden ${isOutOfStock ? 'border-gray-200 opacity-60' : 'border-gray-300'}`}>
          <button
            type="button"
            onClick={() => handleQty(-1)}
            disabled={isOutOfStock || item.quantity <= 1}
            className="w-8 h-8 flex items-center justify-center text-gray-500 bg-white
                       hover:bg-gray-100 hover:text-red-500 transition-colors
                       disabled:opacity-30 disabled:cursor-not-allowed text-lg select-none"
          >
            −
          </button>
          <input
            type="number"
            value={item.quantity}
            min={1}
            max={maxStock || 99}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (isNaN(v) || v < 1) return;
              const cap = maxStock > 0 ? maxStock : 99;
              if (v > cap) onQtyChange(cap);
              else onQtyChange(v);
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
            disabled={isOutOfStock || (maxStock > 0 && item.quantity >= maxStock)}
            className="w-8 h-8 flex items-center justify-center text-gray-500 bg-white
                       hover:bg-gray-100 hover:text-red-500 transition-colors
                       disabled:opacity-30 disabled:cursor-not-allowed text-lg select-none"
          >
            +
          </button>
        </div>
        {isOutOfStock && (
          <span className="text-[11px] font-semibold text-red-500">Hết hàng</span>
        )}
        {!isOutOfStock && maxStock > 0 && item.quantity >= maxStock && (
          <span className="text-[11px] text-gray-500">Đã đạt tối đa ({maxStock})</span>
        )}
      </div>

      {/* ── Subtotal ── */}
      <div className="text-center">
        <span className="text-[14px] font-semibold text-red-600">
          {subtotal.toLocaleString('vi-VN')}₫
        </span>
      </div>

      {/* ── Remove ── */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onRemove}
          className="text-[13px] text-gray-400 hover:text-red-500
                     transition-colors bg-transparent border-none cursor-pointer p-1"
        >
          Xóa
        </button>
      </div>
    </div>
  );
};

export default CartItem;
