import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import FlashSaleProductCard from './FlashSaleProductCard';

const ProductSlider = ({ products, className }) => {
  const scrollRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  if (!products || products.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-white/60 font-bold text-sm">
        Không có sản phẩm nào trong session này
      </div>
    );
  }

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.offsetWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  return (
    <div
      className={cn("relative group", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Scrollable product grid */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto pb-3 scroll-smooth scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product, index) => (
          <div
            key={product.id || index}
            className="flex-shrink-0 w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] md:w-[calc(25%-12px)] lg:w-[calc(20%-13px)] xl:w-[calc(16.666%-14px)] snap-start"
          >
            <FlashSaleProductCard product={product} />
          </div>
        ))}
      </div>

      {/* Left navigation arrow */}
      <button
        onClick={() => scroll('left')}
        className={cn(
          "absolute left-1 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 rounded-full",
          "bg-white/95 text-red-600 shadow-xl shadow-black/15",
          "transition-all duration-300",
          "hover:bg-white hover:scale-110 active:scale-95 hover:shadow-2xl",
          "opacity-0 -translate-x-3 group-hover:opacity-100 group-hover:translate-x-0",
          !showLeftArrow && "pointer-events-none opacity-0"
        )}
        aria-label="Cuộn sang trái"
      >
        <ChevronLeft size={20} className="font-black" />
      </button>

      {/* Right navigation arrow */}
      <button
        onClick={() => scroll('right')}
        className={cn(
          "absolute right-1 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 rounded-full",
          "bg-white/95 text-red-600 shadow-xl shadow-black/15",
          "transition-all duration-300",
          "hover:bg-white hover:scale-110 active:scale-95 hover:shadow-2xl",
          "opacity-0 translate-x-3 group-hover:opacity-100 group-hover:translate-x-0",
          !showRightArrow && "pointer-events-none opacity-0"
        )}
        aria-label="Cuộn sang phải"
      >
        <ChevronRight size={20} className="font-black" />
      </button>

      {/* Scroll hint (mobile) */}
      {products.length > 2 && (
        <div className="absolute bottom-0 right-4 pointer-events-none flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-white/40 text-[10px] font-bold">Kéo</span>
          <ChevronRight size={12} className="text-white/40" />
        </div>
      )}
    </div>
  );
};

export default ProductSlider;
