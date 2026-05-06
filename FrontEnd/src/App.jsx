import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// Layout & Components
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Pages
import { Home } from './pages/Home';
import { TimKiem } from './pages/TimKiem';
import { BrandProducts } from './pages/BrandProducts';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart/Cart';
import { Checkout } from './pages/Checkout';
import { Orders } from './pages/Orders';
import { OrderDetail } from './pages/OrderDetail';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Profile } from './pages/Profile';

// Admin Pages
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminInventory } from './pages/admin/AdminInventory';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminUsers } from './pages/admin/AdminUsers';
import AdminBrands from './pages/admin/AdminBrands';
import AdminBanners from './pages/admin/AdminBanners';
import AdminPromotions from './pages/admin/AdminPromotions';

// Context
import { ShopProvider } from './context/ShopContext';

// CSS
import './App.css';

class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    // Keep console details for debugging while preventing a blank page for users.
    console.error('Route render error:', error);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center bg-gray-50">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Không thể hiển thị trang này</h2>
          <p className="text-sm text-gray-500 mt-2 max-w-md">
            Đã xảy ra lỗi khi tải nội dung. Vui lòng tải lại trang hoặc quay về trang chủ.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={this.handleReload}
              className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-black transition-colors"
            >
              Tải lại
            </button>
            <a
              href="/"
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-700 hover:bg-white transition-colors"
            >
              Về trang chủ
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

function App() {
  useEffect(() => {
    const loader = document.querySelector('.loader-div');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => { loader.style.display = 'none'; }, 500);
    }
  }, []);

  return (
    <ShopProvider>
      <Router>
        <ScrollToTop />
        <Routes>

          {/* ===== ADMIN ROUTES (layout riêng, không có Navbar/Footer) ===== */}
          <Route path="/admin" element={
            <ProtectedRoute isAdmin>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="products"    element={<AdminProducts />} />
            <Route path="brands"      element={<AdminBrands />} />
            <Route path="banners"    element={<AdminBanners />} />
            <Route path="promotions"  element={<AdminPromotions />} />
            <Route path="inventory"   element={<AdminInventory />} />
            <Route path="orders"      element={<AdminOrders />} />
            <Route path="users"       element={<AdminUsers />} />
          </Route>
          {/* ===== AUTH ROUTES (không có Navbar + Footer) ===== */}
          <Route path="/login"       element={<Login />} />
          <Route path="/signup"      element={<Register />} />

          {/* ===== SHOP ROUTES (có Navbar + Footer) ===== */}
          <Route path="/*" element={
            <div className="flex flex-col min-h-screen bg-white">
              <Navbar />
              <main className="flex-grow">
                <RouteErrorBoundary>
                  <Routes>
                    <Route path="/"            element={<Home />} />
                    <Route path="/tim-kiem"    element={<TimKiem />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/cart"        element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                    <Route path="/checkout"    element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                    <Route path="/profile"     element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/orders"      element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                    <Route path="/order/:id"   element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
                    {/* Route động :brandName đặt cuối */}
                    <Route path="/:brandName"  element={<BrandProducts />} />
                    <Route path="*" element={
                      <div className="py-20 text-center">
                        <h1 className="text-4xl font-black italic uppercase">404</h1>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-2">Trang không tồn tại.</p>
                      </div>
                    } />
                  </Routes>
                </RouteErrorBoundary>
              </main>
              <Footer />
            </div>
          } />

        </Routes>
      </Router>
    </ShopProvider>
  );
}

export default App;