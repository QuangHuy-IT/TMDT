import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Zap, Flame, TrendingUp } from 'lucide-react';
import { cn } from '../../utils/cn';
import ProgressBar from './ProgressBar';

const FlashSaleProductCard = ({ product, className }) => {
  const navigate = useNavigate();
  const [isFav, setIsFav] = React.useState(false);

  const productId = product.id || product._id;
  const productSlug = product.slug || product.productSlug || productId;
  const name = product.name || product.productName || 'Sản phẩm';
  const thumbnail =
    product.thumbnail ||
    product.imageUrl ||
    (product.images?.length > 0
      ? typeof product.images[0] === 'string'
        ? product.images[0]
        : product.images[0].imageUrl
      : '/placeholder-product.png');

  const flashPrice = product.flashPrice || product.price || 0;
  const originalPrice = product.originalPrice || 0;
  const discountPercent = product.discountPercent || product.sale || 0;
  const quantity = product.quantity || 1;
  const soldQuantity = product.soldQuantity || 0;
  const remaining = Math.max(0, quantity - soldQuantity);
  const soldPercent = quantity > 0 ? Math.round((soldQuantity / quantity) * 100) : 0;

  // Badge logic
  const isLowStock = remaining > 0 && remaining <= 10;
  const isAlmostSoldOut = remaining > 0 && remaining <= 5;
  const isSoldOut = remaining <= 0;
  const isHot = soldPercent >= 60 && !isSoldOut;

  const handleCardClick = () => {
    if (!isSoldOut) navigate(`/products/${productSlug}`);
  };

  const handleFavClick = (e) => {
    e.stopPropagation();
    setIsFav(!isFav);
  };

  const formatPrice = (p) => Number(p).toLocaleString('vi-VN');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={!isSoldOut ? { y: -6, scale: 1.02 } : {}}
      onClick={handleCardClick}
      className={cn(
        'group relative flex flex-col bg-white rounded-2xl overflow-hidden cursor-pointer select-none transition-all duration-300',
        isSoldOut
          ? 'opacity-60 cursor-not-allowed'
          : 'shadow-md shadow-black/5 hover:shadow-xl hover:shadow-red-300/40 border border-transparent hover:border-red-300/60',
        className
      )}
    >
      {/* ===== TOP BADGES ===== */}
      <div className="absolute top-2.5 left-2.5 z-20 flex flex-col gap-1.5">
        {/* Discount badge */}
        {discountPercent > 0 && !isSoldOut && (
          <span className="bg-gradient-to-br from-red-600 to-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-lg flex items-center gap-1 animate-pulse-subtle">
            <Zap size={9} className="fill-white" />
            -{discountPercent}%
          </span>
        )}

        {/* Hot badge */}
        {isHot && !isSoldOut && (
          <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow flex items-center gap-0.5 animate-flash-badge">
            <Flame size={9} className="fill-white" />
            Bán chạy
          </span>
        )}

        {/* Almost sold out */}
        {isAlmostSoldOut && !isSoldOut && (
          <span className="bg-gradient-to-r from-yellow-400 to-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow flex items-center gap-0.5 animate-fire-pulse">
            <Flame size={9} className="fill-white" />
            Sắp cháy
          </span>
        )}

        {/* Low stock */}
        {isLowStock && !isAlmostSoldOut && !isSoldOut && (
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow flex items-center gap-0.5">
            <TrendingUp size={9} className="fill-white" />
            Còn {remaining}
          </span>
        )}

        {/* Sold out */}
        {isSoldOut && (
          <span className="bg-slate-400 text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow flex items-center gap-0.5">
            Hết hàng
          </span>
        )}
      </div>

      {/* Favorite Button */}
      <button
        onClick={handleFavClick}
        className={cn(
          'absolute z-20 p-2 rounded-full backdrop-blur-sm transition-all duration-200 active:scale-90',
          isSoldOut
            ? 'top-2.5 right-2.5 bg-slate-100/80 text-slate-400 cursor-not-allowed'
            : 'top-2.5 right-2.5 bg-white/90 text-slate-400 hover:text-red-500 hover:bg-white shadow-sm hover:shadow-md'
        )}
        disabled={isSoldOut}
      >
        <Heart size={16} className={isFav ? 'fill-red-500 stroke-red-500' : ''} />
      </button>

      {/* ===== IMAGE ===== */}
      <div className="relative overflow-hidden bg-gradient-to-br from-red-50/80 via-slate-50 to-orange-50/60 aspect-square">
        <img
          src={thumbnail}
          alt={name}
          className={cn(
            'w-full h-full object-contain transition-transform duration-500',
            !isSoldOut && 'group-hover:scale-110'
          )}
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://placehold.co/400x400/e74c3c/white?text=Flash+Sale';
          }}
        />

        {/* Gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/80 to-transparent pointer-events-none" />

        {/* Sold out overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="bg-slate-700 text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
              Hết hàng
            </span>
          </div>
        )}
      </div>

      {/* ===== PRODUCT INFO ===== */}
      <div className="flex flex-col flex-grow p-3.5 gap-2">

        {/* Product name */}
        <h3 className="font-black text-[11px] leading-snug text-slate-800 line-clamp-2 min-h-[2em] group-hover:text-red-600 transition-colors duration-200">
          {name}
        </h3>

        {/* Price section */}
        <div className="flex flex-col gap-0.5 mt-auto">
          {/* Sale price */}
          <div className="flex items-end gap-2">
            <span className="text-base font-black leading-none bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent drop-shadow-sm">
              {formatPrice(flashPrice)}đ
            </span>
          </div>

          {/* Original price */}
          {originalPrice > flashPrice && (
            <span className="text-[10px] font-bold text-slate-400 line-through">
              {formatPrice(originalPrice)}đ
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <ProgressBar current={soldQuantity} total={quantity} compact />
      </div>

      {/* ===== BUY BUTTON ===== */}
      {!isSoldOut && (
        <div className="px-3.5 pb-3.5 -mt-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/products/${productSlug}`);
            }}
            className="w-full py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-orange-500 text-white text-[11px] font-black uppercase tracking-wider rounded-xl shadow-md shadow-red-500/30 hover:shadow-lg hover:shadow-red-500/50 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5"
          >
            <Zap size={12} className="fill-white" />
            Mua ngay
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default FlashSaleProductCard;
