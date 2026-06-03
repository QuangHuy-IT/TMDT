import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Eye, Zap, Star } from 'lucide-react';
import { cn } from '../../utils/cn';
import { getSafeProductSlug } from '../../utils/slug';
import ProgressBar from '../flash-sale/ProgressBar';

export const ProductCard = ({ product, variant = 'default', className }) => {
  const navigate = useNavigate();
  const [isFav, setIsFav] = useState(false);

  const isFlashSale = variant === 'flash-sale';
  const isFlashSaleActive = (variant === 'flash-sale' || product.isFlashSale) && !(product.soldQuantity >= product.quantity);

  // === Shared mappings ===
  const selectedVariant = product.selectedVariant && typeof product.selectedVariant === 'object'
    ? product.selectedVariant
    : null;
  const variantSlug = getSafeProductSlug(selectedVariant?.slug, product.slug, product.productSlug);

  const variantSpec = product.variantName || '';
  const displayName = product.name || product.productName || 'Sản phẩm';
  const fullDisplayName = variantSpec ? `${displayName} ${variantSpec}` : displayName;

  // sale/discount percent — declared FIRST so originalPrice can reference it
  const sale = product.sale || product.discount || 0;

  // Price: backend sets product.price to DISCOUNTED price in toListDto.
  // selectedVariant.price = original (base) price always.
  // So we read product.price first (discounted), fall back only when no discount.
  const price = product.price
    ?? (selectedVariant?.price ?? 0);

  // Original price (before discount) — from backend OR computed
  const originalPrice = product.originalPrice
    ?? (sale > 0 && price > 0 ? Math.round(price * 100 / (100 - sale)) : price);

  // Thumbnail
  const productImages = Array.isArray(product.images)
    ? product.images.filter(img => img && typeof img === 'string' && img.trim())
    : [];
  const thumbnail =
    product.thumbnail ||
    product.thumbnailUrl ||
    (productImages.length > 0 ? productImages[0] : null) ||
    '/placeholder-product.png';

  // Flash sale specific
  const flashPrice = product.flashPrice || product.price || 0;
  const discountPercent = product.discountPercent || product.sale || product.discount || 0;
  const quantity = product.quantity || 1;
  const soldQuantity = product.soldQuantity || 0;

  const brandName = product.brand?.name || product.brandName || 'Mobile';
  const reviewCount = Number(product.reviewCount ?? product.totalReviews ?? 0);
  const ratingValue = Number(product.averageRating ?? product.rating ?? 0);
  const rating = reviewCount > 0 ? ratingValue : 0;

  // Has any discount (product discount, not flash sale)
  const hasDiscount = sale > 0;

  const handleCardClick = () => {
    if (variantSlug) {
      const url = selectedVariant?.id
        ? `/products/${variantSlug}?product_id=${selectedVariant.id}`
        : `/products/${variantSlug}`;
      navigate(url);
    }
  };

  const handleFavClick = (e) => {
    e.stopPropagation();
    setIsFav(!isFav);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={isFlashSale ? { y: -4 } : { y: -8 }}
      onClick={handleCardClick}
      className={cn(
        'group relative bg-white rounded-2xl overflow-hidden cursor-pointer select-none transition-all duration-300',
        'hover:shadow-xl flex flex-col',
        isFlashSale
          ? 'shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-red-200/40'
          : 'rounded-[2rem] p-5 border border-slate-100 hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)]',
        className
      )}
    >
      {/* ===== BADGES ===== */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        {isFlashSaleActive && discountPercent > 0 ? (
          <span className="bg-gradient-to-r from-red-600 to-red-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg flex items-center gap-1">
            <Zap size={10} className="fill-white" />
            -{discountPercent}%
          </span>
        ) : hasDiscount ? (
          <span className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg shadow-red-200 uppercase tracking-wider">
            -{sale}%
          </span>
        ) : null}
      </div>

      {/* Favorite Button */}
      <button
        onClick={handleFavClick}
        className={cn(
          'absolute z-10 p-2.5 rounded-2xl backdrop-blur-md transition-all active:scale-90',
          isFlashSale
            ? 'top-2 right-2 bg-white/90 text-slate-400 hover:text-red-500 shadow-sm'
            : 'top-4 right-4 bg-slate-50/80 text-slate-400 hover:text-red-500 hover:bg-white shadow-sm'
        )}
      >
        <Heart size={18} className={isFav ? 'fill-red-500 stroke-red-500' : ''} />
      </button>

      {/* ===== IMAGE ===== */}
      <div
        className={cn(
          'relative overflow-hidden bg-slate-50',
          isFlashSale ? 'aspect-square rounded-none' : 'aspect-square rounded-2xl mb-4'
        )}
      >
        <img
          src={thumbnail}
          alt={displayName}
          className={cn(
            'w-full h-full object-contain transition-transform duration-500',
            isFlashSale ? 'group-hover:scale-105' : 'group-hover:scale-110'
          )}
          loading="lazy"
          onError={(e) => {
            e.target.src = isFlashSale
              ? 'https://placehold.co/400x400/e74c3c/white?text=Flash+Sale'
              : 'https://placehold.co/400x400?text=No+Image';
          }}
        />

        {/* Hover overlay (default mode only) */}
        {!isFlashSale && (
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <Eye size={20} className="text-slate-900" />
            </div>
          </div>
        )}
      </div>

      {/* ===== PRODUCT INFO ===== */}
      <div className={cn('flex flex-col flex-grow', isFlashSale ? 'p-3' : '')}>

        {/* Brand & Rating (default mode only) */}
        {!isFlashSale && rating > 0 && (
          <div className="flex items-center gap-1 mb-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{brandName}</span>
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <div className="flex items-center gap-0.5 text-orange-400">
              <Star size={10} fill="currentColor" />
              <span className="text-[10px] font-bold text-slate-500">{rating.toFixed(1)}</span>
            </div>
          </div>
        )}

        {/* Product Name */}
        <h3
          className={cn(
            'font-bold leading-snug line-clamp-2 min-h-[2em] group-hover:transition-colors',
            isFlashSale
              ? 'text-slate-900 text-[11px] group-hover:text-red-600'
              : 'text-slate-900 text-sm md:text-base group-hover:text-blue-600'
          )}
        >
          {fullDisplayName}
        </h3>

        {/* Price */}
        <div className={cn('flex flex-col', isFlashSaleActive ? 'mt-auto pt-2' : 'mt-auto pt-4')}>
          <div className="flex flex-col">
            <span
              className={cn(
                'font-black tracking-tight leading-none',
                isFlashSaleActive ? 'text-base text-red-600' : 'text-lg md:text-xl text-red-600'
              )}
            >
              {isFlashSaleActive
                ? Number(flashPrice).toLocaleString('vi-VN') + '₫'
                : Number(price).toLocaleString('vi-VN') + '₫'}
            </span>

            {isFlashSaleActive ? (
              originalPrice > flashPrice && (
                <span className="text-[10px] font-bold text-slate-400 line-through mt-1">
                  {Number(originalPrice).toLocaleString('vi-VN')}₫
                </span>
              )
            ) : (
              hasDiscount && (
                <span className="text-xs font-bold text-slate-400 line-through mt-1">
                  {Number(originalPrice).toLocaleString('vi-VN')}₫
                </span>
              )
            )}
          </div>
        </div>

        {/* Progress Bar (flash-sale mode only) */}
        {isFlashSale && (
          <div className="mt-2">
            <ProgressBar current={soldQuantity} total={quantity} />
          </div>
        )}
      </div>
    </motion.div>
  );
};
