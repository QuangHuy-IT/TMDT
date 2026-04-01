import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShopContext } from '../../context/ShopContext';
import Stars from './Stars';
import Badge from './Badge';
import Button from './Button';

export const ProductCard = ({ product }) => {
  const { state, dispatch } = useContext(ShopContext);
  const { isAuthenticated } = state;
  const navigate = useNavigate();
  const location = useLocation();

  // Schema mới dùng _id và images[], fallback cho schema cũ
  const productId = product._id || product.id;
  const thumbnail = (product.images && product.images[0]) || product.image;

  const handleAddToCart = (e) => {
    e.preventDefault(); // Chặn Link chuyển trang
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }

    // Lấy cấu hình mặc định (phần tử đầu tiên)
    const defaultStorage = product.variants?.storages?.[0] || "";
    const finalPrice = product.variants?.basePrices?.[defaultStorage] || product.price;

    dispatch({
      type: 'ADD_TO_CART',
      payload: {
        ...product,
        id: defaultStorage ? `${product._id}-${defaultStorage}` : product._id,
        _id: product._id,        // ← giữ lại _id gốc để dùng cho link
        price: finalPrice,
        selectedStorage: defaultStorage,
        quantity: 1,
      }
    });
  };

  return (
    <div className="group bg-white border border-gray-50 rounded-lg p-3 shadow-sm hover:shadow-xl transition-all duration-300">
      <Link to={`/product/${productId}`}>
        <div className="relative overflow-hidden rounded-xl mb-3">
          {product.discount && (
            <div className="absolute top-2 left-2 z-10">
              <Badge>-{product.discount}%</Badge>
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl z-10">
              <span className="text-white text-xs font-black uppercase tracking-widest">Hết hàng</span>
            </div>
          )}
          <img
            src={thumbnail}
            className="w-full h-48 object-contain group-hover:scale-110 transition-transform duration-500"
            alt={product.name}
            onError={(e) => { e.target.src = 'https://picsum.photos/seed/fallback/400/400'; }}
          />
        </div>
      </Link>

      <div className="space-y-1">
        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{product.brand}</p>
        <Link to={`/product/${productId}`}>
          <h3 className="font-bold text-gray-800 truncate hover:text-red-600 cursor-pointer">{product.name}</h3>
        </Link>
        <Stars rating={product.rating} />
        <div className="flex items-center justify-between pt-2">
        {/* Giá tiền */}
        <span className="text-lg font-black text-red-600">
          {product.price.toLocaleString()}đ
        </span>

        {/* Nút thêm vào giỏ hàng dùng thuần Tailwind */}
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className={`
            flex items-center justify-center 
            p-2 px-3 rounded-lg transition-all duration-200
            ${product.stock === 0 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-red-600 text-white hover:bg-red-700 active:scale-95 shadow-sm hover:shadow-md'
            }
          `}
        >
          <img src="/assets/images/icon/main/cart.svg" alt="cart" className="h-3 w-3 invert" />
        </button>
        </div>
      </div>
    </div>
  );
};