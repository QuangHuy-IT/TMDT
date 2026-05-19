import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, TrendingUp, Sparkles, ThumbsUp, Zap } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * RecommendationCards - Hiển thị sản phẩm được gợi ý từ AI Chatbot
 * 
 * Props:
 * - recommendations: Array of recommendation objects from AI
 * - onDismiss?: function to dismiss recommendations
 * - loading?: boolean
 */
export const RecommendationCards = ({ 
  recommendations = [], 
  onDismiss,
  loading = false 
}) => {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const [favorites, setFavorites] = useState(new Set());

  if (dismissed || recommendations.length === 0) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const handleFavClick = (e, productId) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const getReasonIcon = (reason) => {
    if (!reason) return <Sparkles size={14} />;
    const lowerReason = reason.toLowerCase();
    if (lowerReason.includes('yêu thích') || lowerReason.includes('thương hiệu')) {
      return <Heart size={14} />;
    }
    if (lowerReason.includes('nổi bật') || lowerReason.includes('bán chạy')) {
      return <TrendingUp size={14} />;
    }
    if (lowerReason.includes('giá') || lowerReason.includes('rẻ')) {
      return <Zap size={14} />;
    }
    return <ThumbsUp size={14} />;
  };

  const getReasonBadgeColor = (reason) => {
    if (!reason) return 'bg-gradient-to-r from-purple-500 to-pink-500';
    const lowerReason = reason.toLowerCase();
    if (lowerReason.includes('yêu thích') || lowerReason.includes('thương hiệu')) {
      return 'bg-gradient-to-r from-pink-500 to-rose-500';
    }
    if (lowerReason.includes('nổi bật') || lowerReason.includes('bán chạy')) {
      return 'bg-gradient-to-r from-orange-500 to-red-500';
    }
    if (lowerReason.includes('giá') || lowerReason.includes('rẻ')) {
      return 'bg-gradient-to-r from-green-500 to-emerald-500';
    }
    return 'bg-gradient-to-r from-blue-500 to-indigo-500';
  };

  const handleProductClick = (product) => {
    const slug = product.slug || product.productSlug || product.productId;
    navigate(`/product/${slug}`);
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl p-5 border border-purple-100"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-purple-200 rounded-xl animate-pulse" />
          <div className="w-32 h-5 bg-purple-200 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-3 animate-pulse">
              <div className="aspect-square bg-slate-200 rounded-xl mb-3" />
              <div className="h-3 bg-slate-200 rounded mb-2" />
              <div className="h-4 bg-slate-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl p-5 border border-purple-100 shadow-lg shadow-purple-100/50"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h4 className="font-black text-sm text-slate-800">Gợi Ý Cho Bạn</h4>
            <p className="text-xs text-slate-500">{recommendations.length} sản phẩm phù hợp</p>
          </div>
        </div>
        
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-white/50 rounded-xl"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {recommendations.slice(0, 8).map((product, index) => {
          const productId = product.productId || product.id || product._id;
          const name = product.productName || product.name || 'Sản phẩm';
          const thumbnail = product.thumbnail || product.imageUrl || '/placeholder-product.png';
          const price = product.minPrice || product.price || 0;
          const brandName = product.brandName || product.brand?.name || 'Mobile';
          const reason = product.reason;
          const isFav = favorites.has(productId);

          return (
            <motion.div
              key={productId}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleProductClick(product)}
              className="group relative bg-white rounded-2xl p-3 cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-purple-200/50 hover:-translate-y-1"
            >
              {/* Reason Badge */}
              {reason && (
                <div className={cn(
                  "absolute top-2 left-2 z-10 text-white text-[9px] font-bold px-2 py-0.5 rounded-lg shadow-sm flex items-center gap-1",
                  getReasonBadgeColor(reason)
                )}>
                  {getReasonIcon(reason)}
                  <span className="line-clamp-1">{reason}</span>
                </div>
              )}

              {/* Favorite Button */}
              <button
                onClick={(e) => handleFavClick(e, productId)}
                className="absolute z-10 p-1.5 rounded-xl backdrop-blur-md transition-all active:scale-90 top-2 right-2 bg-white/80 text-slate-400 hover:text-red-500"
              >
                <Heart 
                  size={14} 
                  className={isFav ? 'fill-red-500 stroke-red-500' : ''} 
                />
              </button>

              {/* Image */}
              <div className="aspect-square rounded-xl overflow-hidden bg-slate-50 mb-3">
                <img
                  src={thumbnail}
                  alt={name}
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/300x300/purple/white?text=Product';
                  }}
                />
              </div>

              {/* Brand */}
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                {brandName}
              </p>

              {/* Name */}
              <h5 className="text-xs font-bold text-slate-800 line-clamp-2 min-h-[2em] leading-tight mb-2 group-hover:text-purple-600 transition-colors">
                {name}
              </h5>

              {/* Price */}
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-black text-red-600">
                  {Number(price).toLocaleString('vi-VN')}₫
                </span>
                {product.salePercent > 0 && (
                  <span className="text-[10px] font-bold text-slate-400 line-through">
                    {Number(product.maxPrice || price * 1.2).toLocaleString('vi-VN')}₫
                  </span>
                )}
              </div>

              {/* Score Indicator */}
              {product.score > 0 && (
                <div className="mt-2 flex items-center gap-1">
                  <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(product.score * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-slate-400">
                    {Math.round(product.score * 100)}%
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-purple-100 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Dựa trên sở thích và lịch sử tìm kiếm của bạn
        </p>
        <button
          onClick={() => navigate('/products')}
          className="text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1"
        >
          Xem thêm
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
};

/**
 * CompactRecommendationList - Danh sách gợi ý nhỏ gọn cho chat
 */
export const CompactRecommendationList = ({ 
  recommendations = [],
  onProductClick,
  maxItems = 3 
}) => {
  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
        Có thể bạn quan tâm
      </p>
      <div className="space-y-2">
        {recommendations.slice(0, maxItems).map((product) => {
          const productId = product.productId || product.id || product._id;
          const slug = product.slug || product.productSlug || product.productId;
          const name = product.productName || product.name || 'Sản phẩm';
          const thumbnail = product.thumbnail || product.imageUrl || '/placeholder-product.png';
          const price = product.minPrice || product.price || 0;

          return (
            <div
              key={productId}
              onClick={() => onProductClick?.(slug || productId)}
              className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl cursor-pointer hover:bg-purple-50 transition-colors group"
            >
              <img
                src={thumbnail}
                alt={name}
                className="w-12 h-12 rounded-lg object-cover bg-slate-100"
                onError={(e) => {
                  e.target.src = 'https://placehold.co/48x48/purple/white?text=?';
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-700 line-clamp-1 group-hover:text-purple-600 transition-colors">
                  {name}
                </p>
                <p className="text-xs font-bold text-red-600">
                  {Number(price).toLocaleString('vi-VN')}₫
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendationCards;
