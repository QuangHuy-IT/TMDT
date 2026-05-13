import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import HeroSection from '../components/home/HeroSection';
import FlashSaleSection from '../components/home/FlashSaleSection';
import FeaturedProductsSection from '../components/home/FeaturedProductsSection';
import BrandSection from '../components/home/BrandSection';
import SidebarBanner from '../components/home/SidebarBanner';
import bannerService from '../services/bannerService';
import flashSaleService from '../services/flashSaleService';
import brandService from '../services/brandService';
import productService from '../services/productService';

export const Home = () => {
  useEffect(() => {
    document.title = 'HHShop - Điện thoại & Phụ kiện chính hãng';
    window.scrollTo(0, 0);
  }, []);

  // 1. Hero Banners
  const { data: heroBanners, isLoading: isHeroLoading } = useQuery({
    queryKey: ['heroBanners'],
    queryFn: bannerService.getHomeBanners,
    staleTime: 10 * 60 * 1000,
  });

  // 2. Flash Sale
  const { data: flashSaleData, isLoading: isFlashLoading } = useQuery({
    queryKey: ['flashSaleData'],
    queryFn: flashSaleService.getFlashSaleData,
    staleTime: 30 * 1000,
  });

  // 3. Featured / Latest Products
  const { data: featuredProducts, isLoading: isFeaturedLoading } = useQuery({
    queryKey: ['latestProducts'],
    queryFn: async () => {
      const response = await productService.getLatestProducts(8);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // 4. Sidebar Banners
  const { data: sidebarBanners, isLoading: isSidebarLoading } = useQuery({
    queryKey: ['sidebarBanners'],
    queryFn: bannerService.getSidebarBanners,
    staleTime: 15 * 60 * 1000,
  });

  // 5. Brands
  const { data: apiBrands, isLoading: isBrandsLoading } = useQuery({
    queryKey: ['allBrands'],
    queryFn: brandService.getBrands,
    staleTime: 30 * 60 * 1000,
  });

  return (
    <main className="min-h-screen bg-slate-50/50 pb-20 space-y-6">

      {/* 1. Hero Section */}
      <HeroSection banners={heroBanners} isLoading={isHeroLoading} />

      {/* 2. Flash Sale Section */}
      <FlashSaleSection flashSaleData={flashSaleData} isLoading={isFlashLoading} />

      {/* ===== 3. MAIN CONTENT: Sidebar + Brand/Featured Sections ===== */}
      <div className="container mx-auto px-4">
        <div className="flex gap-6 items-start">

          {/* --- Left Sidebar --- */}
          {sidebarBanners?.length > 0 && (
            <div className="hidden lg:block w-[calc(25%-18px)] shrink-0 sticky top-6 self-start">
              <SidebarBanner
                banners={sidebarBanners}
                isLoading={isSidebarLoading}
              />
            </div>
          )}

          {/* --- Main Column --- */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* 3. Featured Products */}
            <FeaturedProductsSection
              products={featuredProducts || []}
              loading={isFeaturedLoading}
            />

            {/* 4. Brand Sections */}
            {isBrandsLoading ? (
              <div className="space-y-6">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)] animate-pulse">
                    <div className="h-8 w-48 bg-slate-100 rounded-lg mb-6"></div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {[...Array(8)].map((_, j) => (
                        <div key={j} className="bg-white border border-slate-100 rounded-[2rem] p-5">
                          <div className="bg-slate-100 rounded-2xl aspect-square mb-4" />
                          <div className="space-y-2">
                            <div className="h-2 bg-slate-100 rounded w-1/3" />
                            <div className="h-4 bg-slate-100 rounded w-5/6" />
                            <div className="h-3 bg-slate-100 rounded w-2/3" />
                            <div className="h-3 bg-slate-100 rounded w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              apiBrands?.filter(b => b.is_active !== false).map((brand) => (
                <BrandSection key={brand.id || brand.slug} brand={brand} />
              ))
            )}

          </div>

        </div>
      </div>

      {/* Final Call to Action */}
      <section className="container mx-auto px-4 py-12">
        <div className="bg-slate-900 rounded-[3rem] p-12 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/10 blur-[100px] rounded-full"></div>

          <h2 className="text-3xl md:text-5xl font-black mb-6 relative z-10">
            Bạn cần hỗ trợ tư vấn?
          </h2>
          <p className="text-slate-400 mb-8 max-w-2xl mx-auto text-lg relative z-10">
            Đội ngũ chuyên gia của chúng tôi luôn sẵn sàng giúp bạn chọn được chiếc điện thoại ưng ý nhất với mức giá tốt nhất.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <button className="bg-white text-slate-900 px-10 py-4 rounded-2xl font-black hover:bg-orange-500 hover:text-white transition-all shadow-xl">
              Gọi ngay: 1800.xxxx
            </button>
            <button className="bg-slate-800 text-white border border-slate-700 px-10 py-4 rounded-2xl font-black hover:bg-slate-700 transition-all">
              Chat với tư vấn viên
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
