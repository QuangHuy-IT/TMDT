// src/pages/BrandProducts.jsx  (updated)
// Layout: sidebar filter bên trái + grid 5 cột × 4 hàng = 20 sản phẩm / trang

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { products } from '../data/products';
import { ProductCard } from '../components/ui/ProductCard';
import { FilterSidebar, DEFAULT_FILTERS, applyFilters } from '../components/ui/FilterSidebar';

const ITEMS_PER_PAGE = 20;

export const BrandProducts = () => {
  const { brandName } = useParams();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('default');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // Reset khi brand đổi
  useEffect(() => {
    setCurrentPage(1);
    setFilters(DEFAULT_FILTERS);
  }, [brandName]);

  useEffect(() => { setCurrentPage(1); }, [filters, sortBy]);

  const filteredProducts = useMemo(() => {
    // Chỉ lấy sản phẩm đúng brand trước
    let base = products.filter((p) => p.brand.toLowerCase() === brandName.toLowerCase());
    // Áp dụng sidebar filter (bỏ qua selectedBrands vì đang trong trang brand)
    base = applyFilters(base, { ...filters, selectedBrands: [] });
    // Sắp xếp
    if (sortBy === 'low-to-high') base.sort((a, b) => a.price - b.price);
    if (sortBy === 'high-to-low') base.sort((a, b) => b.price - a.price);
    if (sortBy === 'rating')      base.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return base;
  }, [brandName, filters, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const displayedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
    if (currentPage >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 pt-10">

        {/* Header */}
        <div className="mb-8">
          <nav className="flex items-center text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 gap-3">
            <span className="hover:text-red-600 cursor-pointer" onClick={() => navigate('/')}>Trang chủ</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-700 capitalize">{brandName}</span>
          </nav>
          <h1 className="text-4xl font-black uppercase italic text-gray-900 leading-none">
            Điện thoại <span className="text-red-600">{brandName}</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2 font-bold">{filteredProducts.length} sản phẩm</p>
        </div>
        {/* Sort bar Desktop */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">

          {/* Chèn nội dung bên trái ở đây nếu có (ví dụ: "Số lượng sản phẩm") */}
          {/* Nếu không có gì bên trái, ml-auto sẽ đẩy toàn bộ cụm này về phía bên phải cực đại */}

          {/* Bên phải: sort */}
          <div className="flex items-center gap-2 ml-auto"> 
            {[
              { key: 'featured',   label: 'Nổi bật' },
              { key: 'newest',     label: 'Mới nhất' },
              { key: 'price-asc',  label: 'Giá thấp' },
              { key: 'price-desc', label: 'Giá cao' },
              { key: 'rating',     label: 'Đánh giá cao' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  sortBy === key
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:bg-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Layout: sidebar + content */}
        <div className="flex gap-6 items-start">

          {/* Sidebar — ẩn brand vì đang ở trang brand rồi */}
          <FilterSidebar
            filters={filters}
            onChange={setFilters}
            hideBrand
          />

          {/* Nội dung chính */}
          <div className="flex-1 min-w-0">

            {displayedProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {displayedProducts.map((product) => (
                    <ProductCard key={product._id || product.id} product={product} />
                  ))}
                </div>

                {/* Phân trang */}
                {totalPages > 1 && (
                  <div className="mt-10 flex flex-col items-center gap-3">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Trang {currentPage}/{totalPages}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
                        className="w-9 h-9 flex items-center justify-center rounded-xl border-2 border-gray-200 text-gray-500 font-black hover:border-gray-900 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm">←</button>
                      {getPageNumbers().map((page, i) =>
                        page === '...' ? (
                          <span key={`d${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 font-bold text-sm">···</span>
                        ) : (
                          <button key={page} onClick={() => handlePageChange(page)}
                            className={`w-9 h-9 flex items-center justify-center rounded-xl font-black text-xs transition-all ${
                              currentPage === page ? 'bg-gray-900 text-white border-2 border-gray-900 scale-110 shadow-lg' : 'border-2 border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900'
                            }`}>{page}</button>
                        )
                      )}
                      <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}
                        className="w-9 h-9 flex items-center justify-center rounded-xl border-2 border-gray-200 text-gray-500 font-black hover:border-gray-900 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm">→</button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-32 bg-white rounded-[3rem] shadow-sm border border-dashed border-gray-200">
                <div className="text-6xl mb-4">😿</div>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Không tìm thấy sản phẩm</p>
                <button onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="mt-4 px-6 py-2.5 bg-gray-900 text-white font-bold text-xs rounded-xl hover:bg-red-600 transition-all">
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};