import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShopContext } from '../../context/ShopContext';

export const Navbar = () => {
  const { state, dispatch } = useContext(ShopContext);
  const { user, isAuthenticated } = state;
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const cartCount = state.cart.length;

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    setIsUserMenuOpen(false);
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      // Sửa: đổi URL sang /tim-kiem?key=
      navigate(`/tim-kiem?key=${encodeURIComponent(searchValue.trim())}`);
      setSearchValue("");
    }
  };

  return (
    <nav className="bg-gray-900 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* 1. Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
            <div className="bg-red-600 p-1.5 rounded-lg group-hover:bg-red-700 transition-colors">
              <img src="/assets/images/icon/main/logo.svg" className="h-6 w-6 invert" alt="Logo" />
            </div>
            <span className="text-xl font-black tracking-tighter">HHShop</span>
          </Link>

          {/* 2. Search Bar (Desktop) */}
          <div className="flex-grow max-w-2xl hidden md:block">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full bg-gray-800 text-sm text-gray-200 rounded-full py-2 px-5 pr-12 focus:outline-none focus:ring-2 focus:ring-red-500 border border-transparent transition-all"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
              <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity">
                <img src="/assets/images/icon/main/search.svg" alt="search" className="h-5 w-5 invert" />
              </button>
            </form>
          </div>

          {/* 3. Actions */}
          <div className="flex items-center gap-2 md:gap-4">

            {/* Giỏ hàng */}
            <Link to="/cart" className="relative p-2 hover:bg-gray-800 rounded-full transition-colors">
              <img src="/assets/images/icon/main/cart.svg" alt="cart" className="h-6 w-6 invert" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-600 text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-gray-900">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Đăng nhập / User */}
            {!isAuthenticated ? (
              <Link to="/login" className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded-full transition-all group">
                <div className="bg-gray-700 p-1.5 rounded-full group-hover:bg-gray-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </div>
                <span className="hidden lg:inline text-sm font-medium">Đăng nhập</span>
              </Link>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 pr-3 hover:bg-gray-800 rounded-full transition-all border border-gray-700"
                >
                  <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center font-bold text-sm uppercase">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <span className="hidden md:inline text-sm font-medium max-w-[100px] truncate">
                    {user?.name || 'Tài khoản'}
                  </span>
                  <svg className={`h-4 w-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-2 z-50 text-gray-800 border border-gray-100">
                    <div className="px-4 py-2 md:hidden">
                      <p className="text-xs text-gray-400">Xin chào,</p>
                      <p className="font-bold truncate">{user?.name}</p>
                    </div>
                    <Link to="/profile" className="block px-4 py-2 text-sm hover:bg-gray-50 hover:text-red-600" onClick={() => setIsUserMenuOpen(false)}>Hồ sơ của tôi</Link>
                    <Link to="/orders" className="block px-4 py-2 text-sm hover:bg-gray-50 hover:text-red-600" onClick={() => setIsUserMenuOpen(false)}>Đơn hàng</Link>
                    {user?.role === 'admin' && (
                      <Link to="/admin" className="block px-4 py-2 text-sm text-blue-600 font-bold hover:bg-gray-50" onClick={() => setIsUserMenuOpen(false)}>Trang quản trị</Link>
                    )}
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 font-medium"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Hamburger (Mobile) */}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-gray-400">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};