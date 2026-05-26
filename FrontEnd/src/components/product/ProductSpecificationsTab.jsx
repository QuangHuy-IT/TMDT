import React, { useState, useMemo } from 'react';

const CATEGORY_ICONS = {
  'Màn hình': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  'Camera': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  'CPU & RAM': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
    </svg>
  ),
  'Pin & Sạc': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  'Kết nối': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
    </svg>
  ),
  'Hệ điều hành': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  'Thiết kế': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
  'Bảo mật': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  'Mạng & Di động': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
    </svg>
  ),
};

const DEFAULT_ICON = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CATEGORY_ORDER = [
  'Màn hình',
  'Camera',
  'CPU & RAM',
  'Pin & Sạc',
  'Kết nối',
  'Mạng & Di động',
  'Hệ điều hành',
  'Thiết kế',
  'Bảo mật',
  'Khác',
];

export const ProductSpecificationsTab = ({ groupedSpecifications, specifications }) => {
  const [activeTab, setActiveTab] = useState(0);

  const categoryList = useMemo(() => {
    if (groupedSpecifications && Object.keys(groupedSpecifications).length > 0) {
      const cats = Object.keys(groupedSpecifications);
      return cats.sort((a, b) => {
        const idxA = CATEGORY_ORDER.indexOf(a);
        const idxB = CATEGORY_ORDER.indexOf(b);
        if (idxA === -1 && idxB === -1) return a.localeCompare(b);
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      });
    }
    if (specifications && Object.keys(specifications).length > 0) {
      return ['Thông số'];
    }
    return [];
  }, [groupedSpecifications, specifications]);

  if (categoryList.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center">
        <p className="text-sm text-gray-400">Chưa có thông số kỹ thuật cho sản phẩm này.</p>
      </div>
    );
  }

  const hasGrouped = groupedSpecifications && Object.keys(groupedSpecifications).length > 0;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
      {/* Section header */}
      <div className="border-b border-gray-100 px-4 py-4">
        <h2 className="text-sm font-black uppercase tracking-wide text-gray-900">
          Thông số kỹ thuật
        </h2>
      </div>

      {/* Tab bar */}
      {hasGrouped && categoryList.length > 1 && (
        <div className="border-b border-gray-100 overflow-x-auto scrollbar-hide">
          <div className="flex min-w-max px-2">
            {categoryList.map((category, index) => (
              <button
                key={category}
                onClick={() => setActiveTab(index)}
                className={`relative flex items-center gap-1.5 px-4 py-3 text-xs font-bold whitespace-nowrap transition-colors ${
                  activeTab === index
                    ? 'text-red-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className={activeTab === index ? 'text-red-500' : 'text-gray-400'}>
                  {CATEGORY_ICONS[category] || DEFAULT_ICON}
                </span>
                {category}
                {activeTab === index && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Spec content */}
      <div className="p-4">
        {hasGrouped ? (
          <div className="animate-in fade-in duration-200">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <span className="text-gray-400">
                {CATEGORY_ICONS[categoryList[activeTab]] || DEFAULT_ICON}
              </span>
              {categoryList[activeTab]}
            </h3>
            <div className="bg-gray-50 rounded-xl overflow-hidden">
              {Object.entries(groupedSpecifications[categoryList[activeTab]] || {}).map(
                ([key, value], idx, arr) => (
                  <div
                    key={key}
                    className={`flex justify-between gap-4 px-4 py-3 text-sm ${
                      idx !== arr.length - 1 ? 'border-b border-gray-200' : ''
                    }`}
                  >
                    <span className="text-gray-500 shrink-0 w-36">{key}</span>
                    <span className="text-gray-800 font-medium text-right leading-relaxed">{value}</span>
                  </div>
                )
              )}
            </div>

            {/* Category count indicator */}
            <p className="mt-2 text-xs text-gray-400 text-right">
              {Object.keys(groupedSpecifications[categoryList[activeTab]] || {}).length} thông số
            </p>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl overflow-hidden">
            {Object.entries(specifications || {}).map(([key, value], idx, arr) => (
              <div
                key={key}
                className={`flex justify-between gap-4 px-4 py-3 text-sm ${
                  idx !== arr.length - 1 ? 'border-b border-gray-200' : ''
                }`}
              >
                <span className="text-gray-500 shrink-0 w-36">{key}</span>
                <span className="text-gray-800 font-medium text-right leading-relaxed">
                  {String(value || '')}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Quick summary chips — show first 3 specs from each tab on mobile */}
        {hasGrouped && categoryList.length > 1 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
              Xem nhanh thông số nổi bật
            </p>
            <div className="flex flex-wrap gap-2">
              {categoryList.slice(0, 4).map((category, idx) => {
                const firstSpec = Object.entries(groupedSpecifications[category] || {})[0];
                return firstSpec ? (
                  <button
                    key={category}
                    onClick={() => setActiveTab(idx)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      activeTab === idx
                        ? 'bg-red-50 border-red-200 text-red-600'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {category}: <span className="font-normal text-gray-500">{firstSpec[1]}</span>
                  </button>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>

      {/* "View all" link — shown when not on last tab */}
      {hasGrouped && activeTab < categoryList.length - 1 && (
        <div className="px-4 pb-4">
          <button
            onClick={() => setActiveTab(activeTab + 1)}
            className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            Xem thêm thông số {categoryList[activeTab + 1]}
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};
