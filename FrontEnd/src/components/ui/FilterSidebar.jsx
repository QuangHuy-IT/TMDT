import React, { useEffect } from 'react';
import { applyCatalogFilters } from '../../utils/catalog';

const DEFAULT_COLOR_OPTIONS = ['Đen', 'Trắng', 'Xanh', 'Tím', 'Vàng', 'Bạc', 'Xám', 'Hồng', 'Đỏ', 'Nâu'];

// --- Constants ---
const PRICE_RANGES = [
  { label: 'Dưới 5 triệu', min: 0, max: 5_000_000 },
  { label: '5 – 10 triệu', min: 5_000_000, max: 10_000_000 },
  { label: '10 – 20 triệu', min: 10_000_000, max: 20_000_000 },
  { label: '20 – 30 triệu', min: 20_000_000, max: 30_000_000 },
  { label: 'Trên 30 triệu', min: 30_000_000, max: Infinity },
];

const SCREEN_SIZES = ['Dưới 6.1"', '6.1 – 6.5"', '6.5 – 6.9"', 'Trên 6.9"'];

export const DEFAULT_FILTERS = {
  priceRange: null,
  storages: [],
  rams: [],
  colors: [],
  screenSizes: [],
  inStockOnly: false,
};

// --- Sub-components ---
const Section = ({ title, children }) => (
  <div className="border-b border-gray-100 py-4">
    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">{title}</h4>
    {children}
  </div>
);

const Chip = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all ${
      active ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
    }`}
  >
    {label}
  </button>
);

const CheckRow = ({ label, checked, onChange }) => (
  <div onClick={onChange} className="flex items-center gap-3 cursor-pointer group py-1.5">
    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
      checked ? 'bg-red-600 border-red-600' : 'bg-white border-gray-300 group-hover:border-gray-500'
    }`}>
      {checked && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
    </div>
    <span className={`text-sm ${checked ? 'text-gray-900 font-bold' : 'text-gray-600'}`}>{label}</span>
  </div>
);

// --- Main Filter Component ---
export const FilterSidebar = ({ filters, onChange, isOpen, onClose, availableColors = [], availableStorages = [], availableRams = [] }) => {
  // Khóa cuộn trang khi mở menu trên mobile
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const toggleArrayFilter = (key, value) => {
    const current = filters[key] || [];
    onChange({
      ...filters,
      [key]: current.includes(value) ? current.filter(v => v !== value) : [...current, value]
    });
  };

  const activeCount = [
    filters.priceRange ? 1 : 0,
    filters.storages.length,
    filters.rams.length,
    filters.colors?.length || 0,
    filters.screenSizes.length,
    filters.inStockOnly ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  const storageOptions = availableStorages.length > 0 ? availableStorages : ['64GB', '128GB', '256GB', '512GB', '1TB'];
  const ramOptions = availableRams.length > 0 ? availableRams : ['4GB', '6GB', '8GB', '12GB', '16GB'];
  const colorOptions = availableColors.length > 0 ? availableColors : DEFAULT_COLOR_OPTIONS;

  return (
    <>
      {/* Overlay cho Mobile */}
      <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity lg:hidden ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={onClose} />

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-[101] w-[280px] bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col
        lg:relative lg:translate-x-0 lg:z-0 lg:w-64 lg:shadow-none lg:border lg:border-gray-100 lg:rounded-2xl lg:sticky lg:top-24 lg:h-fit
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-black uppercase tracking-tighter">Bộ lọc {activeCount > 0 && `(${activeCount})`}</span>
          <div className="flex items-center gap-3">
            {activeCount > 0 && <button onClick={() => onChange(DEFAULT_FILTERS)} className="text-[10px] font-bold text-red-500">XÓA</button>}
            <button onClick={onClose} className="lg:hidden">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2} /></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
          <Section title="Khoảng giá">
            {PRICE_RANGES.map(r => (
              <CheckRow key={r.label} label={r.label} checked={filters.priceRange?.label === r.label} onChange={() => onChange({ ...filters, priceRange: filters.priceRange?.label === r.label ? null : r })} />
            ))}
          </Section>

          <Section title="RAM">
            <div className="grid grid-cols-3 gap-1.5">
              {ramOptions.map(v => <Chip key={v} label={v} active={filters.rams.includes(v)} onClick={() => toggleArrayFilter('rams', v)} />)}
            </div>
          </Section>

          <Section title="Bộ nhớ">
            <div className="grid grid-cols-3 gap-1.5">
              {storageOptions.map(v => <Chip key={v} label={v} active={filters.storages.includes(v)} onClick={() => toggleArrayFilter('storages', v)} />)}
            </div>
          </Section>

          <Section title="Màu sắc">
            <div className="flex flex-wrap gap-1.5">
              {colorOptions.map(v => <Chip key={v} label={v} active={filters.colors?.includes(v)} onClick={() => toggleArrayFilter('colors', v)} />)}
            </div>
          </Section>

          <Section title="Tình trạng">
            <CheckRow label="Còn hàng" checked={filters.inStockOnly} onChange={() => onChange({ ...filters, inStockOnly: !filters.inStockOnly })} />
          </Section>
        </div>

        <div className="p-4 bg-gray-50 border-t lg:hidden">
          <button onClick={onClose} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest">Áp dụng</button>
        </div>
      </aside>
    </>
  );
};

// --- Logic lọc dữ liệu ---
export const applyFilters = applyCatalogFilters;