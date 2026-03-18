import React, { useState, useMemo, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { products } from '../data/products';
import { brands } from '../data/brands';
import { banners } from '../data/banners';

const ITEMS_PER_PAGE = 12;

// ─── Lấy giá min/max từ data ───────────────────────────────────────────────
const PRICE_MIN = Math.min(...products.map((p) => p.price));
const PRICE_MAX = Math.max(...products.map((p) => p.price));
const ALL_BRANDS = brands.map(b => b.name);

// ─── ProductCard mới — layout dọc, hover reveal ───────────────────────────
const HomeProductCard = ({ product }) => {
  const { state, dispatch } = useContext(ShopContext);
  const { isAuthenticated } = state;
  const navigate = useNavigate();
  const thumbnail = (product.images && product.images[0]) || product.image || '';
  const productId  = product._id || product.id;
  const avg = product.rating || 0;

  const handleCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { navigate('/login'); return; }
    dispatch({ type: 'ADD_TO_CART', payload: { ...product, quantity: 1 } });
  };

  return (
    <div
      onClick={() => navigate(`/product/${productId}`)}
      className="group relative bg-white rounded-3xl overflow-hidden cursor-pointer border border-gray-100
                 hover:border-transparent hover:shadow-2xl hover:shadow-gray-200/80 transition-all duration-400"
    >
      {/* Ảnh */}
      <div className="relative bg-gray-50 aspect-square overflow-hidden">
        {/* Badge hết hàng */}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/30 z-10 flex items-center justify-center">
            <span className="bg-white/90 text-gray-800 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
              Hết hàng
            </span>
          </div>
        )}
        {/* Badge nổi bật */}
        {product.isFeatured && (
          <div className="absolute top-3 left-3 z-10 bg-red-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg">
            Hot
          </div>
        )}
        <img
          src={thumbnail}
          alt={product.name}
          className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500 ease-out"
          onError={(e) => { e.target.src = 'https://picsum.photos/seed/fallback/400/400'; }}
        />
        {/* Nút thêm giỏ — slide lên khi hover */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out p-3 z-20">
          <button
            onClick={handleCart}
            disabled={product.stock === 0}
            className="w-full py-2.5 bg-gray-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl
                       hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200
                       flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {product.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">{product.brand}</p>
        <h3 className="text-sm font-bold text-gray-900 leading-snug mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
          {product.name}
        </h3>

        {/* Stars */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map((s) => (
              <svg key={s} className={`w-3 h-3 ${s <= Math.round(avg) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            ))}
          </div>
          <span className="text-[10px] text-gray-400">({product.numReviews || 0})</span>
        </div>

        {/* Giá + stock */}
        <div className="flex items-end justify-between">
          <span className="text-base font-black text-red-600 tracking-tight">
            {product.price.toLocaleString('vi-VN')}₫
          </span>
          <span className={`text-[10px] font-bold ${(product.stock ?? 0) > 0 ? 'text-green-500' : 'text-gray-400'}`}>
            {(product.stock ?? 0) > 0 ? `Còn ${product.stock}` : 'Hết'}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Chip lọc ────────────────────────────────────────────────────────────────
const FilterChip = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
      active
        ? 'bg-gray-900 text-white border-gray-900'
        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-800'
    }`}
  >
    {children}
  </button>
);

// ─── Main ────────────────────────────────────────────────────────────────────
export const Home = () => {
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Bộ lọc
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [sortBy,         setSortBy]         = useState('featured');
  const [priceRange,     setPriceRange]      = useState([PRICE_MIN, PRICE_MAX]);
  const [minStock,       setMinStock]        = useState(false); // chỉ còn hàng
  const [viewMode,       setViewMode]        = useState('grid'); // grid | list
  const [showFilters,    setShowFilters]     = useState(false);


  // Banner auto-play
  useEffect(() => {
    if (!banners.length) return;
    const t = setInterval(() =>
      setActiveSlide((p) => (p === banners.length - 1 ? 0 : p + 1)),
      5000
    );
    return () => clearInterval(t);
  }, []);

  // Reset trang khi filter thay đổi
  useEffect(() => { setCurrentPage(1); }, [selectedBrands, sortBy, priceRange, minStock]);

  const toggleBrand = (brand) =>
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );

  const clearFilters = () => {
    setSelectedBrands([]);
    setSortBy('featured');
    setPriceRange([PRICE_MIN, PRICE_MAX]);
    setMinStock(false);
  };

  const activeFilterCount = selectedBrands.length
    + (sortBy !== 'featured' ? 1 : 0)
    + (priceRange[0] !== PRICE_MIN || priceRange[1] !== PRICE_MAX ? 1 : 0)
    + (minStock ? 1 : 0);

  // Lọc + sắp xếp
  const filtered = useMemo(() => {
    let list = [...products];

    if (selectedBrands.length > 0)
      list = list.filter((p) => selectedBrands.includes(p.brand));

    list = list.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    if (minStock) list = list.filter((p) => (p.stock ?? 0) > 0);

    switch (sortBy) {
      case 'price-asc':   list.sort((a, b) => a.price - b.price);    break;
      case 'price-desc':  list.sort((a, b) => b.price - a.price);    break;
      case 'rating':      list.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case 'reviews':     list.sort((a, b) => (b.numReviews || 0) - (a.numReviews || 0)); break;
      case 'newest':      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
      case 'featured':
      default:
        list.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }

    return list;
  }, [selectedBrands, sortBy, priceRange, minStock]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const displayed  = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 4)           return [1,2,3,4,5,'...',totalPages];
    if (currentPage >= totalPages-3) return [1,'...',totalPages-4,totalPages-3,totalPages-2,totalPages-1,totalPages];
    return [1,'...',currentPage-1,currentPage,currentPage+1,'...',totalPages];
  };

  return (
    <main className="min-h-screen bg-[#f8f8f6] pb-20">

      {/* ── BANNER ───────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 pt-6">
        <div className="relative h-[200px] md:h-[440px] overflow-hidden rounded-[2rem] shadow-2xl bg-gray-200">
          {banners.map((banner, i) => (
            <div key={i} className={`absolute inset-0 transition-opacity duration-1000 ${activeSlide === i ? 'opacity-100' : 'opacity-0'}`}>
              <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent flex items-end md:items-center px-8 md:px-14 pb-8 md:pb-0">
                <div className="text-white">
                  <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-white/60 mb-2">Khuyến mãi đặc biệt</p>
                  <h2 className="text-2xl md:text-5xl font-black uppercase italic leading-tight mb-4 drop-shadow-lg">
                    {banner.title}
                  </h2>
                  <button
                    onClick={() => navigate(banner.link || '/tim-kiem')}
                    className="bg-white text-gray-900 px-6 py-2.5 md:px-8 md:py-3 rounded-full font-black text-xs tracking-widest
                               hover:bg-red-600 hover:text-white transition-all duration-300 shadow-lg"
                  >
                    Khám phá ngay →
                  </button>
                </div>
              </div>
            </div>
          ))}
          {/* Dots */}
          <div className="absolute bottom-5 right-6 flex gap-2">
            {banners.map((_, i) => (
              <button key={i} onClick={() => setActiveSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-500 ${activeSlide === i ? 'bg-white w-8' : 'bg-white/40 w-2'}`}
              />
            ))}
          </div>
          {/* Slide counter */}
          <div className="absolute top-5 right-6 bg-black/30 backdrop-blur-sm text-white text-[10px] font-black px-3 py-1 rounded-full">
            {activeSlide + 1} / {banners.length}
          </div>
        </div>
      </section>

      {/* ── BRANDS ───────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 mt-14">
        <div className="flex items-center gap-4 mb-6">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] whitespace-nowrap">
            Thương hiệu
          </p>
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap uppercase tracking-wider">
            {brands.length} thương hiệu
          </span>
        </div>

        {/* Sử dụng flex-wrap trực tiếp giúp layout tự động xuống dòng mượt mà hơn */}
        <div className="flex flex-wrap gap-2">
          {brands.map((brand) => (
            <button
              key={brand._id}
              onClick={() => navigate(`/${brand.slug}`)}
              className="group px-4 py-2 bg-white border border-gray-200 rounded-sm transition-all duration-200"
            >
              <span className="text-xs font-bold text-gray-600 group-hover:text-red-600 uppercase tracking-tight whitespace-nowrap transition-colors">
                {brand.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ── SẢN PHẨM + BỘ LỌC ────────────────────────────────── */}
      <section id="products-section" className="max-w-7xl mx-auto px-4 mt-16 scroll-mt-20">

        {/* Tiêu đề section */}
        <div className="flex items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              Tất cả sản phẩm
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {filtered.length} sản phẩm
              {selectedBrands.length > 0 && ` · ${selectedBrands.join(', ')}`}
            </p>
          </div>

          {/* View toggle + filter toggle (mobile) */}
          <div className="flex items-center gap-2">
            {/* Grid / List */}
            <div className="hidden md:flex items-center bg-white border border-gray-200 rounded-xl p-1 gap-1">
              {[
                { mode: 'grid', icon: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></> },
                { mode: 'list', icon: <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></> },
              ].map(({ mode, icon }) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className={`p-2 rounded-lg transition-all ${viewMode === mode ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-700'}`}>
                  <svg className="w-4 h-4" fill={mode === 'grid' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={mode === 'list' ? 2 : 0} viewBox="0 0 24 24">{icon}</svg>
                </button>
              ))}
            </div>

            {/* Toggle filter panel */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                showFilters ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              Bộ lọc
              {activeFilterCount > 0 && (
                <span className="bg-red-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── BỘ LỌC PANEL ──────────────────────────────────── */}
        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-md p-6 mb-8 shadow-sm"> {/* Thay rounded-2xl bằng rounded-md */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

              {/* Sắp xếp */}
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Sắp xếp theo</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'featured',   label: 'Nổi bật' },
                    { key: 'newest',     label: 'Mới nhất' },
                    { key: 'price-asc',  label: 'Giá tăng dần' },
                    { key: 'price-desc', label: 'Giá giảm dần' },
                    { key: 'rating',     label: 'Đánh giá cao' },
                    { key: 'reviews',    label: 'Nhiều review' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setSortBy(key)}
                      className={`px-3 py-1.5 text-xs font-bold border transition-all ${
                        sortBy === key 
                          ? 'bg-black border-black text-white' 
                          : 'bg-white border-gray-200 text-gray-600 hover:border-black'
                      } rounded-sm`} // Bo vuông góc nhẹ
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Thương hiệu */}
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Thương hiệu</p>
                <div className="flex flex-wrap gap-2">
                  {ALL_BRANDS.map((brand) => (
                    <button
                      key={brand}
                      onClick={() => toggleBrand(brand)}
                      className={`px-3 py-1.5 text-xs font-bold border transition-all ${
                        selectedBrands.includes(brand)
                          ? 'bg-black border-black text-white'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-black'
                      } rounded-sm`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </div>

              {/* Khoảng giá */}
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                  Khoảng giá &nbsp;
                  <span className="text-gray-600 normal-case font-bold text-[11px]">
                    {priceRange[0].toLocaleString('vi-VN')}₫ — {priceRange[1].toLocaleString('vi-VN')}₫
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Dưới 10tr',    min: PRICE_MIN,  max: 10000000  },
                    { label: '10 – 20tr',     min: 10000000,   max: 20000000  },
                    { label: '20 – 30tr',     min: 20000000,   max: 30000000  },
                    { label: 'Trên 30tr',     min: 30000000,   max: PRICE_MAX },
                  ].map(({ label, min, max }) => (
                    <button
                      key={label}
                      onClick={() => setPriceRange([min, max])}
                      className={`px-3 py-1.5 text-xs font-bold border transition-all ${
                        priceRange[0] === min && priceRange[1] === max
                          ? 'bg-black border-black text-white'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-black'
                      } rounded-sm`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tiêu chí khác */}
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Tiêu chí khác</p>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div
                      onClick={() => setMinStock((v) => !v)}
                      className={`w-10 h-5 rounded-sm transition-colors flex items-center px-0.5 ${minStock ? 'bg-black' : 'bg-gray-200'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-sm shadow transition-transform ${minStock ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                    <span className="text-sm font-bold text-gray-600 group-hover:text-black transition-colors">
                      Chỉ còn hàng
                    </span>
                  </label>
                </div>

                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 flex items-center gap-1.5 text-xs font-bold text-red-500 hover:underline"
                  >
                    Xóa tất cả ({activeFilterCount})
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── ACTIVE FILTER TAGS (Các tag đang chọn) ────────────────── */}
        {activeFilterCount > 0 && !showFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-xs font-black text-gray-400 uppercase tracking-wider">Đang lọc:</span>
            {selectedBrands.map((b) => (
              <span key={b} className="flex items-center gap-1 bg-black text-white text-[10px] font-bold px-2 py-1 rounded-sm uppercase">
                {b}
                <button onClick={() => toggleBrand(b)} className="ml-1 hover:text-red-400 text-lg leading-none">×</button>
              </span>
            ))}
            {/* Các tag khác tương tự thay rounded-full thành rounded-sm */}
          </div>
        )}

        {/* ── QUICK SORT BAR (Thanh chọn nhanh) ───────────────────── */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1 scrollbar-hide">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap flex-shrink-0">Sắp xếp:</span>
          {[
            { key: 'featured',   label: 'Nổi bật' },
            { key: 'newest',     label: 'Mới nhất' },
            { key: 'price-asc',  label: 'Giá thấp' },
            { key: 'price-desc', label: 'Giá cao' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`flex-shrink-0 px-4 py-2 rounded-sm text-xs font-bold transition-all border ${
                sortBy === key
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-black'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── GRID / LIST SẢN PHẨM ──────────────────────────── */}
        {displayed.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-gray-200">
            <p className="text-5xl mb-4">🔍</p>
            <p className="font-black text-gray-800 text-lg uppercase tracking-widest mb-2">Không có sản phẩm</p>
            <p className="text-gray-400 text-sm mb-6">Thử điều chỉnh bộ lọc của bạn</p>
            <button onClick={clearFilters}
              className="px-8 py-3 bg-gray-900 text-white font-black text-xs rounded-2xl hover:bg-red-600 transition-all tracking-widest uppercase">
              Xóa bộ lọc
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {displayed.map((product) => (
              <HomeProductCard key={product._id || product.id} product={product} />
            ))}
          </div>
        ) : (
          /* List view */
          <div className="space-y-3">
            {displayed.map((product) => {
              const thumbnail = (product.images && product.images[0]) || product.image;
              const productId = product._id || product.id;
              return (
                <div
                  key={productId}
                  onClick={() => navigate(`/product/${productId}`)}
                  className="group flex items-center gap-5 bg-white rounded-2xl p-4 border border-gray-100
                             hover:border-gray-300 hover:shadow-md cursor-pointer transition-all"
                >
                  <div className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100">
                    <img src={thumbnail} alt={product.name}
                      className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => { e.target.src = 'https://picsum.photos/seed/fallback/80/80'; }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{product.brand}</p>
                    <h3 className="font-bold text-gray-900 text-sm mt-0.5 truncate group-hover:text-red-600 transition-colors">{product.name}</h3>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{product.description}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map((s) => (
                          <svg key={s} className={`w-3 h-3 ${s <= Math.round(product.rating||0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                          </svg>
                        ))}
                      </div>
                      <span className="text-[10px] text-gray-400">({product.numReviews || 0})</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="text-lg font-black text-red-600">{product.price.toLocaleString('vi-VN')}₫</span>
                    <span className={`text-[10px] font-bold ${(product.stock??0) > 0 ? 'text-green-500' : 'text-gray-400'}`}>
                      {(product.stock??0) > 0 ? `Còn ${product.stock}` : 'Hết hàng'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── PHÂN TRANG ────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="mt-14 flex flex-col items-center gap-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Trang {currentPage}/{totalPages} · {filtered.length} sản phẩm
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
                className="w-10 h-10 flex items-center justify-center rounded-2xl border-2 border-gray-200 text-gray-500 font-black
                           hover:border-gray-900 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                ←
              </button>
              {getPageNumbers().map((page, i) =>
                page === '...' ? (
                  <span key={`d${i}`} className="w-10 h-10 flex items-center justify-center text-gray-400 font-bold">···</span>
                ) : (
                  <button key={page} onClick={() => handlePageChange(page)}
                    className={`w-10 h-10 flex items-center justify-center rounded-2xl font-black text-sm transition-all ${
                      currentPage === page
                        ? 'bg-gray-900 text-white border-2 border-gray-900 scale-110 shadow-xl'
                        : 'border-2 border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900'
                    }`}>{page}</button>
                )
              )}
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}
                className="w-10 h-10 flex items-center justify-center rounded-2xl border-2 border-gray-200 text-gray-500 font-black
                           hover:border-gray-900 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                →
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── CHÍNH SÁCH ───────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 mt-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: '🛡️', title: 'Bảo hành 12 tháng',  sub: 'Chính hãng từ nhà sản xuất' },
            { icon: '🚀', title: 'Giao hàng 2h',        sub: 'Miễn phí cho đơn từ 10 triệu' },
            { icon: '💎', title: 'Đổi mới 30 ngày',     sub: 'Lỗi là đổi không chờ đợi' },
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