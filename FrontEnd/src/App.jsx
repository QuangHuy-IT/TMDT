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
import { Cart } from './pages/Cart';
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
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminUsers } from './pages/admin/AdminUsers';

// Context
import { ShopProvider } from './context/ShopContext';

// CSS
import './App.css';

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
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders"   element={<AdminOrders />} />
            <Route path="users"    element={<AdminUsers />} />
          </Route>

          {/* ===== SHOP ROUTES (có Navbar + Footer) ===== */}
          <Route path="/*" element={
            <div className="flex flex-col min-h-screen bg-white">
              <Navbar />
              <main className="flex-grow">
                <Routes>
                  <Route path="/"            element={<Home />} />
                  <Route path="/tim-kiem"    element={<TimKiem />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/login"       element={<Login />} />
                  <Route path="/signup"      element={<Register />} />
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