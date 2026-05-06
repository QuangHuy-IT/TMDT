// src/pages/Home.jsx  (updated)

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { brands } from '../data/brands';
import { banners } from '../data/banners';
import { ProductCard } from '../components/ui/ProductCard';
import { FilterSidebar, DEFAULT_FILTERS } from '../components/ui/FilterSidebar';
import LoadMoreButton from '../components/ui/LoadMoreButton';
import { usePublicProducts } from '../hooks/usePublicProducts';
import { usePublicBrands } from '../hooks/usePublicBrands';
import { applyCatalogFilters, deriveCatalogOptions } from '../utils/catalog';

const ITEMS_PER_PAGE = 20; // 5 cột × 4 hàng
const ALL_BRANDS = brands.map((b) => b.name);

// ─── Main ────────────────────────────────────────────────────────────────────
export const Home = () => {
  const navigate = useNavigate();
  const { products, loading } = usePublicProducts();
  const { brands: apiBrands } = usePublicBrands();
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [activeSlide, setActiveSlide] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('featured');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Banner auto-play
  useEffect(() => {
    if (banners.length === 0) return;

    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  // Reset trang khi filter / sort đổi
  useEffect(() => { setCurrentPage(1); }, [filters, sortBy]);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const catalogOptions = useMemo(() => deriveCatalogOptions(products), [products]);
  const displayBrands = apiBrands.length > 0 ? apiBrands : brands;

  // Lọc + sắp xếp
  const filtered = useMemo(() => {
    let list = applyCatalogFilters(products, filters);
    switch (sortBy) {
      case 'price-asc':  list.sort((a, b) => a.price - b.price); break;
      case 'price-desc': list.sort((a, b) => b.price - a.price); break;
      case 'rating':     list.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case 'newest':     list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
      case 'featured':
      default:           list.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }
    return list;
  }, [filters, sortBy]);

  // Sản phẩm hiển thị thực tế
  const displayed = filtered.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + ITEMS_PER_PAGE);
  };

  return (
    <main className="min-h-screen bg-[#f8f8f6] pb-20">

      {/* ── BANNER ──────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 pt-6">
        <div className="relative h-[200px] md:h-[400px] overflow-hidden rounded-[2rem] shadow-2xl bg-gray-200">
          {banners.map((banner, i) => (
            <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ${activeSlide === i ? 'opacity-100' : 'opacity-0'}`}>
              <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent flex items-end md:items-center px-8 md:px-14 pb-8 md:pb-0">
                <div className="text-white">
                  <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-white/60 mb-2">Khuyến mãi đặc biệt</p>
                  <h2 className="text-2xl md:text-5xl font-black uppercase italic leading-tight mb-4 drop-shadow-lg">{banner.title}</h2>
                  <button
                    onClick={() => navigate(banner.link || '/tim-kiem')}
                    className="bg-white text-gray-900 px-6 py-2.5 md:px-8 md:py-3 rounded-full font-black text-xs tracking-widest hover:bg-red-600 hover:text-white transition-all duration-300 shadow-lg"
                  >
                    Khám phá ngay →
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div className="absolute bottom-5 right-6 flex gap-2">
            {banners.map((_, i) => (
              <button key={i} onClick={() => setActiveSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-500 ${activeSlide === i ? 'bg-white w-8' : 'bg-white/40 w-2'}`}/>
            ))}
          </div>
          <div className="absolute top-5 right-6 bg-black/30 backdrop-blur-sm text-white text-[10px] font-black px-3 py-1 rounded-full">
            {activeSlide + 1} / {banners.length}
          </div>
        </div>
      </section>

      {/* ── BRANDS ──────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 mt-10">
        <div className="flex items-center gap-4 mb-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] whitespace-nowrap">Thương hiệu</p>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <div className="flex flex-wrap gap-2">
          {displayBrands.map((brand) => (
            <button
              key={brand.id || brand._id || brand.slug}
              onClick={() => navigate(`/${brand.slug}?name=${encodeURIComponent(brand.name)}`)}
              className="group px-4 py-2 bg-white border border-gray-200 rounded-sm transition-all hover:bg-white"
            >
              <span className="text-xs font-bold text-gray-600 group-hover:text-red-600 uppercase tracking-tight whitespace-nowrap transition-colors">
                {brand.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ── SẢN PHẨM + BỘ LỌC ──────────────────────────────────────── */}
      <section id="products-section" className="max-w-7xl mx-auto px-4 mt-12 scroll-mt-20">

        {/* Tiêu đề + sort bar */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Tất cả sản phẩm</h2>
            <p className="text-sm text-gray-400 mt-0.5">{filtered.length} sản phẩm</p>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden px-4 py-2 rounded-xl bg-white border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-700"
          >
            Bộ lọc
          </button>
          <div className="flex items-center gap-2">
            {[
              { key: 'featured',   label: 'Nổi bật' },
              { key: 'newest',     label: 'Mới nhất' },
              { key: 'price-asc',  label: 'Giá thấp' },
              { key: 'price-desc', label: 'Giá cao' },
              { key: 'rating',     label: 'Đánh giá cao' },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setSortBy(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  sortBy === key ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-white'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Layout: sidebar + grid */}
        <div className="flex flex-col md:flex-row gap-6 items-start">

          {/* Sidebar lọc */}
          <FilterSidebar
            filters={filters}
            onChange={handleFiltersChange}
            allBrands={ALL_BRANDS}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            availableColors={catalogOptions.colors}
            availableStorages={catalogOptions.storages}
            availableRams={catalogOptions.rams}
          />

          {/* Grid sản phẩm */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="py-32 text-center bg-white rounded-3xl border border-gray-100">
                <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Đang tải sản phẩm...</p>
              </div>
            ) : displayed.length === 0 ? (
              <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-gray-200">
                <p className="text-5xl mb-4">🔍</p>
                <p className="font-black text-gray-800 text-lg uppercase tracking-widest mb-2">Không có sản phẩm</p>
                <p className="text-gray-400 text-sm mb-6">Thử điều chỉnh bộ lọc</p>
                <button onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="px-8 py-3 bg-gray-900 text-white font-black text-xs rounded-2xl hover:bg-red-600 transition-all tracking-widest uppercase">
                  Xóa bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayed.map((product) => (
                  <ProductCard key={product._id || product.id} product={product} />
                ))}
              </div>
            )}

            {/* SỬ DỤNG COMPONENT XEM THÊM TẠI ĐÂY */}
            <LoadMoreButton 
              visibleCount={visibleCount} 
              totalCount={filtered.length} 
              onLoadMore={handleLoadMore} 
            />
          </div>
        </div>
      </section>

      {/* ── CHÍNH SÁCH ──────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 mt-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: '🛡️', title: 'Bảo hành 12 tháng', sub: 'Chính hãng từ nhà sản xuất' },
            { icon: '🚀', title: 'Giao hàng 2h',       sub: 'Miễn phí cho đơn từ 10 triệu' },
            { icon: '💎', title: 'Đổi mới 30 ngày',    sub: 'Lỗi là đổi không chờ đợi' },
          ].map(({ icon, title, sub }) => (
            <div key={title} className="flex items-center gap-5 bg-white rounded-2xl px-6 py-5 border border-gray-100 hover:shadow-md transition-shadow">
              <span className="text-3xl">{icon}</span>
              <div>
                <p className="font-black text-gray-900 text-sm uppercase tracking-wider">{title}</p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};