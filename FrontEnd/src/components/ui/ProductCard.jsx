import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Eye, Star } from 'lucide-react';
import { ShopContext } from '../../context/ShopContext';
import { cn } from '../../utils/cn';

export const ProductCard = ({ product, className }) => {
  const { state, dispatch } = useContext(ShopContext);
  const { isAuthenticated } = state;
  const navigate = useNavigate();
  const location = useLocation();
  const [isFav, setIsFav] = useState(false);

  // LOG để debug cấu trúc dữ liệu (Xóa sau khi fix xong)
  // console.log('Product Data:', product);

  // Mapping dữ liệu linh hoạt để khớp với DTO từ Backend
  const productId = product.id || product._id;
  const productSlug = product.slug || productId; // Ưu tiên slug, fallback về id
  const name = product.name || product.productName || 'Sản phẩm mới';

  // Xử lý ảnh: Ưu tiên thumbnail (từ FlashSaleDto), sau đó imageUrl, hoặc lấy từ mảng images
  const thumbnail = product.thumbnail ||
                    product.imageUrl ||
                    (product.images && product.images.length > 0 ? (typeof product.images[0] === 'string' ? product.images[0] : product.images[0].imageUrl) : '/placeholder-product.png');
  
  // Xử lý giá: Backend có thể trả về price hoặc defaultPrice hoặc giá từ variant đầu tiên
  const price = product.price || product.minPrice || (product.variants && product.variants.length > 0 ? product.variants[0].price : 0);
  const sale = product.sale || product.discount || 0;
  const originalPrice = product.originalPrice || (sale > 0 ? Math.round(price * 100 / (100 - sale)) : price);

  const ram = product.ram || (product.specifications?.ram) || '';
  const rom = product.storage || (product.specifications?.storage) || '';
  const rating = product.rating || 5.0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }
    dispatch({
      type: 'ADD_TO_CART',
      payload: { ...product, quantity: 1 }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      className={cn(
        "group relative bg-white rounded-[2rem] p-5 border border-slate-100 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)] h-full flex flex-col",
        className
      )}
    >
      {/* Top Badges */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        {sale > 0 && (
          <span className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg shadow-red-200 uppercase tracking-wider">
            -{sale}%
          </span>
        )}
      </div>

      <button
        onClick={() => setIsFav(!isFav)}
        className="absolute top-4 right-4 z-10 p-2.5 rounded-2xl bg-slate-50/80 backdrop-blur-md text-slate-400 hover:text-red-500 hover:bg-white shadow-sm transition-all active:scale-90"
      >
        <Heart size={18} className={isFav ? 'fill-red-500 stroke-red-500' : ''} />
      </button>

      {/* Image Container */}
      <Link to={`/product/${productSlug}`} className="relative block aspect-square overflow-hidden rounded-2xl bg-slate-50 mb-4">
        <img
          src={thumbnail}
          alt={name}
          className="h-full w-full object-contain transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
          onError={(e) => { e.target.src = 'https://placehold.co/400x400?text=No+Image'; }}
        />
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
            <Eye size={20} className="text-slate-900" />
          </div>
        </div>
      </Link>

      {/* Product Info */}
      <div className="flex flex-col flex-grow">
        <div className="flex items-center gap-1 mb-1.5">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{product.brand?.name || product.brandName || 'Mobile'}</span>
          <div className="w-1 h-1 rounded-full bg-slate-300"></div>
          <div className="flex items-center gap-0.5 text-orange-400">
            <Star size={10} fill="currentColor" />
            <span className="text-[10px] font-bold text-slate-500">{rating}</span>
          </div>
        </div>

        <Link to={`/product/${productSlug}`}>
          <h3 className="font-bold text-slate-900 text-sm md:text-base leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-blue-600 transition-colors">
            {name}
          </h3>
        </Link>

        {/* Specs summary */}
        {(ram || rom) && (
          <div className="flex gap-2 mt-2">
            {ram && <span className="px-2 py-0.5 bg-slate-50 rounded-md text-[10px] font-bold text-slate-500 uppercase">{ram}</span>}
            {rom && <span className="px-2 py-0.5 bg-slate-50 rounded-md text-[10px] font-bold text-slate-500 uppercase">{rom}</span>}
          </div>
        )}

        {/* Price & Cart */}
        <div className="mt-auto pt-4 flex items-end justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-lg md:text-xl font-black text-red-600 tracking-tight leading-none">
              {Number(price).toLocaleString('vi-VN')}₫
            </span>
            {sale > 0 && (
              <span className="text-xs font-bold text-slate-400 line-through mt-1">
                {Number(originalPrice).toLocaleString('vi-VN')}₫
              </span>
            )}
          </div>
          
          <button
            onClick={handleAddToCart}
            className="p-3 rounded-2xl bg-slate-900 text-white hover:bg-blue-600 hover:scale-110 active:scale-95 transition-all shadow-lg shadow-slate-200"
          >
            <ShoppingBag size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};