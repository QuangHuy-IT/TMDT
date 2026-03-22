import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { products } from '../data/products';
import { brands } from '../data/brands';
import { ProductCard } from '../components/ui/ProductCard';

const ITEMS_PER_PAGE = 10;

export const TimKiem = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Lấy query search từ URL (?key=iphone)
  const searchQuery = searchParams.get('key') || '';

  const [sortBy, setSortBy] = useState('default');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [inputValue, setInputValue] = useState(searchQuery);

  // Khi URL thay đổi (ví dụ từ Navbar search), đồng bộ lại input và reset trang
  useEffect(() => {
    setInputValue(searchQuery);
    setCurrentPage(1);
  }, [searchQuery]);

  // Reset trang khi đổi filter/sort
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBrand, sortBy]);

  // Lọc + sắp xếp sản phẩm
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Lọc theo từ khóa tìm kiếm
    if (searchQuery.trim()) {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Lọc theo thương hiệu
    if (selectedBrand) {
      result = result.filter((p) => p.brand === selectedBrand);
    }

    // Sắp xếp
    if (sortBy === 'low-to-high') result.sort((a, b) => a.price - b.price);
    if (sortBy === 'high-to-low') result.sort((a, b) => b.price - a.price);
    if (sortBy === 'name-az') result.sort((a, b) => a.name.localeCompare(b.name));

    return result;
  }, [searchQuery, selectedBrand, sortBy]);

  // Phân trang
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const displayProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSearchParams({ key: inputValue.trim() });
    } else {
      setSearchParams({});
    }
  };

  const handleClearSearch = () => {
    setInputValue('');
    setSearchParams({});
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  };

  // Danh sách brand duy nhất từ data
  const uniqueBrands = useMemo(() =>
    [...new Set(products.map((p) => p.brand))].sort(),
  []);

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 pt-10">

        {/* Header */}
        <div className="mb-10">
          <button
            onClick={() => navigate('/')}
            className="text-xs font-black text-gray-400 hover:text-red-600 mb-3 uppercase tracking-widest"
          >
            ← Trang chủ
          </button>
          <h1 className="text-4xl font-black uppercase italic text-gray-900 leading-none">
            {searchQuery
              ? <>Kết quả cho <span className="text-red-600">"{searchQuery}"</span></>
              : <>Tất cả <span className="text-red-600">Sản phẩm</span></>
            }
          </h1>
          <p className="text-gray-400 text-sm mt-2 font-bold">
            {filteredProducts.length} sản phẩm được tìm thấy
          </p>
        </div>

        {/* Thanh tìm kiếm + Bộ lọc */}
        <div className="flex flex-col md:flex-row gap-4 mb-10">

          {/* Search bar */}
          <form onSubmit={handleSearch} className="relative flex-grow">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm, thương hiệu..."
              className="w-full bg-white border border-gray-200 rounded-2xl py-3 px-5 pr-24 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all shadow-sm"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            {inputValue && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-14 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors text-lg font-bold"
              >
                ×
              </button>
            )}
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-xl hover:bg-red-700 transition-all"
            >
              Tìm
            </button>
          </form>

          {/* Lọc thương hiệu */}
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="bg-white border border-gray-200 rounded-2xl py-3 px-4 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm cursor-pointer"
          >
            <option value="">Tất cả thương hiệu</option>
            {uniqueBrands.map((brand) => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>

          {/* Sắp xếp */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border border-gray-200 rounded-2xl py-3 px-4 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm cursor-pointer"
          >
            <option value="default">Mặc định</option>
            <option value="low-to-high">Giá: Thấp → Cao</option>
            <option value="high-to-low">Giá: Cao → Thấp</option>
            <option value="name-az">Tên: A → Z</option>
          </select>
        </div>

        {/* Danh sách sản phẩm */}
        {displayProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {displayProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Phân trang */}
            {totalPages > 1 && (
              <div className="mt-16 flex flex-col items-center gap-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Trang {currentPage} / {totalPages} &nbsp;·&nbsp; {filteredProducts.length} sản phẩm
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="w-10 h-10 flex items-center justify-center rounded-2xl border-2 border-gray-200 text-gray-500 font-black hover:border-gray-900 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    ←
                  </button>

                  {getPageNumbers().map((page, index) =>
                    page === '...' ? (
                      <span key={`dots-${index}`} className="w-10 h-10 flex items-center justify-center text-gray-400 font-bold">
                        ···
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-10 h-10 flex items-center justify-center rounded-2xl font-black text-sm transition-all ${
                          currentPage === page
                            ? 'bg-gray-900 text-white border-2 border-gray-900 scale-110 shadow-xl'
                            : 'border-2 border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="w-10 h-10 flex items-center justify-center rounded-2xl border-2 border-gray-200 text-gray-500 font-black hover:border-gray-900 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-32 bg-white rounded-[3rem] shadow-sm border border-dashed border-gray-200">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-900 font-black uppercase tracking-widest text-lg mb-2">
              Không tìm thấy sản phẩm
            </p>
            <p className="text-gray-400 text-sm font-bold mb-8">
              Thử tìm với từ khóa khác hoặc bỏ bộ lọc
            </p>
            <button
              onClick={() => { handleClearSearch(); setSelectedBrand(''); setSortBy('default'); }}
              className="px-8 py-3 bg-gray-900 text-white font-black text-xs rounded-2xl hover:bg-red-600 transition-all tracking-widest uppercase"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>
    </main>
  );
};