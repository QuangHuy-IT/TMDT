import React, { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

const ScrollToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`
        fixed bottom-28 right-6 z-50 w-12 h-12 rounded-full
        bg-white border border-slate-200 shadow-lg
        flex items-center justify-center
        text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:shadow-xl
        transition-all duration-300
        ${visible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}
      `}
      aria-label="Cuộn lên đầu trang"
    >
      <ChevronUp size={22} strokeWidth={2.5} />
    </button>
  );
};

export default ScrollToTop;
