import React from 'react';

const SORT_OPTIONS = [
  { key: 'featured',   label: 'Nổi bật' },
  { key: 'newest',     label: 'Mới nhất' },
  { key: 'price-asc',  label: 'Giá thấp' },
  { key: 'price-desc', label: 'Giá cao' },
  { key: 'rating',     label: 'Đánh giá cao' },
];

const SortBar = ({ currentSort, onSortChange }) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
      {/* Label nhỏ cho desktop */}
      <span className="hidden md:block text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">
        Sắp xếp:
      </span>
      
      <div className="flex items-center gap-2">
        {SORT_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onSortChange(key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 ${
              currentSort === key
                ? 'bg-gray-900 text-white shadow-lg shadow-gray-200'
                : 'bg-white text-gray-500 border border-gray-100 hover:border-gray-300 hover:text-gray-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SortBar;