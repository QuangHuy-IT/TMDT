import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination, EffectFade } from 'swiper/modules';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

const HeroSection = ({ banners, isLoading }) => {
  // Use props from Home.jsx; avoid duplicate fetch by not using useHomeBanners here
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="h-[300px] md:h-[500px] w-full bg-slate-100 animate-pulse rounded-[2rem]"></div>
      </div>
    );
  }

  if (!banners || banners.length === 0) return null;

  return (
    <section className="relative group container mx-auto px-0 md:px-4 py-0 md:py-6 overflow-hidden">
      <Swiper
        modules={[Autoplay, Navigation, Pagination, EffectFade]}
        effect="fade"
        spaceBetween={0}
        slidesPerView={1}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{
          clickable: true,
          renderBullet: (index, className) => {
            return `<span class="${className} !w-8 !h-1 !rounded-full !bg-white/40 !transition-all"></span>`;
          }
        }}
        navigation={{
          nextEl: '.hero-next',
          prevEl: '.hero-prev',
        }}
        loop={banners.length > 1}
        className="rounded-none md:rounded-[2.5rem] overflow-hidden shadow-2xl h-[400px] md:h-[550px]"
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner.id}>
            <a
              href={banner.linkUrl || '#'}
              className="relative block w-full h-full cursor-pointer"
            >
              <img
                src={banner.imageUrl}
                alt={banner.title}
                className="w-full h-full object-cover"
              />
              {/* Overlay cố định hiển thị text */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 md:p-16 pointer-events-none">
                <div className="max-w-2xl space-y-3 md:space-y-4">
                  {banner.subtitle && (
                    <span className="inline-block text-orange-400 font-black uppercase tracking-[0.3em] text-xs md:text-sm">
                      {banner.subtitle}
                    </span>
                  )}
                  <h2 className="text-white text-3xl md:text-5xl lg:text-6xl font-black leading-tight drop-shadow-xl">
                    {banner.title}
                  </h2>
                </div>
              </div>
            </a>
          </SwiperSlide>
        ))}
      </Swiper>

      {banners.length > 1 && (
        <>
          <button className="hero-prev absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-10 p-2 md:p-3 rounded-full md:rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-slate-900 hidden md:flex items-center justify-center">
            <ChevronLeft size={20} className="md:size-6" />
          </button>
          <button className="hero-next absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-10 p-2 md:p-3 rounded-full md:rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-slate-900 hidden md:flex items-center justify-center">
            <ChevronRight size={20} className="md:size-6" />
          </button>
        </>
      )}
    </section>
  );
};

export default HeroSection;
