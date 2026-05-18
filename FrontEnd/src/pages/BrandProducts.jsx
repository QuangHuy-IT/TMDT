import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ProductCard } from '../components/ui/ProductCard';
import { FilterSidebar, DEFAULT_FILTERS } from '../components/ui/FilterSidebar';
import { usePublicProducts } from '../hooks/usePublicProducts';
import { usePublicBrands } from '../hooks/usePublicBrands';
import { applyCatalogFilters, deriveCatalogOptions } from '../utils/catalog';

const ITEMS_PER_PAGE = 20;

export const BrandProducts = () => {
  const { brandSlug, brandName } = useParams();
  const activeBrandKey = brandSlug || brandName || '';
  const navigate = useNavigate();
  const { products, loading } = usePublicProducts({ brand: activeBrandKey });
  const { brands } = usePublicBrands();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('default');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
    setFilters(DEFAULT_FILTERS);
  }, [activeBrandKey]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortBy]);

  const currentBrand = useMemo(
    () => brands.find((brand) => brand.slug === activeBrandKey || brand.name?.toLowerCase() === activeBrandKey.toLowerCase()),
    [brands, activeBrandKey]
  );

  const catalogOptions = useMemo(() => deriveCatalogOptions(products), [products]);

  const filteredProducts = useMemo(() => {
    const result = applyCatalogFilters([...products], { ...filters, selectedBrands: [] });
    if (sortBy === 'low-to-high' || sortBy === 'price-asc') result.sort((a, b) => a.price - b.price);
    if (sortBy === 'high-to-low' || sortBy === 'price-desc') result.sort((a, b) => b.price - a.price);
    if (sortBy === 'rating') result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (sortBy === 'newest' || sortBy === 'featured') {
      result.sort((a, b) => new Date(b.releaseDate || b.createdAt || 0) - new Date(a.releaseDate || a.createdAt || 0));
    }
    return result;
  }, [products, filters, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const displayedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
    if (currentPage <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
    if (currentPage >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <div className="mx-auto max-w-7xl px-4 pt-10">
        <div className="mb-8">
          <nav className="mb-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400">
            <span className="cursor-pointer hover:text-red-600" onClick={() => navigate('/')}>Trang chủ</span>
            <span className="text-gray-300">/</span>
            <span className="capitalize text-gray-700">{currentBrand?.name || activeBrandKey}</span>
          </nav>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-700 lg:hidden"
          >
            Bộ lọc
          </button>
          <div className="ml-auto flex items-center gap-2">
            {[
              { key: 'featured', label: 'Nổi bật' },
              { key: 'newest', label: 'Mới nhất' },
              { key: 'price-asc', label: 'Giá thấp' },
              { key: 'price-desc', label: 'Giá cao' },
              { key: 'rating', label: 'Đánh giá cao' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                  sortBy === key ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-6">
          <FilterSidebar
            filters={filters}
            onChange={setFilters}
            hideBrand
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            availableColors={catalogOptions.colors}
            availableStorages={catalogOptions.storages}
            availableRams={catalogOptions.rams}
          />

          <div className="min-w-0 flex-1">
            {loading ? (
              <div className="rounded-[3rem] border border-gray-100 bg-white py-32 text-center shadow-sm">
                <p className="text-sm font-bold uppercase tracking-widest text-gray-500">Đang tải sản phẩm...</p>
              </div>
            ) : displayedProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {displayedProducts.map((product) => (
                    <ProductCard key={`${product.id}-${product.variantId}`} product={product} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-10 flex flex-col items-center gap-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                      Trang {currentPage}/{totalPages}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                        disabled={currentPage === 1}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-gray-200 text-sm font-black text-gray-500 transition-all hover:border-gray-900 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        {'<'}
                      </button>
                      {getPageNumbers().map((page, index) => (
                        page === '...'
                          ? <span key={`dots-${index}`} className="flex h-9 w-9 items-center justify-center text-sm font-bold text-gray-400">...</span>
                          : (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-black transition-all ${
                                currentPage === page
                                  ? 'scale-110 border-2 border-gray-900 bg-gray-900 text-white shadow-lg'
                                  : 'border-2 border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900'
                              }`}
                            >
                              {page}
                            </button>
                          )
                      ))}
                      <button
                        onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                        disabled={currentPage === totalPages}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-gray-200 text-sm font-black text-gray-500 transition-all hover:border-gray-900 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        {'>'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-[3rem] border border-dashed border-gray-200 bg-white py-32 text-center shadow-sm">
                <div className="mb-4 text-6xl">?</div>
                <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Không tìm thấy sản phẩm</p>
                <button
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="mt-4 rounded-xl bg-gray-900 px-6 py-2.5 text-xs font-bold text-white transition-all hover:bg-red-600"
                >
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
