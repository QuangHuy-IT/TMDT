import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ProductCard } from '../components/ui/ProductCard';
import { FilterSidebar, DEFAULT_FILTERS } from '../components/ui/FilterSidebar';
import LoadMoreButton from '../components/ui/LoadMoreButton';
import { usePublicProducts } from '../hooks/usePublicProducts';
import { usePublicBrands } from '../hooks/usePublicBrands';
import { applyCatalogFilters, deriveCatalogOptions } from '../utils/catalog';

const ITEMS_PER_PAGE = 20;
const PRICE_MAP = {
  'under-5m': { label: 'Dưới 5 triệu', min: 0, max: 5_000_000 },
  '5-10m': { label: '5 - 10 triệu', min: 5_000_000, max: 10_000_000 },
  '10-20m': { label: '10 - 20 triệu', min: 10_000_000, max: 20_000_000 },
  'above-20m': { label: 'Trên 20 triệu', min: 20_000_000, max: Infinity },
};

export const TimKiem = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchQuery = searchParams.get('key') || '';
  const priceQuery = searchParams.get('price') || '';
  const storageQuery = searchParams.get('storage') || '';
  const { products, loading } = usePublicProducts({
    price: priceQuery || undefined,
    storage: storageQuery || undefined,
  });
  const { brands } = usePublicBrands();

  const [sortBy, setSortBy] = useState('featured');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
    setIsSidebarOpen(false);
  }, [searchQuery, priceQuery, storageQuery]);

  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [filters, sortBy]);

  useEffect(() => {
    setFilters({
      ...DEFAULT_FILTERS,
      priceRange: PRICE_MAP[priceQuery] || null,
      storages: storageQuery ? [storageQuery.toUpperCase()] : [],
    });
  }, [priceQuery, storageQuery]);

  const catalogOptions = useMemo(() => deriveCatalogOptions(products), [products]);
  const allBrands = useMemo(() => brands.map((brand) => brand.name), [brands]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((product) =>
        String(product.name || '').toLowerCase().includes(query)
        || String(product.brand || '').toLowerCase().includes(query)
        || String(product.baseName || '').toLowerCase().includes(query)
        || (product.variants || []).some(v =>
          String(v.storageLabel || '').toLowerCase().includes(query)
          || String(v.color || '').toLowerCase().includes(query)
        )
        || (product.variantItems || []).some(v =>
          String(v.storageLabel || '').toLowerCase().includes(query)
          || String(v.color || '').toLowerCase().includes(query)
        )
      );
    }

    result = applyCatalogFilters(result, filters);

    if (sortBy === 'low-to-high' || sortBy === 'price-asc') result.sort((a, b) => a.price - b.price);
    if (sortBy === 'high-to-low' || sortBy === 'price-desc') result.sort((a, b) => b.price - a.price);
    if (sortBy === 'rating') result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.releaseDate || b.createdAt || 0) - new Date(a.releaseDate || a.createdAt || 0));
    }
    if (sortBy === 'featured') {
      result.sort((a, b) => {
        // 1. isFeatured: true first
        const featA = a.isFeatured ? 1 : 0;
        const featB = b.isFeatured ? 1 : 0;
        if (featB !== featA) return featB - featA;

        // 2. averageRating (or rating): higher first
        const ratingA = a.averageRating || a.rating || 0;
        const ratingB = b.averageRating || b.rating || 0;
        if (ratingB !== ratingA) return ratingB - ratingA;

        // 3. reviewCount: higher first
        const reviewA = a.reviewCount || 0;
        const reviewB = b.reviewCount || 0;
        if (reviewB !== reviewA) return reviewB - reviewA;

        // 4. releaseDate/createdAt: newest first
        return new Date(b.releaseDate || b.createdAt || 0) - new Date(a.releaseDate || a.createdAt || 0);
      });
    }
    if (sortBy === 'name-az') result.sort((a, b) => a.name.localeCompare(b.name));

    return result;
  }, [products, searchQuery, filters, sortBy]);

  const displayed = filteredProducts.slice(0, visibleCount);

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <div className="mx-auto max-w-[1400px] px-4 pt-10 lg:px-8">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="mb-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-4 text-[10px] font-black uppercase tracking-widest shadow-sm lg:hidden"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Bộ lọc
        </button>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="ml-auto flex items-center gap-2">
            {[
              { key: 'featured', label: 'Nổi bật' },
              { key: 'newest', label: 'Mới nhất' },
              { key: 'price-asc', label: 'Giá thấp' },
              { key: 'price-desc', label: 'Giá cao' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  sortBy === key ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-8">
          <FilterSidebar
            filters={filters}
            onChange={setFilters}
            allBrands={allBrands}
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
            ) : displayed.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {displayed.map((product) => (
                    <ProductCard key={`${product.id}-${product.variantId}`} product={product} />
                  ))}
                </div>

                <LoadMoreButton
                  visibleCount={visibleCount}
                  totalCount={filteredProducts.length}
                  onLoadMore={() => setVisibleCount((current) => current + ITEMS_PER_PAGE)}
                />
              </>
            ) : (
              <div className="rounded-[3rem] border-2 border-dashed border-gray-100 bg-white py-32 text-center shadow-sm">
                <div className="mb-6 text-7xl opacity-20">?</div>
                <p className="mb-2 text-xl font-black uppercase tracking-widest text-gray-900">Không có kết quả</p>
                <p className="mx-auto mb-10 max-w-xs text-sm font-bold text-gray-400">
                  Chúng tôi không tìm thấy sản phẩm nào khớp với lựa chọn của bạn.
                </p>
                <button
                  onClick={() => {
                    setSearchParams({});
                    setFilters(DEFAULT_FILTERS);
                    setSortBy('default');
                    navigate('/products');
                  }}
                  className="rounded-2xl bg-gray-900 px-10 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all hover:bg-red-600 active:scale-95"
                >
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
