import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { products } from '../data/products';
import { brands } from '../data/brands';
import { ProductCard } from '../components/ui/ProductCard';
import { FilterSidebar, DEFAULT_FILTERS, applyFilters } from '../components/ui/FilterSidebar';
import LoadMoreButton from '../components/ui/LoadMoreButton';

const ITEMS_PER_PAGE = 20;
const ALL_BRANDS = brands.map((b) => b.name);

export const TimKiem = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchQuery = searchParams.get('key') || '';

  const [sortBy, setSortBy] = useState('default');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Cho mobile drawer

  // Reset trạng thái khi đổi từ khóa tìm kiếm
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
    setIsSidebarOpen(false);
  }, [searchQuery]);

  // Reset số lượng hiển thị khi lọc hoặc sắp xếp
  useEffect(() => { 
    setVisibleCount(ITEMS_PER_PAGE); 
  }, [filters, sortBy]);

  // Logic Lọc và Sắp xếp
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // 1. Lọc theo từ khóa
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query)
      );
    }

    // 2. Áp dụng bộ lọc specifications (RAM, Pin, Giá...)
    result = applyFilters(result, filters);

    // 3. Sắp xếp
    if (sortBy === 'low-to-high') result.sort((a, b) => a.price - b.price);
    if (sortBy === 'high-to-low') result.sort((a, b) => b.price - a.price);
    if (sortBy === 'rating')      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (sortBy === 'name-az')     result.sort((a, b) => a.name.localeCompare(b.name));

    return result;
  }, [searchQuery, filters, sortBy]);

  // Cắt danh sách theo số lượng "Xem thêm"
  const displayed = filteredProducts.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + ITEMS_PER_PAGE);
  };

  const clearAll = () => {
    setSearchParams({});
    setFilters(DEFAULT_FILTERS);
    setSortBy('default');
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-10">

        {/* Breadcrumb & Header */}
        <div className="mb-8">
          <nav className="flex items-center text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 gap-3">
            <span className="hover:text-red-600 cursor-pointer transition-colors" onClick={() => navigate('/')}>Trang chủ</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-700">Tìm kiếm</span>
          </nav>

          <h1 className="text-3xl md:text-5xl font-black uppercase italic text-gray-900 leading-none tracking-tighter">
            {searchQuery
              ? <>Kết quả cho <span className="text-red-600">"{searchQuery}"</span></>
              : <>Tất cả <span className="text-red-600">Sản phẩm</span></>
            }
          </h1>
          <p className="text-gray-400 text-xs mt-3 font-bold uppercase tracking-widest">
            Phân tích được {filteredProducts.length} sản phẩm phù hợp
          </p>
        </div>

        {/* Nút mở bộ lọc trên Mobile */}
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden w-full mb-6 flex items-center justify-center gap-2 bg-white border border-gray-200 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Bộ lọc 
        </button>
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

        <div className="flex gap-8 items-start">
          {/* Sidebar Filter */}
          <FilterSidebar
            filters={filters}
            onChange={setFilters}
            allBrands={ALL_BRANDS}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            

            {displayed.length > 0 ? (
              <>
                {/* Grid Sản phẩm Responsive */}
                <div className="grid [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))] gap-4">
                  {displayed.map((product) => (
                    <ProductCard key={product._id || product.id} product={product} />
                  ))}
                </div>

                {/* Nút Xem Thêm (Component đã tách) */}
                <LoadMoreButton 
                  visibleCount={visibleCount} 
                  totalCount={filteredProducts.length} 
                  onLoadMore={handleLoadMore} 
                />
              </>
            ) : (
              /* Empty State */
              <div className="text-center py-32 bg-white rounded-[3rem] shadow-sm border-2 border-dashed border-gray-100">
                <div className="text-7xl mb-6 opacity-20">🔍</div>
                <p className="text-gray-900 font-black uppercase tracking-widest text-xl mb-2 italic">Không có kết quả!</p>
                <p className="text-gray-400 text-sm font-bold mb-10 max-w-xs mx-auto">Chúng tôi không tìm thấy sản phẩm nào khớp với lựa chọn của bạn.</p>
                <button onClick={clearAll}
                  className="px-10 py-4 bg-gray-900 text-white font-black text-[10px] rounded-2xl hover:bg-red-600 transition-all tracking-[0.2em] uppercase shadow-xl active:scale-95">
                  Xóa tất cả bộ lọc
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};