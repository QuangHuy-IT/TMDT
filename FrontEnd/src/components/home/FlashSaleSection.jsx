import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import { Zap, ChevronRight, ChevronLeft, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProductCard } from '../ui/ProductCard';
import ProductCardSkeleton from '../ui/ProductCardSkeleton';
import FlipCountdown from '../ui/FlipCountdown';
import ProgressBar from '../ui/ProgressBar';

const FlashSaleSkeleton = () => (
  <section className="container mx-auto px-4 pt-6 pb-12">
    <div className="bg-gradient-to-br from-red-600 via-red-700 to-red-900 rounded-[24px] overflow-hidden shadow-2xl shadow-red-300/40">
      <div className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 px-5 md:px-8 pt-6 pb-8">
        <div className="h-14 bg-white/20 rounded-xl w-1/2 animate-pulse" />
      </div>
      <div className="bg-gradient-to-br from-red-600 via-red-700 to-red-900 p-4 md:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      </div>
    </div>
  </section>
);

const FlashSaleTab = ({ sale, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`
      px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 whitespace-nowrap
      ${isActive
        ? 'bg-white text-red-600 shadow-[0_4px_12px_rgba(0,0,0,0.15)]'
        : 'bg-white/20 text-white hover:bg-white/30 hover:text-white'
      }
    `}
  >
    {sale.title}
  </button>
);

const FlashSaleSection = ({ flashSales, isLoading }) => {
  const [activeIdx, setActiveIdx] = useState(0);

  if (isLoading) return <FlashSaleSkeleton />;
  if (!flashSales || flashSales.length === 0) return null;

  const activeSale = flashSales[activeIdx];

  return (
    <section className="container mx-auto px-4 pt-6 pb-12">
      <div className="rounded-[24px] overflow-hidden shadow-2xl shadow-red-300/40">

        {/* ===== HEADER ===== */}
        <div className="relative bg-gradient-to-r from-red-500 via-red-600 to-red-700 px-5 md:px-8 pt-6 pb-0 overflow-hidden">
          {/* Nền pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-yellow-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
          </div>

          {/* Banner cong */}
          <div className="absolute -bottom-px left-0 right-0 h-10 bg-white" />
          <svg className="absolute -bottom-px left-0 w-full h-10 text-white" viewBox="0 0 1440 40" preserveAspectRatio="none" fill="currentColor">
            <path d="M0,40 C360,0 1080,0 1440,40 L1440,40 L0,40 Z" />
          </svg>

          {/* Header content */}
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-7">
            {/* Left: Logo */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-yellow-400 rounded-xl shadow-lg shadow-yellow-400/50">
                <Zap size={24} className="text-red-700 fill-red-700" />
              </div>
              <div>
                <h2 className="text-white font-black text-lg md:text-2xl leading-none">
                  FLASH SALE
                </h2>
                <p className="text-yellow-300 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-0.5">
                  {activeSale.title}
                </p>
              </div>
            </div>

            {/* Right: Countdown */}
            <div className="shrink-0">
                <FlipCountdown remainingSeconds={activeSale.remainingSeconds} endAt={activeSale.endAt} />
            </div>
          </div>

          {/* Tabs — nằm trong phần đỏ, trên banner cong */}
          {flashSales.length > 1 && (
            <div className="relative z-10 flex flex-wrap items-center gap-2 pb-6">
              <span className="text-white/60 text-xs font-bold uppercase tracking-widest mr-1">Xem thêm:</span>
              {flashSales.map((sale, idx) => (
                <FlashSaleTab
                  key={sale.id}
                  sale={sale}
                  isActive={idx === activeIdx}
                  onClick={() => setActiveIdx(idx)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ===== MAIN ===== */}
        <div className="relative bg-gradient-to-br from-red-600 via-red-700 to-red-900 px-4 md:px-6 pt-6 pb-6 overflow-hidden">
          {/* Border viền */}
          <div className="absolute inset-0 border-y-[2px] border-yellow-400/20 pointer-events-none" />

          {/* Icon quà */}
          <Gift size={44} className="absolute top-4 left-4 text-yellow-300/20 rotate-[-15deg]" />
          <Gift size={32} className="absolute top-10 right-6 text-yellow-300/15 rotate-[10deg]" />

          {/* Product Grid */}
          <Swiper
            key={activeSale.id}
            modules={[Navigation, Autoplay]}
            spaceBetween={12}
            slidesPerView={2}
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            breakpoints={{
              320:  { slidesPerView: 2, spaceBetween: 12 },
              640:  { slidesPerView: 3, spaceBetween: 16 },
              1024: { slidesPerView: 4, spaceBetween: 20 },
              1280: { slidesPerView: 5, spaceBetween: 16 },
            }}
            navigation={{
              nextEl: '.fs-next',
              prevEl: '.fs-prev',
            }}
            className="overflow-visible pb-2"
          >
            {(activeSale.items || []).map((item, index) => (
              <SwiperSlide key={item.id || index} className="pb-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05, duration: 0.4, ease: 'easeOut' }}
                >
                  <div className="bg-white rounded-2xl overflow-hidden shadow-lg shadow-black/15 hover:shadow-xl hover:shadow-black/25 transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 group">
                    <ProductCard product={item} className="flex-1" />
                    <div className="px-3 pb-3">
                      <ProgressBar
                        current={item.soldQuantity || 0}
                        total={item.totalQuantity || 1}
                      />
                    </div>
                  </div>
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Navigation */}
          {(activeSale.items?.length || 0) > 5 && (
            <div className="flex items-center justify-end gap-2 mt-4">
              <button className="fs-prev flex items-center gap-1 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all border border-white/20">
                <ChevronLeft size={16} />
                <span className="hidden sm:inline">Trước</span>
              </button>
              <button className="fs-next flex items-center gap-1 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all border border-white/20">
                <span className="hidden sm:inline">Sau</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Footer CTA */}
          <div className="flex items-center justify-center mt-5">
            <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-red-800 font-black text-xs md:text-sm transition-all shadow-xl shadow-yellow-400/40 hover:shadow-yellow-400/60 hover:scale-105 active:scale-95">
              <span>Xem tất cả Flash Sale</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};

export default FlashSaleSection;
