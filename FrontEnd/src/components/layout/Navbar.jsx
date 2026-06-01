
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ShopContext } from '../../context/ShopContext';
import { usePublicBrands } from '../../hooks/usePublicBrands';

const SEARCH_HISTORY_KEY = 'hhshop_search_history';
const MAX_HISTORY = 5;

const BRAND_LINKS = [
  { label: 'iPhone', href: '/brands/iphone' },
  { label: 'Samsung', href: '/brands/samsung' },
  { label: 'Xiaomi', href: '/brands/xiaomi' },
  { label: 'OPPO', href: '/brands/oppo' },
  { label: 'vivo', href: '/brands/vivo' },
  { label: 'realme', href: '/brands/realme' },
  { label: 'Nokia', href: '/brands/nokia' },
  { label: 'TECNO', href: '/brands/tecno' },
];

const PRICE_LINKS = [
  { label: 'Dưới 5 triệu', value: 'under-5m' },
  { label: '5 - 10 triệu', value: '5-10m' },
  { label: '10 - 20 triệu', value: '10-20m' },
  { label: 'Trên 20 triệu', value: 'above-20m' },
];

const STORAGE_LINKS = ['64GB', '128GB', '256GB', '512GB', '1TB', '2TB'];

const POLICY_LINKS = [
  { label: 'Bảo hành', href: '/chinh-sach-bao-hanh' },
  { label: 'Đổi trả', href: '/chinh-sach-doi-tra' },
  { label: 'Bảo mật', href: '/chinh-sach-bao-mat' },
  { label: 'Giao hàng', href: '/chinh-sach-giao-hang' },
];

const DropdownPanel = ({ visible, widthClass = 'w-[520px]', children }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.18 }}
        className={`absolute left-0 top-full mt-3 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_22px_60px_rgba(15,23,42,0.14)] ${widthClass} z-50`}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

const BrandBadge = ({ brand, closeMenu }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const hasLogo = Boolean(brand?.logoUrl) && !imageFailed;

  return (
    <Link
      to={`/brands/${brand.slug}`}
      onClick={closeMenu}
      className="group flex min-h-[92px] flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 px-3 py-4 text-center transition-all hover:-translate-y-0.5 hover:border-slate-200 hover:bg-white hover:shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
    >
      {hasLogo ? (
        <img
          src={brand.logoUrl}
          alt={brand.name}
          loading="lazy"
          className="h-10 w-20 object-contain"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="line-clamp-2 text-sm font-black uppercase tracking-[0.02em] text-slate-700">
          {brand.name}
        </span>
      )}
    </Link>
  );
};

