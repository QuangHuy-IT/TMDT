import React from 'react';

const LoadMoreButton = ({ visibleCount, totalCount, onLoadMore }) => {
  const remainingCount = totalCount - visibleCount;

  // Nếu đã hiển thị hết sản phẩm thì không hiện nút nữa
  if (remainingCount <= 0) return null;

  return (
    <div className="mt-12 flex flex-col items-center gap-4">
      <button
        onClick={onLoadMore}
        className="group relative flex items-center justify-center gap-3 px-10 py-4 bg-white border-2 border-gray-900 rounded-2xl transition-all hover:bg-gray-900 active:scale-95 shadow-sm hover:shadow-xl hover:shadow-gray-200"
      >
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-900 group-hover:text-white transition-colors">
          Xem thêm {remainingCount} sản phẩm
        </span>
        
        <svg 
          className="w-4 h-4 text-gray-900 group-hover:text-white group-hover:translate-y-1 transition-all" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      
    </div>
  );
};

export default LoadMoreButton;