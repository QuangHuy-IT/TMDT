import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { Home } from './pages/Home';
import { TimKiem } from './pages/TimKiem';
import { BrandProducts } from './pages/BrandProducts';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart/Cart';
import { Checkout } from './pages/Checkout';
import { Orders } from './pages/Orders';
import { OrderDetail } from './pages/OrderDetail';
import { Login } from './pages/auth/Login';
import { Register } from './pages/Register';
import { CompleteGoogleRegister } from './pages/auth/CompleteGoogleRegister';
import { OtpVerification } from './pages/auth/OtpVerification';
import { Profile } from './pages/Profile';
import { About } from './pages/About';
import { FlashSalePage } from './pages/FlashSalePage';
import { NewsPage } from './pages/NewsPage';
import { WarrantyPolicy } from './pages/WarrantyPolicy';
import { ReturnPolicy } from './pages/ReturnPolicy';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { ShippingPolicy } from './pages/ShippingPolicy';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminInventory } from './pages/admin/AdminInventory';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminUsers } from './pages/admin/AdminUsers';
import { ShopProvider } from './context/ShopContext';
import { ThemeProvider } from './context/ThemeContext';
import './App.css';
import { FloatingContactButton } from './components/contact/FloatingContactButton';
import { ChatbotPopup } from './components/contact/ChatbotPopup';
import ScrollToTop from './components/home/ScrollToTop';

class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
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
          <p className="mt-2 max-w-md text-sm text-gray-500">
            Đã xảy ra lỗi khi tải nội dung. Vui lòng tải lại trang hoặc quay về trang chủ.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={this.handleReload}
              className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-black"
            >
              Tải lại
            </button>
            <a
              href="/"
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-white"
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

const ScrollToRouteTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

function App() {
  const [chatbotOpen, setChatbotOpen] = useState(false);

  useEffect(() => {
    const loader = document.querySelector('.loader-div');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => { loader.style.display = 'none'; }, 500);
    }
  }, []);

  // Listen for chatbot open event dispatched from ContactMenu
  useEffect(() => {
    const handler = () => setChatbotOpen(true);
    window.addEventListener('openChatbot', handler);
    return () => window.removeEventListener('openChatbot', handler);
  }, []);

  return (
    <ThemeProvider>
      <ShopProvider>
        <Router>
          <ScrollToRouteTop />
          <Routes>
            <Route path="/admin" element={<ProtectedRoute isAdmin><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="inventory" element={<AdminInventory />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="users" element={<AdminUsers />} />
            </Route>

            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Register />} />
            <Route path="/complete-google-register" element={<CompleteGoogleRegister />} />
            <Route path="/verify-otp" element={<OtpVerification />} />

            <Route
              path="/*"
              element={(
                <div className="flex min-h-screen flex-col bg-white">
                  <Navbar />
                  <main className="flex-grow">
                    <RouteErrorBoundary>
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/products" element={<TimKiem />} />
                        <Route path="/tim-kiem" element={<TimKiem />} />
                        <Route path="/gioi-thieu" element={<About />} />
                        <Route path="/tin-tuc" element={<NewsPage />} />
                        <Route path="/khuyen-mai" element={<FlashSalePage />} />
                        <Route path="/chinh-sach-bao-hanh" element={<WarrantyPolicy />} />
                        <Route path="/chinh-sach-doi-tra" element={<ReturnPolicy />} />
                        <Route path="/chinh-sach-bao-mat" element={<PrivacyPolicy />} />
                        <Route path="/chinh-sach-giao-hang" element={<ShippingPolicy />} />
                        <Route path="/brands/:brandSlug" element={<BrandProducts />} />
                        <Route path="/product/:slug" element={<ProductDetail />} />
                        <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                        <Route path="/order/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
                        <Route path="/:brandName" element={<BrandProducts />} />
                        <Route
                          path="*"
                          element={(
                            <div className="py-20 text-center">
                              <h1 className="text-4xl font-black italic uppercase">404</h1>
                              <p className="mt-2 text-xs font-bold uppercase tracking-widest text-gray-500">
                                Trang không tồn tại.
                              </p>
                            </div>
                          )}
                        />
                      </Routes>
                    </RouteErrorBoundary>
                  </main>
                  <FloatingContactButton />
                  <ChatbotPopup isOpen={chatbotOpen} onClose={() => setChatbotOpen(false)} />
                  <ScrollToTop />
                  <Footer />
                </div>
              )}
            />
          </Routes>
        </Router>
      </ShopProvider>
    </ThemeProvider>
  );
}

export default App;
