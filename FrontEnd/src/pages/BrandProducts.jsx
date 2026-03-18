import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { products } from '../data/products';
import { ProductCard } from '../components/ui/ProductCard';

const ITEMS_PER_PAGE = 10;

export const BrandProducts = () => {
  const { brandName } = useParams();
  const navigate = useNavigate();
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [sortBy, setSortBy] = useState('default');

  useEffect(() => { setVisibleCount(ITEMS_PER_PAGE); }, [brandName]);

  const filteredProducts = useMemo(() => {
    let result = products.filter(
      (p) => p.brand.toLowerCase() === brandName.toLowerCase()
    );
    if (sortBy === 'low-to-high') result.sort((a, b) => a.price - b.price);
    if (sortBy === 'high-to-low') result.sort((a, b) => b.price - a.price);
    return result;
  }, [brandName, sortBy]);

  const displayedProducts = filteredProducts.slice(0, visibleCount);

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 pt-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <button onClick={() => navigate('/')} className="text-xs font-black text-gray-400 hover:text-red-600 mb-2 uppercase tracking-widest">← Quay lại trang chủ</button>
            <h1 className="text-4xl font-black uppercase italic text-gray-900 leading-none">
              Điện thoại <span className="text-red-600">{brandName}</span>
            </h1>
            <p className="text-gray-400 text-sm mt-2 font-bold">{filteredProducts.length} sản phẩm được tìm thấy</p>
          </div>
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
            <span className="text-[10px] font-black text-gray-400 uppercase ml-2">Sắp xếp:</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-gray-700 focus:ring-0 cursor-pointer">
              <option value="default">Mặc định</option>
              <option value="low-to-high">Giá Thấp - Cao</option>
              <option value="high-to-low">Giá Cao - Thấp</option>
            </select>
          </div>
        </div>

        {displayedProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {displayedProducts.map((product) => (
                <ProductCard key={product._id || product.id} product={product} />
              ))}
            </div>
            {visibleCount < filteredProducts.length && (
              <div className="mt-16 text-center">
                <button onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
                  className="px-10 py-4 bg-white border-2 border-gray-900 text-gray-900 rounded-2xl font-black text-xs tracking-widest hover:bg-gray-900 hover:text-white transition-all shadow-xl active:scale-95">
                  TẢI THÊM SẢN PHẨM ({filteredProducts.length - visibleCount})
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-32 bg-white rounded-[3rem] shadow-sm border border-dashed border-gray-200">
            <div className="text-6xl mb-4">😿</div>
            <p className="text-gray-400 font-bold uppercase tracking-widest">Không có sản phẩm nào</p>
          </div>
        )}
      </div>
    </main>
  );
};