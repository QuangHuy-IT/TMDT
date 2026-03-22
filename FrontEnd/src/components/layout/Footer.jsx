import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Cột 1: Brand & About */}
          <div className="space-y-4">
            <h5 className="text-white text-xl font-bold tracking-tighter">NEW TECH</h5>
            <p className="text-sm leading-relaxed text-gray-400">
              Điểm đến tin cậy cho các tín đồ công nghệ. Chúng tôi cung cấp những thiết bị chính hãng với dịch vụ hậu mãi tốt nhất.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="hover:text-blue-500 transition-colors"><i className="bi bi-facebook text-xl"></i></a>
              <a href="#" className="hover:text-pink-500 transition-colors"><i className="bi bi-instagram text-xl"></i></a>
              <a href="#" className="hover:text-red-500 transition-colors"><i className="bi bi-youtube text-xl"></i></a>
            </div>
          </div>

          {/* Cột 2: Quick Links */}
          <div>
            <h5 className="text-white text-lg font-semibold mb-6">Sitemap</h5>
            <ul className="space-y-3">
              <li><Link to="/" className="text-sm hover:text-white hover:translate-x-1 inline-block transition-all">Home</Link></li>
              <li><Link to="/shop" className="text-sm hover:text-white hover:translate-x-1 inline-block transition-all">Shop</Link></li>
              <li><Link to="/new" className="text-sm hover:text-white hover:translate-x-1 inline-block transition-all">New Arrivals</Link></li>
              <li><Link to="/brands" className="text-sm hover:text-white hover:translate-x-1 inline-block transition-all">Brands</Link></li>
            </ul>
          </div>

          {/* Cột 3: Support */}
          <div>
            <h5 className="text-white text-lg font-semibold mb-6">Support</h5>
            <ul className="space-y-3">
              <li><Link to="/contact" className="text-sm hover:text-white hover:translate-x-1 inline-block transition-all">Contact</Link></li>
              <li><Link to="/faq" className="text-sm hover:text-white hover:translate-x-1 inline-block transition-all">FAQs</Link></li>
              <li><Link to="/policy" className="text-sm hover:text-white hover:translate-x-1 inline-block transition-all">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Cột 4: Contact Info */}
          <div>
            <h5 className="text-white text-lg font-semibold mb-6">Contact</h5>
            <div className="space-y-4 text-sm text-gray-400">
              <p className="flex items-center gap-3">
                <i className="bi bi-envelope text-red-500"></i> info@newtech.com
              </p>
              <p className="flex items-center gap-3">
                <i className="bi bi-telephone text-red-500"></i> +84 123 456 789
              </p>
              <p className="flex items-center gap-3">
                <i className="bi bi-geo-alt text-red-500"></i> Hanoi, Vietnam
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 my-10"></div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-xs text-gray-500">
            &copy; {currentYear} <span className="text-gray-300 font-medium">New Tech Store</span>. All rights reserved.
          </div>
          <div className="flex items-center gap-4 bg-gray-800/50 p-2 px-4 rounded-full">
             <img src="https://img.icons8.com/color/48/visa.png" className="h-6 grayscale hover:grayscale-0 transition-all" alt="visa"/>
             <img src="https://img.icons8.com/color/48/mastercard.png" className="h-6 grayscale hover:grayscale-0 transition-all" alt="mastercard"/>
             <img src="https://img.icons8.com/color/48/paypal.png" className="h-6 grayscale hover:grayscale-0 transition-all" alt="paypal"/>
          </div>
        </div>
      </div>
    </footer>
  );
};