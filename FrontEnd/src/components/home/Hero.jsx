import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHomeBanners } from '../../hooks/useHomeBanners';

const AUTOPLAY_DELAY = 3000;

const ArrowIcon = ({ direction = 'right' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`h-7 w-7 ${direction === 'left' ? 'rotate-180' : ''}`}
  >
    <path
      d="M9 6L15 12L9 18"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Hero = () => {
  const navigate = useNavigate();
  const { banners, loading } = useHomeBanners();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setActiveIndex(0);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % banners.length);
    }, AUTOPLAY_DELAY);

    return () => {
      window.clearInterval(timerId);
    };
  }, [banners.length]);

  if (loading) {
    return (
      <section className="w-full">
        <div className="overflow-hidden rounded-[28px] bg-white shadow-sm">
          <div className="grid grid-cols-2 gap-3 border-b border-slate-100 p-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2 rounded-2xl bg-slate-50 p-3">
                <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
              </div>
            ))}
          </div>
          <div className="h-[220px] animate-pulse bg-slate-100 md:h-[360px]" />
        </div>
      </section>
    );
  }

  if (!banners.length) {
    return null;
  }

  const activeBanner = banners[activeIndex];

  const goToSlide = (index) => {
    setActiveIndex(index);
  };

  const goToPrevious = () => {
    setActiveIndex((currentIndex) =>
      currentIndex === 0 ? banners.length - 1 : currentIndex - 1
    );
  };

  const goToNext = () => {
    setActiveIndex((currentIndex) => (currentIndex + 1) % banners.length);
  };

  const handleBannerClick = () => {
    if (!activeBanner?.linkUrl) {
      return;
    }

    if (/^https?:\/\//i.test(activeBanner.linkUrl)) {
      window.location.href = activeBanner.linkUrl;
      return;
    }

    navigate(activeBanner.linkUrl);
  };

  return (
    <section className="w-full">
      <div className="overflow-hidden rounded-[28px] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="grid grid-cols-2 gap-2 border-b border-slate-100 bg-[#f8f7f5] p-2 md:grid-cols-4">
          {banners.map((banner, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={banner.id}
                type="button"
                onClick={() => goToSlide(index)}
                className={`rounded-[22px] px-4 py-3 text-left transition-all duration-300 ${
                  isActive
                    ? 'bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)]'
                    : 'bg-transparent hover:bg-white/80'
                }`}
              >
                <p
                  className={`line-clamp-1 text-sm font-extrabold uppercase tracking-[0.02em] ${
                    isActive ? 'text-red-600' : 'text-slate-700'
                  }`}
                >
                  {banner.title}
                </p>
              </button>
            );
          })}
        </div>

        <div
          className="group relative h-[220px] bg-slate-100 md:h-[360px] lg:h-[420px]"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <button
            type="button"
            onClick={handleBannerClick}
            className="block h-full w-full"
            aria-label={activeBanner.title}
          >
            <img
              src={activeBanner.imageUrl}
              alt={activeBanner.title}
              className="h-full w-full object-cover"
            />
          </button>

          {banners.length > 1 && (
            <>
              <button
                type="button"
                onClick={goToPrevious}
                aria-label="Banner truoc"
                className={`absolute left-4 top-1/2 z-10 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-900 shadow-[0_12px_30px_rgba(15,23,42,0.18)] transition-all duration-200 ${
                  isHovered
                    ? 'pointer-events-auto opacity-100'
                    : 'pointer-events-none opacity-0'
                }`}
              >
                <ArrowIcon direction="left" />
              </button>
              <button
                type="button"
                onClick={goToNext}
                aria-label="Banner sau"
                className={`absolute right-4 top-1/2 z-10 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-900 shadow-[0_12px_30px_rgba(15,23,42,0.18)] transition-all duration-200 ${
                  isHovered
                    ? 'pointer-events-auto opacity-100'
                    : 'pointer-events-none opacity-0'
                }`}
              >
                <ArrowIcon />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero;