export const Navbar = () => {
  const { state, dispatch } = useContext(ShopContext);
  const { user, isAuthenticated } = state;
  const isAdmin = user?.role?.toLowerCase?.() === 'admin';
  const navigate = useNavigate();
  const { brands, loading: brandsLoading } = usePublicBrands();

  const [searchValue, setSearchValue] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [scrolled, setScrolled] = useState(false);

  const searchRef = useRef(null);
  const navRef = useRef(null);

  const cartCount = state.cart.length;
  const featuredBrands = useMemo(() => brands.slice(0, 12), [brands]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]');
    setSearchHistory(Array.isArray(stored) ? stored : []);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowHistory(false);
      }
      if (navRef.current && !navRef.current.contains(event.target)) {
        setActiveMenu(null);
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const saveHistory = (value) => {
    const updated = [value, ...searchHistory.filter((entry) => entry !== value)].slice(0, MAX_HISTORY);
    setSearchHistory(updated);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const query = searchValue.trim();
    if (!query) {
      return;
    }

    saveHistory(query);
    setShowHistory(false);
    setSearchValue('');
    navigate(`/products?key=${encodeURIComponent(query)}`);
  };

  const handleHistoryClick = (value) => {
    setShowHistory(false);
    navigate(`/products?key=${encodeURIComponent(value)}`);
  };

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
    navigate('/');
  };

  return (
    <>
      <nav
        ref={navRef}
        className={`sticky top-0 z-50 border-b border-slate-200 transition-all duration-300 ${scrolled ? 'bg-white/92 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl' : 'bg-white'
          }`}
      >
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-20 items-center gap-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#111827] p-2 text-white shadow-[0_10px_30px_rgba(15,23,42,0.22)]">
                <img src="/assets/images/icon/main/logo.svg" className="h-6 w-6 invert" alt="Logo" />
              </div>
              <div>
                <p className="text-lg font-black uppercase tracking-tight text-slate-950">HHShop</p>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Mobile Store</p>
              </div>
            </Link>

            <div className="hidden items-center gap-2 lg:flex">
              <div
                className="relative"
                onMouseEnter={() => setActiveMenu('catalog')}
                onMouseLeave={() => setActiveMenu((current) => (current === 'catalog' ? null : current))}
              >
                <button className="rounded-2xl px-4 py-2.5 text-sm font-black text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950">
                  Danh mục
                </button>
                <DropdownPanel visible={activeMenu === 'catalog'} widthClass="w-[740px]">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Explore</p>
                      <h3 className="text-xl font-black text-slate-950">Danh mục</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-8">
                    <section>
                      <p className="mb-4 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Hãng điện thoại</p>
                      <div className="space-y-2">
                        {brandsLoading
                          ? Array.from({ length: 8 }).map((_, index) => (
                            <div key={index} className="h-6 w-32 animate-pulse rounded bg-slate-100" />
                          ))
                          : featuredBrands.map((brand) => (
                            <Link
                              key={brand.id || brand.slug}
                              to={`/brands/${brand.slug}`}
                              onClick={() => setActiveMenu(null)}
                              className="block text-sm font-semibold text-slate-700 transition-colors hover:text-red-600"
                            >
                              {brand.name}
                            </Link>
                          ))}
                      </div>
                    </section>

                    <section>
                      <p className="mb-4 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Mức giá điện thoại</p>
                      <div className="space-y-2">
                        {PRICE_LINKS.map((item) => (
                          <Link
                            key={item.value}
                            to={`/products?price=${item.value}`}
                            onClick={() => setActiveMenu(null)}
                            className="block text-sm font-semibold text-slate-700 transition-colors hover:text-red-600"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </section>

                    <section>
                      <p className="mb-4 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Dung lượng</p>
                      <div className="space-y-2">
                        {STORAGE_LINKS.map((value) => (
                          <Link
                            key={value}
                            to={`/products?storage=${value.toLowerCase()}`}
                            onClick={() => setActiveMenu(null)}
                            className="block text-sm font-semibold text-slate-700 transition-colors hover:text-red-600"
                          >
                            {value}
                          </Link>
                        ))}
                      </div>
                    </section>

                    <section>
                      <p className="mb-4 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Tiện ích</p>
                      <div className="space-y-2">
                        <Link
                          to="/khuyen-mai"
                          onClick={() => setActiveMenu(null)}
                          className="flex items-center gap-2 text-sm font-semibold text-red-600 transition-colors hover:text-red-700"
                        >
                          <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Khuyến mãi
                        </Link>
                        <Link
                          to="/gioi-thieu"
                          onClick={() => setActiveMenu(null)}
                          className="flex items-center gap-2 text-sm font-semibold text-slate-700 transition-colors hover:text-red-600"
                        >
                          <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          Giới thiệu công ty
                        </Link>
                        <Link
                          to="/tin-tuc"
                          onClick={() => setActiveMenu(null)}
                          className="flex items-center gap-2 text-sm font-semibold text-slate-700 transition-colors hover:text-red-600"
                        >
                          <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                          </svg>
                          Tin tức
                        </Link>
                        <div className="pt-1">
                          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Chính sách</p>
                          {POLICY_LINKS.map((item) => (
                            <Link
                              key={item.href}
                              to={item.href}
                              onClick={() => setActiveMenu(null)}
                              className="block pl-5 text-sm font-semibold text-slate-600 transition-colors hover:text-red-600"
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </section>
                  </div>
                </DropdownPanel>
              </div>
            </div>

            <div ref={searchRef} className="relative hidden max-w-2xl flex-1 lg:block">
              <form onSubmit={handleSearch}>
                <input
                  type="text"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  onFocus={() => setShowHistory(true)}
                  placeholder="Tìm sản phẩm, thương hiệu, series..."
                  className="w-full rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-3 pr-12 text-sm font-medium text-slate-900 outline-none transition-all focus:border-slate-300 focus:bg-white focus:shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
                />
                <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 z-10 transition-colors hover:text-slate-900">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
              <AnimatePresence>
                {showHistory && searchHistory.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.16 }}
                    className="absolute top-full mt-3 w-full rounded-[24px] border border-slate-200 bg-white py-2 shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
                  >
                    <p className="px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Recent Search</p>
                    {searchHistory.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handleHistoryClick(item)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3A9 9 0 113 12a9 9 0 0118 0z" />
                        </svg>
                        {item}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Link to="/cart" className="relative z-20 rounded-2xl p-3 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-2 2.2A1 1 0 005.8 17H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white"
                  >
                    {cartCount > 9 ? '9+' : cartCount}
                  </motion.span>
                )}
              </Link>

              {!isAuthenticated ? (
                <Link
                  to="/login"
                  className="hidden rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:bg-slate-800 lg:inline-flex"
                >
                  Đăng nhập
                </Link>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen((current) => !current)}
                    className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-1.5 transition-all hover:border-slate-300 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-black uppercase text-white">
                      {user?.fullName?.charAt(0) || 'U'}
                    </span>
                    <span className="hidden max-w-[110px] truncate text-sm font-bold text-slate-700 lg:inline">
                      {user?.fullName}
                    </span>
                  </button>
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.16 }}
                        className="absolute right-0 mt-3 w-52 rounded-[24px] border border-slate-200 bg-white p-2 shadow-[0_18px_40px_rgba(15,23,42,0.14)]"
                      >
                        <div className="border-b border-slate-100 px-3 py-3">
                          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Tài khoản</p>
                          <p className="mt-1 truncate text-sm font-bold text-slate-900">{user?.fullName}</p>
                        </div>
                        <Link to="/profile" onClick={() => setIsUserMenuOpen(false)} className="mt-2 block rounded-2xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                          Hồ sơ của tôi
                        </Link>
                        <Link to="/orders" onClick={() => setIsUserMenuOpen(false)} className="block rounded-2xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                          Đơn hàng
                        </Link>
                        {/* Admin link removed from main user menu to require separate admin login */}
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="mt-1 w-full rounded-2xl px-3 py-2.5 text-left text-sm font-bold text-red-500 hover:bg-red-50"
                        >
                          Đăng xuất
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsMenuOpen(true)}
                className="rounded-2xl p-3 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:hidden"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 220, damping: 26 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[320px] flex-col bg-white shadow-[0_24px_70px_rgba(15,23,42,0.22)] lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <p className="text-lg font-black uppercase text-slate-950">HHShop</p>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Navigation</p>
                </div>
                <button type="button" onClick={() => setIsMenuOpen(false)} className="rounded-2xl p-2 text-slate-500 hover:bg-slate-100">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={(event) => { handleSearch(event); setIsMenuOpen(false); }} className="border-b border-slate-200 px-5 py-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    placeholder="Tìm sản phẩm..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm font-medium text-slate-900 outline-none"
                  />
                  <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 z-10 transition-colors hover:text-slate-900">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </form>

              <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
                <section>
                  <p className="mb-3 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Danh mục</p>
                  <div className="space-y-6">
                    <div>
                      <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Hãng điện thoại</p>
                      <div className="grid grid-cols-2 gap-3">
                        {featuredBrands.map((brand) => (
                          <BrandBadge key={brand.id || brand.slug} brand={brand} closeMenu={() => setIsMenuOpen(false)} />
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Mức giá</p>
                      <div className="grid gap-2">
                        {PRICE_LINKS.map((item) => (
                          <Link
                            key={item.value}
                            to={`/products?price=${item.value}`}
                            onClick={() => setIsMenuOpen(false)}
                            className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Dung lượng</p>
                      <div className="grid grid-cols-3 gap-2">
                        {STORAGE_LINKS.map((value) => (
                          <Link
                            key={value}
                            to={`/products?storage=${value.toLowerCase()}`}
                            onClick={() => setIsMenuOpen(false)}
                            className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 text-center text-sm font-black text-slate-700"
                          >
                            {value}
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Tiện ích</p>
                      <div className="space-y-2">
                        <Link
                          to="/khuyen-mai"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-black text-red-600"
                        >
                          <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Khuyến mãi
                        </Link>
                        <Link
                          to="/gioi-thieu"
                          onClick={() => setIsMenuOpen(false)}
                          className="block rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700"
                        >
                          Giới thiệu công ty
                        </Link>
                        <Link
                          to="/tin-tuc"
                          onClick={() => setIsMenuOpen(false)}
                          className="block rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700"
                        >
                          Tin tức
                        </Link>
                      </div>
                    </div>

                    <div>
                      <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Chính sách</p>
                      <div className="grid grid-cols-2 gap-2">
                        {POLICY_LINKS.map((item) => (
                          <Link
                            key={item.href}
                            to={item.href}
                            onClick={() => setIsMenuOpen(false)}
                            className="block rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 text-center text-sm font-semibold text-slate-700"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div className="border-t border-slate-200 px-5 py-4">
                {!isAuthenticated ? (
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-black text-white"
                  >
                    Đăng nhập
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full rounded-2xl border border-red-200 px-4 py-3 text-sm font-black text-red-500"
                  >
                    Đăng xuất
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
