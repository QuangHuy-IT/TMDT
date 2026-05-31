import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import FlashSaleSection from '../components/flash-sale/FlashSaleSection';
import flashSaleService from '../services/flashSaleService';

export const FlashSalePage = () => {
  useEffect(() => {
    document.title = 'Khuyến mãi - Flash Sale | HHShop';
    window.scrollTo(0, 0);
  }, []);

  const { data: flashSaleData, isLoading } = useQuery({
    queryKey: ['flashSalePageData'],
    queryFn: flashSaleService.getFlashSaleData,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: true,
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/30 to-slate-50 pb-20">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-red-700 via-red-600 to-red-800 py-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1 bg-yellow-400 text-red-800 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
              ⚡ Flash Sale
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            Khuyến mãi cực sốc
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-red-100">
            Giảm đến 50% cho hàng ngàn sản phẩm điện thoại chính hãng. Số lượng có hạn, nhanh tay không bỏ lỡ!
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/products"
              className="rounded-xl bg-yellow-400 px-6 py-3 text-sm font-black text-red-800 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-yellow-300"
            >
              Xem tất cả sản phẩm
            </Link>
            <Link
              to="/"
              className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-black text-white backdrop-blur transition-all hover:bg-white/20"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>

      {/* Flash Sale Section */}
      <div className="mx-auto max-w-7xl px-4 pt-2">
        <FlashSaleSection flashSaleData={flashSaleData} isLoading={isLoading} />
      </div>

      {/* Info Banner */}
      <div className="mx-auto max-w-7xl px-4 mt-4">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ),
              title: 'Sản phẩm chính hãng',
              desc: '100% authentic, bảo hành đầy đủ',
            },
            {
              icon: (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8 4-8-4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              ),
              title: 'Miễn phí giao hàng',
              desc: 'Cho đơn hàng từ 500.000đ',
            },
            {
              icon: (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              ),
              title: 'Thanh toán an toàn',
              desc: 'VNPay, MoMo, thẻ tín dụng',
            },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                {item.icon}
              </div>
              <div>
                <p className="font-black text-slate-900 text-sm">{item.title}</p>
                <p className="text-xs font-medium text-slate-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FlashSalePage;
