import React, { useEffect, useMemo, useRef, useState } from 'react';
import ProductService from '../../services/productService';
import AdminService from '../../services/adminService';
import SeriesService from '../../services/seriesService';

const ITEMS_PER_PAGE = 8;

// Format number to VND currency display (e.g., "24.990.000")
const formatCurrency = (value) => {
  if (!value && value !== 0) return '';
  const num = Number(value);
  if (isNaN(num)) return '';
  return num.toLocaleString('vi-VN');
};

// Format input value as user types (add dots for thousands)
const formatCurrencyInput = (value) => {
  if (!value && value !== 0) return '';
  // Remove all non-digits
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';
  // Add dots for thousands
  return parseInt(digits, 10).toLocaleString('vi-VN');
};

// Parse currency to plain number (remove dots, return number)
const parseCurrencyToNumber = (str) => {
  if (!str) return 0;
  const cleaned = String(str).replace(/\./g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : Math.max(0, num);
};

// Fixed spec groups — each group has a list of fixed spec keys
// Used for phone/tablet products. Users can add custom groups for accessories.
const SPEC_GROUPS = [
  {
    category: 'Màn hình',
    keys: [
      'Kích thước màn hình', 'Công nghệ màn hình', 'Độ phân giải màn hình',
      'Tính năng màn hình', 'Tần số quét',
    ],
  },
  {
    category: 'Camera',
    keys: ['Camera sau', 'Camera trước', 'Đèn Flash', 'Quay video'],
  },
  {
    category: 'CPU & RAM',
    keys: ['Chipset', 'Loại CPU', 'RAM', 'GPU'],
  },
  {
    category: 'Pin & Sạc',
    keys: ['Pin', 'Sạc nhanh', 'Công nghệ sạc'],
  },
  {
    category: 'Kết nối',
    keys: ['Công nghệ NFC', 'Cổng sạc', 'Jack tai nghe', 'Bluetooth', 'WiFi', 'GPS'],
  },
  {
    category: 'Mạng & Di động',
    keys: ['Mạng', 'Thẻ SIM', 'eSIM'],
  },
  {
    category: 'Hệ điều hành',
    keys: ['Hệ điều hành'],
  },
  {
    category: 'Thiết kế',
    keys: ['Trọng lượng', 'Kích thước', 'Chất liệu'],
  },
  {
    category: 'Bảo mật',
    keys: ['Bảo mật'],
  },
  {
    category: 'Khác',
    keys: ['Bộ nhớ trong', 'Thẻ nhớ', 'Radio', 'Hồng ngoại'],
  },
];

// Build empty flat spec map from fixed groups
const buildEmptySpecs = () => {
  const obj = {};
  SPEC_GROUPS.forEach(g => g.keys.forEach(k => { obj[k] = ''; }));
  return obj;
};

// Convert flat spec map {key→value} → { fixed: {}, extra: [{key,value}], extraGroups: [{category, specs:[{key,value}]}] }
const parseSpecsMap = (specMap) => {
  const fixed = buildEmptySpecs();
  const extra = [];
  const extraGroups = []; // custom groups added by user

  if (specMap && typeof specMap === 'object') {
    Object.entries(specMap).forEach(([key, value]) => {
      if (!key) return;
      const matchedGroup = SPEC_GROUPS.find(g => g.keys.includes(key));
      if (matchedGroup) {
        fixed[key] = value || '';
      } else {
        extra.push({ key, value: value || '' });
      }
    });
  }

  // If there are extra specs, group them under "Khác"
  if (extra.length > 0) {
    extraGroups.push({ id: 'extra-default', category: 'Khác', specs: extra });
  }

  return { fixed, extraGroups };
};

const parseSpecificationRowsToForm = (specificationRows, specificationsMap) => {
  const fixed = buildEmptySpecs();
  const extraGroupsMap = {};

  if (Array.isArray(specificationRows) && specificationRows.length > 0) {
    specificationRows.forEach(row => {
      if (!row || !row.specKey) return;
      const category = row.specCategory || 'Khác';
      const key = row.specKey;
      const value = row.specValue || '';

      const matchedGroup = SPEC_GROUPS.find(g => g.category === category);
      if (matchedGroup && matchedGroup.keys.includes(key)) {
        fixed[key] = value;
      } else {
        if (!extraGroupsMap[category]) {
          extraGroupsMap[category] = [];
        }
        extraGroupsMap[category].push({ key, value });
      }
    });
  } else if (specificationsMap && typeof specificationsMap === 'object') {
    Object.entries(specificationsMap).forEach(([key, value]) => {
      if (!key) return;
      const matchedGroup = SPEC_GROUPS.find(g => g.keys.includes(key));
      if (matchedGroup) {
        fixed[key] = value || '';
      } else {
        const category = matchedGroup ? matchedGroup.category : 'Khác';
        if (!extraGroupsMap[category]) {
          extraGroupsMap[category] = [];
        }
        extraGroupsMap[category].push({ key, value: value || '' });
      }
    });
  }

  // Convert extraGroupsMap to array
  const extraGroups = Object.entries(extraGroupsMap).map(([category, specs], index) => {
    const isFixedCategory = SPEC_GROUPS.some(g => g.category === category);
    return {
      id: isFixedCategory ? `extra-${category}` : `custom-${Date.now()}-${index}`,
      category,
      specs
    };
  });

  return { fixed, extraGroups };
};

const STORAGE_PRESETS = ['64GB', '128GB', '256GB', '512GB', '1TB', '2TB', '5TB'];
const RAM_PRESETS = ['2', '4', '6', '8', '12', '16', '32', '64', '128'];
const COLOR_PRESETS = ['Đen', 'Trắng', 'Xanh', 'Tím', 'Vàng', 'Hồng', 'Đỏ', 'Bạc', 'Nâu', 'Cam'];

// buildEmptySpecs is defined above after SPEC_GROUPS

const parseStorageToNumber = (label) => {
  if (!label) return null;
  const upper = label.toUpperCase().trim();
  if (upper.endsWith('TB')) {
    const num = parseInt(upper.replace(/[^\d]/g, ''), 10);
    return isNaN(num) ? null : num * 1024;
  }
  if (upper.endsWith('GB')) {
    const num = parseInt(upper.replace(/[^\d]/g, ''), 10);
    return isNaN(num) ? null : num;
  }
  return null;
};

const emptyForm = {
  name: '',
  brand: '',
  seriesId: '',
  description: '',
  thumbnailUrl: '',
  images: [],
  specifications: buildEmptySpecs(), // flat map: {key: value}
  // Template keys that user deleted (per-group array)
  hiddenSpecKeys: [],
  // Custom groups added by user (for accessories, etc.)
  extraGroups: [],
  variants: [],
};

import { TiptapEditor } from '../../components/ui/RichTextEditor';

const createEmptyVariant = () => ({
  id: null,
  color: '',
  storageLabel: '',
  ramGb: '',
  price: '',
  costPrice: '',
  stock: '',
  colorImageUrl: '',
  images: [],
});

// SpecGroup — fixed template keys + optional extra rows, collapsible
// Each spec: key on one line, input on next line. Template keys can be hidden via onDeleteKey.
const SpecGroup = ({ category, keys, values, onChange, extraRows, onExtraChange, onDeleteKey, hiddenKeys }) => {
  const [collapsed, setCollapsed] = useState(false);

  // Only show keys that are NOT hidden
  const visibleKeys = keys.filter(k => !(hiddenKeys || []).includes(k));
  const filledCount = visibleKeys.filter(k => values?.[k]?.trim()).length;
  const extraCount = (extraRows || []).filter(r => r.key?.trim() && r.value?.trim()).length;
  const hasData = filledCount > 0 || extraCount > 0;

  return (
    <div className="border-b border-white/5 pb-3 mb-3 last:border-0 last:pb-0 last:mb-0">
      {/* Header — collapsible */}
      <button
        type="button"
        onClick={() => setCollapsed(c => !c)}
        className="flex items-center justify-between w-full text-left mb-2 hover:opacity-80 transition-opacity"
      >
        <span className="text-xs font-black text-red-400 uppercase tracking-wider">{category}</span>
        <div className="flex items-center gap-2">
          {hasData && (
            <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
              {filledCount}{extraCount > 0 ? `+${extraCount}` : ''}
            </span>
          )}
          <svg className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Content */}
      {!collapsed && (
        <div className="space-y-3 pl-0">

          {/* Template rows — key on its own line, input below, delete button */}
          {visibleKeys.map(key => (
            <div key={key} className="group/spec relative">
              {/* Key label row */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  {key}
                </span>
                <button
                  type="button"
                  onClick={() => onDeleteKey(key)}
                  className="w-5 h-5 flex items-center justify-center rounded text-gray-700 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover/spec:opacity-100"
                  title="Xóa dòng này"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Input row */}
              <input
                type="text"
                value={values?.[key] || ''}
                placeholder="—"
                onChange={e => onChange(key, e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-all"
              />
            </div>
          ))}

          {/* Show hidden keys count if any */}
          {keys.filter(k => (hiddenKeys || []).includes(k)).length > 0 && (
            <button
              type="button"
              onClick={() => {
                // Restore all hidden keys for this group
                onDeleteKey && keys.filter(k => (hiddenKeys || []).includes(k)).forEach(k => onDeleteKey(k));
              }}
              className="text-[10px] text-gray-600 hover:text-gray-400 underline"
            >
              + Hiện lại {keys.filter(k => (hiddenKeys || []).includes(k)).length} dòng đã ẩn
            </button>
          )}

          {/* Extra rows — free-form key + value, stacked */}
          {(extraRows || []).map((row, idx) => (
            <div key={`extra-${idx}`} className="group/er">
              {/* Key input */}
              <div className="flex items-center justify-between mb-1">
                <input
                  type="text"
                  value={row.key}
                  placeholder="Tên thông số…"
                  onChange={e => {
                    const next = [...(extraRows || [])];
                    next[idx] = { ...next[idx], key: e.target.value };
                    onExtraChange(next);
                  }}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => onExtraChange(extraRows.filter((_, i) => i !== idx))}
                  className="w-5 h-5 flex items-center justify-center rounded text-gray-700 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover/er:opacity-100 ml-2 shrink-0"
                  title="Xóa"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Value input */}
              <input
                type="text"
                value={row.value}
                placeholder="Giá trị…"
                onChange={e => {
                  const next = [...(extraRows || [])];
                  next[idx] = { ...next[idx], value: e.target.value };
                  onExtraChange(next);
                }}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-all"
              />
            </div>
          ))}

          {/* Add extra row button */}
          <button
            type="button"
            onClick={() => onExtraChange([...(extraRows || []), { key: '', value: '' }])}
            className="flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-green-400 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm thông số khác
          </button>
        </div>
      )}
    </div>
  );
};

// CustomGroup — user-defined group (for accessories), each spec key on its own line
const CustomGroup = ({ group, onChange, onRemove }) => {
  const [collapsed, setCollapsed] = useState(false);
  const filledCount = (group.specs || []).filter(r => r.key?.trim() && r.value?.trim()).length;

  return (
    <div className="border border-dashed border-white/20 rounded-xl p-4 bg-white/[0.02]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setCollapsed(c => !c)}
          className="flex items-center gap-2 hover:opacity-80"
        >
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">
            {group.category || 'Nhóm mới'}
          </span>
          {filledCount > 0 && (
            <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
              {filledCount}
            </span>
          )}
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCollapsed(c => !c)}
            className="p-1 text-gray-500 hover:text-gray-300"
          >
            <svg className={`w-3.5 h-3.5 transition-transform ${collapsed ? '' : 'rotate-180'}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-gray-600 hover:text-red-400 transition-colors"
            title="Xóa nhóm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Category name input */}
      {!collapsed && (
        <div className="mb-3">
          <input
            type="text"
            value={group.category}
            placeholder="Tên nhóm (VD: Tai nghe, Sạc dự phòng)…"
            onChange={e => onChange({ ...group, category: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-black text-gray-300 uppercase tracking-wider placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-all"
          />
        </div>
      )}

      {/* Rows */}
      {!collapsed && (
        <div className="space-y-3">
          {(group.specs || []).map((row, idx) => (
            <div key={idx} className="group/cr">
              {/* Key input */}
              <div className="flex items-center justify-between mb-1">
                <input
                  type="text"
                  value={row.key}
                  placeholder="Tên thông số…"
                  onChange={e => {
                    const next = [...(group.specs || [])];
                    next[idx] = { ...next[idx], key: e.target.value };
                    onChange({ ...group, specs: next });
                  }}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => onChange({ ...group, specs: group.specs.filter((_, i) => i !== idx) })}
                  className="w-5 h-5 flex items-center justify-center rounded text-gray-700 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover/cr:opacity-100 ml-2 shrink-0"
                  title="Xóa"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Value input */}
              <input
                type="text"
                value={row.value}
                placeholder="Giá trị…"
                onChange={e => {
                  const next = [...(group.specs || [])];
                  next[idx] = { ...next[idx], value: e.target.value };
                  onChange({ ...group, specs: next });
                }}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-all"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => onChange({ ...group, specs: [...(group.specs || []), { key: '', value: '' }] })}
            className="flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-green-400 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm dòng
          </button>
        </div>
      )}
    </div>
  );
};

const ProductFormPage = ({ editingProduct, onClose, onSaveSuccess }) => {
  const [form, setForm] = useState(emptyForm);
  const [fetching, setFetching] = useState(!!editingProduct);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingVariantIndex, setUploadingVariantIndex] = useState(null);

  const [pickerStorage, setPickerStorage] = useState('');
  const [pickerRam, setPickerRam] = useState('');
  const [pickerColor, setPickerColor] = useState('Đen');
  const [pickerPrice, setPickerPrice] = useState('');
  const [pickerCostPrice, setPickerCostPrice] = useState('');

  const [brands, setBrands] = useState([]);
  const [showBrandInput, setShowBrandInput] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [savingBrand, setSavingBrand] = useState(false);

  // Brand search dropdown
  const [brandSearch, setBrandSearch] = useState('');
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const brandDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showBrandDropdown) return;
    const handleClick = (e) => {
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(e.target)) {
        setShowBrandDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showBrandDropdown]);

  const [seriesList, setSeriesList] = useState([]);
  const [showSeriesInput, setShowSeriesInput] = useState(false);
  const [newSeriesName, setNewSeriesName] = useState('');
  const [savingSeries, setSavingSeries] = useState(false);

  // Debounced brand search
  useEffect(() => {
    if (brandSearch.trim().length < 1) {
      setShowBrandDropdown(false);
      return;
    }
    setLoadingBrands(true);
    const timer = setTimeout(() => {
      setLoadingBrands(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [brandSearch]);

  const filteredBrands = brands.filter((b) =>
    !brandSearch || b.name?.toLowerCase().includes(brandSearch.toLowerCase())
  );

  const thumbnailInputRef = useRef(null);

  // Fetch product detail for editing
  useEffect(() => {
    if (!editingProduct) {
      setForm(emptyForm);
      setFetching(false);
      return;
    }

    const fetchProduct = async () => {
      setFetching(true);
      try {
        const productId = editingProduct._id || editingProduct.id;
        const res = await ProductService.getAdminProduct(productId);
        const data = res.data;

        const { fixed, extraGroups } = parseSpecificationRowsToForm(data.specificationRows, data.specifications);

        setForm({
          name: data.name || '',
          brand: data.brand || '',
          seriesId: data.seriesId || '',
          description: data.description || '',
          thumbnailUrl: data.thumbnailUrl || '',
          images: [],
          specifications: fixed,
          hiddenSpecKeys: [],
          extraGroups: extraGroups,
          variants: (data.variants || []).map(v => {
            const variantImages = Array.isArray(v.images) && v.images.length > 0
              ? v.images
              : (v.colorImageUrl ? [v.colorImageUrl] : []);
            return {
              id: v.id || null,
              color: v.color || 'Đen',
              storageLabel: v.storageLabel || '',
              ramGb: v.ramGb ?? '',
              price: v.price ?? '',
              costPrice: v.costPrice ?? '',
              stock: v.stock ?? '',
              colorImageUrl: variantImages[0] || v.colorImageUrl || '',
              images: variantImages,
            };
          }),
        });
        setPickerColor('Đen');
        setPickerStorage('');
        setPickerRam('');
      } catch (err) {
        alert('Không tải được sản phẩm. Vui lòng thử lại.');
        onClose();
      } finally {
        setFetching(false);
      }
    };

    fetchProduct();
  }, [editingProduct?._id, editingProduct?.id]);

  useEffect(() => {
    AdminService.getBrands().then((res) => {
      const data = res.data?.data ?? res.data ?? [];
      setBrands(Array.isArray(data) ? data : []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.brand) {
      const selectedBrand = brands.find(b => b.name === form.brand);
      if (selectedBrand) {
        SeriesService.getSeriesByBrand(selectedBrand.id).then((res) => {
          setSeriesList(Array.isArray(res.data) ? res.data : []);
        }).catch(() => {});
      }
    }
  }, [form.brand, brands]);

  const updateForm = (updater) => {
    setForm((prev) => typeof updater === 'function' ? updater(prev) : { ...prev, ...updater });
  };

  const appendVariant = (overrides = {}) => {
    updateForm((prev) => ({
      ...prev,
      variants: [...(prev.variants || []), { ...createEmptyVariant(), ...overrides }],
    }));
  };

  const removeVariantRow = (index) => {
    updateForm((prev) => {
      const next = (prev.variants || []).filter((_, i) => i !== index);
      return { ...prev, variants: next };
    });
  };

  const updateVariantField = (index, key, value) => {
    updateForm((prev) => ({
      ...prev,
      variants: (prev.variants || []).map((v, i) => (i === index ? { ...v, [key]: value } : v)),
    }));
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const response = await ProductService.uploadImage(file);
      updateForm({ thumbnailUrl: response.data.imageUrl });
    } catch (error) {
      alert('Upload thumbnail thất bại');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleVariantImagesUpload = async (e, variantIndex) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingVariantIndex(variantIndex);
    try {
      const urls = [];
      for (const file of files) {
        const response = await ProductService.uploadImage(file);
        urls.push(response.data.imageUrl);
      }
      updateForm((prev) => ({
        ...prev,
        variants: (prev.variants || []).map((variant, index) => {
          if (index !== variantIndex) return variant;
          const images = [...(variant.images || []), ...urls];
          return {
            ...variant,
            images,
            colorImageUrl: images[0] || variant.colorImageUrl || '',
          };
        }),
      }));
    } catch (error) {
      alert('Upload ảnh thất bại');
    } finally {
      setUploadingVariantIndex(null);
      e.target.value = '';
    }
  };

  const removeVariantImage = (variantIndex, imageIndex) => {
    updateForm((prev) => ({
      ...prev,
      variants: (prev.variants || []).map((variant, index) => {
        if (index !== variantIndex) return variant;
        const images = (variant.images || []).filter((_, i) => i !== imageIndex);
        return {
          ...variant,
          images,
          colorImageUrl: images[0] || '',
        };
      }),
    }));
  };

  const removeThumbnail = () => updateForm({ thumbnailUrl: '' });

  const handleAddVariant = () => {
    if (!pickerStorage) {
      alert('Vui lòng chọn Dung lượng trước khi thêm phiên bản.');
      return;
    }
    appendVariant({
      color: pickerColor,
      storageLabel: pickerStorage,
      ramGb: pickerRam || null,
      price: pickerPrice || 0,
      costPrice: pickerCostPrice || 0,
      stock: 0,
    });
    setPickerStorage('');
    setPickerRam('');
    setPickerColor('Đen');
  };

  const handlePickerStorage = (value) => setPickerStorage(prev => prev === value ? '' : value);
  const handlePickerRam = (value) => setPickerRam(prev => prev === value ? '' : value);

  const handleCreateBrand = async () => {
    if (!newBrandName.trim()) return;
    setSavingBrand(true);
    try {
      const res = await AdminService.createBrand({ name: newBrandName.trim(), isActive: true });
      const newBrand = res.data;
      setBrands(prev => [newBrand, ...prev]);
      updateForm({ brand: newBrand.name });
      setShowBrandInput(false);
      setNewBrandName('');
      setSeriesList([]);
      updateForm({ seriesId: '' });
    } catch (e) {
      alert(e.response?.data?.message || 'Tạo thương hiệu thất bại');
    } finally {
      setSavingBrand(false);
    }
  };

  const handleCreateSeries = async () => {
    if (!newSeriesName.trim() || !form.brand) return;
    const selectedBrand = brands.find(b => b.name === form.brand);
    if (!selectedBrand) { alert('Vui lòng chọn thương hiệu trước'); return; }
    setSavingSeries(true);
    try {
      const res = await SeriesService.createSeries({ name: newSeriesName.trim(), brandId: selectedBrand.id, isActive: true });
      const newSeries = res.data;
      setSeriesList(prev => [...prev, newSeries]);
      updateForm({ seriesId: newSeries.id });
      setShowSeriesInput(false);
      setNewSeriesName('');
    } catch (e) {
      alert(e.response?.data?.message || 'Tạo dòng sản phẩm thất bại');
    } finally {
      setSavingSeries(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.brand.trim()) {
      alert('Vui lòng nhập tên sản phẩm và thương hiệu.');
      return;
    }

    const validVariants = (form.variants || []).filter(v =>
      v.storageLabel || v.price || v.stock || v.ramGb || v.color
    );

    if (validVariants.length === 0) {
      alert('Vui lòng thêm ít nhất 1 phiên bản.');
      return;
    }

    // Every variant must have storage
    const missingStorage = validVariants.find(v => !v.storageLabel);
    if (missingStorage) {
      const idx = (form.variants || []).indexOf(missingStorage) + 1;
      alert(`Phiên bản #${idx} thiếu Dung lượng. Vui lòng chọn Dung lượng cho tất cả các phiên bản.`);
      return;
    }

    // Flatten: template specs + extraGroups → flat {key: value}
    const flatSpecs = {};
    const hiddenKeys = new Set(form.hiddenSpecKeys || []);
    // Template specs (non-empty, not hidden)
    Object.entries(form.specifications || {}).forEach(([key, val]) => {
      if (key && val && val.trim() && !hiddenKeys.has(key)) flatSpecs[key] = val.trim();
    });
    // Extra group specs (non-empty)
    (form.extraGroups || []).forEach(group => {
      (group.specs || []).forEach(row => {
        if (row.key?.trim() && row.value?.trim()) {
          flatSpecs[row.key.trim()] = row.value.trim();
        }
      });
    });

    // Build structured specification rows
    const specificationRows = [];
    let sortOrderIdx = 0;

    // 1. Process SPEC_GROUPS
    SPEC_GROUPS.forEach(group => {
      group.keys.forEach(key => {
        const val = form.specifications[key];
        const isHidden = (form.hiddenSpecKeys || []).includes(key);
        if (val && val.trim() && !isHidden) {
          specificationRows.push({
            specCategory: group.category,
            specKey: key.trim(),
            specValue: val.trim(),
            sortOrder: sortOrderIdx++
          });
        }
      });

      // 2. Process extra rows in this group
      const groupExtra = (form.extraGroups || []).find(g => g.category === group.category);
      if (groupExtra) {
        (groupExtra.specs || []).forEach(row => {
          if (row.key?.trim() && row.value?.trim()) {
            specificationRows.push({
              specCategory: group.category,
              specKey: row.key.trim(),
              specValue: row.value.trim(),
              sortOrder: sortOrderIdx++
            });
          }
        });
      }
    });

    // 3. Process custom extra groups not in SPEC_GROUPS
    (form.extraGroups || []).forEach(group => {
      const isFixedCategory = SPEC_GROUPS.some(g => g.category === group.category);
      if (!isFixedCategory && group.category?.trim()) {
        (group.specs || []).forEach(row => {
          if (row.key?.trim() && row.value?.trim()) {
            specificationRows.push({
              specCategory: group.category.trim(),
              specKey: row.key.trim(),
              specValue: row.value.trim(),
              sortOrder: sortOrderIdx++
            });
          }
        });
      }
    });

    const payload = {
      name: (form.name || '').trim(),
      brand: form.brand,
      seriesId: form.seriesId || null,
      description: form.description,
      thumbnailUrl: form.thumbnailUrl || null,
      images: [],
      specifications: flatSpecs,
      specificationRows: specificationRows,
      variants: validVariants.map(v => {
        const images = (v.images || []).filter(img => img && img.trim());
        const label = (v.storageLabel || '').trim();
        return {
          id: v.id || null,
          color: (v.color || '').trim() || 'Default',
          storageLabel: label,
          storageGb: parseStorageToNumber(label),
          ramGb: v.ramGb ? Number(v.ramGb) : null,
          price: Number(v.price || 0),
          costPrice: Number(v.costPrice || 0),
          stock: Number(v.stock || 0),
          colorImageUrl: images[0] || null,
          images,
        };
      }),
    };

    setSaving(true);
    try {
      if (editingProduct) {
        const productId = editingProduct._id || editingProduct.id;
        await ProductService.updateProduct(productId, payload);
      } else {
        await ProductService.createProduct(payload);
      }
      onSaveSuccess();
    } catch (error) {
      alert(error.response?.data?.message || 'Lưu sản phẩm thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (fetching) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0f]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-white/20 border-t-red-500 rounded-full animate-spin" />
          <p className="text-gray-400 font-bold text-sm">Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0f] overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0f1117] flex-shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onClose}
            className="w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/20 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-lg font-black text-white">
              {editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
            </h2>
            
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white hover:border-white/20 transition-all">
            Hủy
          </button>
          <button onClick={handleSave} disabled={saving || uploading}
            className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50">
            {saving ? 'Đang lưu...' : (editingProduct ? 'Lưu thay đổi' : 'Thêm sản phẩm')}
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1000px] mx-auto px-6 py-8">
          <div className="space-y-8">

          {/* Basic Info */}
          <section className="bg-[#13151e] border border-white/5 rounded-2xl p-6 space-y-5">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Thông tin cơ bản</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Name */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                    Tên sản phẩm *
                  </label>
                  <input type="text" value={form.name}
                    placeholder="VD: iPhone 17 Pro Max"
                    onChange={(e) => updateForm({ name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-all" />
                  
                </div>

                {/* Brand */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Thương hiệu *</label>
                  {!showBrandInput ? (
                      <div className="relative">
                        <input
                          type="text"
                          value={brandSearch || form.brand}
                          onChange={(e) => {
                            setBrandSearch(e.target.value);
                            updateForm({ brand: e.target.value });
                          }}
                          onFocus={() => {
                            setBrandSearch(form.brand || '');
                            setShowBrandDropdown(true);
                          }}
                          placeholder="Gõ tên thương hiệu để tìm..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-all"
                        />
                      {showBrandDropdown && (
                        <div ref={brandDropdownRef} className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl max-h-60 overflow-y-auto shadow-xl">
                          {loadingBrands ? (
                            <div className="px-4 py-3 text-sm text-gray-500">Đang tìm...</div>
                          ) : filteredBrands.length === 0 && !form.brand ? (
                            <div className="px-4 py-3 text-sm text-gray-500">
                              Không tìm thấy thương hiệu nào.{' '}
                              <button onClick={() => { setShowBrandDropdown(false); setShowBrandInput(true); setNewBrandName(brandSearch); }}
                                className="text-blue-600 hover:underline font-medium">
                                Thêm mới?
                              </button>
                            </div>
                          ) : filteredBrands.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-500">Đang tải thương hiệu...</div>
                          ) : (
                            filteredBrands.map((b) => (
                              <button
                                key={b.id}
                                onClick={() => {
                                  updateForm({ brand: b.name });
                                  setBrandSearch(b.name);
                                  setShowBrandDropdown(false);
                                }}
                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 text-left transition-colors border-b border-gray-100 last:border-b-0"
                              >
                                <span className="text-sm font-medium text-gray-900">{b.name}</span>
                                <span className="text-[11px] text-gray-500">{b.slug}</span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                      
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input type="text" value={newBrandName}
                        onChange={(e) => setNewBrandName(e.target.value)}
                        placeholder="Nhập tên thương hiệu..."
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateBrand()}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-red-500/50" />
                      <button type="button" onClick={handleCreateBrand} disabled={savingBrand}
                        className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-xl text-white transition-all disabled:opacity-50">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button type="button" onClick={() => { setShowBrandInput(false); setNewBrandName(''); }}
                        className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Series */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Dòng sản phẩm (Series)</label>
                  {form.brand ? (
                    <>
                      {!showSeriesInput ? (
                        <div className="flex gap-2">
                          <select value={form.seriesId || ''}
                            onChange={(e) => updateForm({ seriesId: e.target.value ? Number(e.target.value) : '' })}
                            className="flex-1 bg-[#1e2030] border border-white/20 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-red-500"
                            style={{ color: '#e5e7eb' }}>
                            <option value="">Không thuộc dòng nào</option>
                            {seriesList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                          <button type="button" onClick={() => setShowSeriesInput(true)}
                            className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-green-400 hover:border-green-500/30 transition-all"
                            title="Thêm dòng sản phẩm mới">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input type="text" value={newSeriesName}
                            onChange={(e) => setNewSeriesName(e.target.value)}
                            placeholder="Nhập tên dòng sản phẩm..."
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateSeries()}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-red-500/50" />
                          <button type="button" onClick={handleCreateSeries} disabled={savingSeries}
                            className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-xl text-white transition-all disabled:opacity-50">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button type="button" onClick={() => { setShowSeriesInput(false); setNewSeriesName(''); }}
                            className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-gray-600 italic">Vui lòng chọn thương hiệu trước</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Mô tả</label>
                <div className="rounded-xl overflow-hidden border border-white/10">
                  <TiptapEditor value={form.description}
                    onChange={(content) => updateForm({ description: content })}
                    placeholder="Mô tả sản phẩm..." />
                </div>
              </div>
            </section>

            {/* Images */}
            <section className="bg-[#13151e] border border-white/5 rounded-2xl p-6 space-y-5">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Hình ảnh</h3>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Ảnh Thumbnail</label>
                <p className="text-[10px] text-gray-600 mb-2">Chỉ lưu vào products.thumbnail_url. Ảnh chi tiết sẽ thêm trong từng phiên bản.</p>
                {form.thumbnailUrl ? (
                  <div className="relative group w-28 h-28">
                    <img src={form.thumbnailUrl && form.thumbnailUrl.trim() ? form.thumbnailUrl : undefined}
                      alt="Thumbnail"
                      className="w-full h-full object-contain bg-white/5 rounded-xl border border-white/10 p-1"
                      onError={(e) => { e.target.src = 'https://picsum.photos/seed/fallback/80/80'; }} />
                    <button onClick={removeThumbnail}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold">×</button>
                    <span className="absolute bottom-1 left-1 text-[8px] bg-blue-600 text-white px-1 rounded font-bold">THUMB</span>
                  </div>
                ) : (
                  <button type="button" onClick={() => thumbnailInputRef.current?.click()}
                    disabled={uploading}
                    className="w-28 h-28 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-red-500/40 hover:text-gray-300 transition-all">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-[11px]">{uploading ? '...' : 'Chọn ảnh'}</span>
                  </button>
                )}
                <input ref={thumbnailInputRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} />
              </div>
            </section>

            {/* Variants */}
            <section className="bg-[#13151e] border border-white/5 rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Phiên bản</h3>

                </div>
                <span className="text-xs bg-white/5 text-gray-400 px-3 py-1 rounded-lg">
                  {form.variants.length} phiên bản
                </span>
              </div>

              {/* Quick picker */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2">Dung lượng</p>
                  <div className="flex flex-wrap gap-1.5">
                    {STORAGE_PRESETS.map(s => (
                      <button key={s} type="button" onClick={() => handlePickerStorage(s)}
                        className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg border transition-all ${
                          pickerStorage === s
                            ? 'bg-red-600 border-red-600 text-white'
                            : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                        }`}>{s}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2">
                    RAM
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {RAM_PRESETS.map(r => (
                      <button key={r} type="button" onClick={() => handlePickerRam(r)}
                        className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg border transition-all ${
                          pickerRam === r
                            ? 'bg-red-600 border-red-600 text-white'
                            : 'border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                        }`}>{r}GB</button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-3">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2">Màu</p>
                    <input list="color-presets" type="text" value={pickerColor}
                      onChange={(e) => setPickerColor(e.target.value)}
                      placeholder="VD: Đen, Bạc..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-red-500/50" />
                    <datalist id="color-presets">
                      {COLOR_PRESETS.map(c => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Giá bán</p>
                      <input type="text" inputMode="numeric"
                        value={formatCurrencyInput(pickerPrice)}
                        onChange={(e) => setPickerPrice(parseCurrencyToNumber(e.target.value))}
                        placeholder="VD: 24.990.000"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-red-500/50" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Giá vốn</p>
                      <input type="text" inputMode="numeric"
                        value={formatCurrencyInput(pickerCostPrice)}
                        onChange={(e) => setPickerCostPrice(parseCurrencyToNumber(e.target.value))}
                        placeholder="VD: 20.000.000"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-red-500/50" />
                    </div>
                  </div>
                  <button type="button" onClick={handleAddVariant} disabled={!pickerStorage}
                    className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
                    + Thêm phiên bản
                  </button>
                </div>
              </div>

              {/* Variant list */}
              <div className="space-y-3">
                {(form.variants || []).map((variant, index) => (
                  <div key={variant.id || `new-${index}`}
                    className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-emerald-300/90">
                        {form.name || 'Tên sản phẩm'}
                        {variant.storageLabel && ` - ${variant.storageLabel}`}
                        {variant.ramGb && ` - ${variant.ramGb}GB RAM`}
                        {variant.color && ` - ${variant.color}`}
                      </p>
                      <button type="button" onClick={() => removeVariantRow(index)}
                        className="w-7 h-7 rounded-lg border border-red-500/30 text-red-400 text-xs hover:bg-red-500/10 flex items-center justify-center transition-all font-bold">×</button>
                    </div>
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-2">
                        <label className="text-[10px] text-gray-500 block mb-1">Màu sắc</label>
                        <input type="text" list="variant-color-presets" value={variant.color || ''}
                          onChange={(e) => updateVariantField(index, 'color', e.target.value)}
                          placeholder="Đen, Bạc..."
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-red-500/50" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] text-gray-500 block mb-1">Dung lượng</label>
                        <input type="text" list="variant-storage-presets" value={variant.storageLabel || ''}
                          onChange={(e) => updateVariantField(index, 'storageLabel', e.target.value)}
                          placeholder="256GB"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-gray-300" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] text-gray-500 block mb-1">RAM (GB)</label>
                        <input type="number" min="0" value={variant.ramGb || ''}
                          onChange={(e) => updateVariantField(index, 'ramGb', e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                          placeholder="8"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-gray-300" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] text-gray-500 block mb-1">Giá nhập (VNĐ)</label>
                        <input type="text" inputMode="numeric"
                          value={formatCurrencyInput(variant.costPrice)}
                          onChange={(e) => updateVariantField(index, 'costPrice', parseCurrencyToNumber(e.target.value))}
                          placeholder="25.000.000"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-red-500/50" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] text-gray-500 block mb-1">Giá bán (VNĐ)</label>
                        <input type="text" inputMode="numeric"
                          value={formatCurrencyInput(variant.price)}
                          onChange={(e) => updateVariantField(index, 'price', parseCurrencyToNumber(e.target.value))}
                          placeholder="29.990.000"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-red-500/50" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] text-gray-500 block mb-1">Tồn kho</label>
                        <input type="number" min="0" value={variant.stock || ''}
                          onChange={(e) => updateVariantField(index, 'stock', e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                          placeholder="10"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-gray-300" />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-500 block mb-1">Ảnh phiên bản</label>
                      <p className="text-[9px] text-gray-600 mb-2">Upload nhiều ảnh cho phiên bản này. Ảnh đầu tiên sẽ lưu vào variant.color_image_url.</p>
                      <div className="flex flex-wrap items-center gap-3">
                        {(variant.images || []).map((img, imageIndex) => img && img.trim() && (
                          <div key={`${img}-${imageIndex}`} className="relative group w-16 h-16">
                            <img
                              src={img}
                              alt={`Variant ${imageIndex + 1}`}
                              className="w-full h-full object-contain bg-white/5 rounded-lg border border-white/10 p-0.5"
                              onError={(e) => { e.target.src = 'https://picsum.photos/seed/fallback/80/80'; }}
                            />
                            <button
                              type="button"
                              onClick={() => removeVariantImage(index, imageIndex)}
                              className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 rounded-full text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold"
                            >
                              ×
                            </button>
                            {imageIndex === 0 && (
                              <span className="absolute bottom-1 left-1 text-[8px] bg-red-600 text-white px-1 rounded font-bold">MÀU</span>
                            )}
                          </div>
                        ))}
                        <label className="w-16 h-16 border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-red-500/40 transition-all">
                          {uploadingVariantIndex === index ? (
                            <span className="text-[10px] text-gray-500">...</span>
                          ) : (
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                            </svg>
                          )}
                          <input type="file" accept="image/*" multiple className="hidden"
                            onChange={(e) => handleVariantImagesUpload(e, index)} />
                        </label>
                      </div>
                    </div>
                  </div>
                ))}

                {(form.variants || []).length === 0 && (
                  <div className="text-center py-10 border border-dashed border-white/5 rounded-xl">
                    <p className="text-gray-600 text-sm font-bold">Chưa có phiên bản nào.</p>
                    <p className="text-gray-700 text-xs mt-1">Chọn dung lượng bên trên rồi nhấn "Thêm phiên bản".</p>
                  </div>
                )}
              </div>

              <datalist id="variant-storage-presets">
                {STORAGE_PRESETS.map(s => <option key={s} value={s} />)}
              </datalist>
              <datalist id="variant-color-presets">
                {COLOR_PRESETS.map(c => <option key={c} value={c} />)}
              </datalist>
            </section>

            {/* Specifications — CellphoneS-style grouped tabs */}
            <section className="bg-[#13151e] border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">Thông số kỹ thuật</h3>

              {/* Specs grouped by category — fixed keys + extra rows */}
              {SPEC_GROUPS.map(group => (
                <SpecGroup
                  key={group.category}
                  category={group.category}
                  keys={group.keys}
                  values={form.specifications}
                  onChange={(key, val) => {
                    updateForm(prev => ({
                      ...prev,
                      specifications: { ...(prev.specifications || {}), [key]: val },
                    }));
                  }}
                  extraRows={form.extraGroups?.find(g => g.category === group.category)?.specs}
                  onExtraChange={(rows) => {
                    updateForm(prev => {
                      const existing = (prev.extraGroups || []).filter(g => g.category !== group.category);
                      const updated = rows.length > 0
                        ? [...existing, { id: `extra-${group.category}`, category: group.category, specs: rows }]
                        : existing;
                      return { ...prev, extraGroups: updated };
                    });
                  }}
                  hiddenKeys={form.hiddenSpecKeys || []}
                  onDeleteKey={(keyToHide) => {
                    updateForm(prev => ({
                      ...prev,
                      hiddenSpecKeys: [...(prev.hiddenSpecKeys || []), keyToHide],
                      specifications: { ...(prev.specifications || {}), [keyToHide]: '' },
                    }));
                  }}
                />
              ))}

              {/* Custom groups — user-defined (for accessories) */}
              {(form.extraGroups || []).filter(g => !SPEC_GROUPS.find(sg => sg.category === g.category)).length > 0 && (
                <div className="mt-4 space-y-3">
                  {(form.extraGroups || []).filter(g => !SPEC_GROUPS.find(sg => sg.category === g.category)).map(group => (
                    <CustomGroup
                      key={group.id || group.category}
                      group={group}
                      onChange={(updated) => {
                        updateForm(prev => ({
                          ...prev,
                          extraGroups: (prev.extraGroups || []).map(g =>
                            (g.id || g.category) === (group.id || group.category) ? updated : g
                          ),
                        }));
                      }}
                      onRemove={() => {
                        updateForm(prev => ({
                          ...prev,
                          extraGroups: (prev.extraGroups || []).filter(g =>
                            (g.id || g.category) !== (group.id || group.category)
                          ),
                        }));
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Add custom group button */}
              <button
                type="button"
                onClick={() => {
                  updateForm(prev => ({
                    ...prev,
                    extraGroups: [
                      ...(prev.extraGroups || []),
                      { id: `custom-${Date.now()}`, category: '', specs: [{ key: '', value: '' }] },
                    ],
                  }));
                }}
                className="flex items-center gap-2 text-[10px] font-bold text-gray-500 hover:text-green-400 transition-colors mt-3 px-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Thêm nhóm tùy chỉnh (VD: Tai nghe, Sạc dự phòng…)
              </button>

              <p className="text-[10px] text-gray-600 mt-2">
                Nhấn "Thêm thông số khác" để bổ sung dòng. Dùng "Thêm nhóm tùy chỉnh" để thêm nhóm mới cho phụ kiện.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Admin Products List Page ──────────────────────────────────────────────────
export const AdminProducts = () => {
  const [productList, setProductList] = useState([]);
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await ProductService.getAdminProducts();
      setProductList(response.data || []);
      setIsReadOnlyMode(false);
    } catch (error) {
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        try {
          const response = await ProductService.getProducts();
          setProductList(response.data || []);
          setIsReadOnlyMode(true);
        } catch (fallbackError) {
          console.error('Cannot load fallback product list', fallbackError);
        }
      } else {
        console.error('Cannot load products', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => (
    productList.filter(product => {
      const name = String(product.name || '').toLowerCase();
      const brand = String(product.brand || '').toLowerCase();
      const query = search.toLowerCase();
      return name.includes(query) || brand.includes(query);
    })
  ), [productList, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const displayed = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleDelete = async (id) => {
    if (isReadOnlyMode) { alert('Bạn không có quyền xóa sản phẩm.'); return; }
    try {
      await ProductService.deleteProduct(id);
      setProductList(prev => prev.filter(p => (p._id || p.id) !== id));
      setDeleteConfirm(null);
    } catch (error) {
      alert(error.response?.data?.message || 'Xóa sản phẩm thất bại');
    }
  };

  const getThumbnail = (product) =>
    product.thumbnailUrl || (product.images && product.images[0]) || '';

  const handleSaveSuccess = () => {
    setShowForm(false);
    setEditingProduct(null);
    fetchProducts();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Sản phẩm</h1>
          <p className="text-sm text-gray-500 mt-1">{productList.length} sản phẩm</p>
        </div>
        <button onClick={() => { setEditingProduct(null); setShowForm(true); }}
          disabled={isReadOnlyMode}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm sản phẩm
        </button>
      </div>

      {isReadOnlyMode && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200">
          Bạn chưa có quyền quản trị đầy đủ. Đang hiển thị danh sách ở chế độ chỉ xem.
        </div>
      )}

      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" placeholder="Tìm theo tên, thương hiệu..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          className="w-full bg-[#13151e] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-all" />
      </div>

      <div className="bg-[#13151e] border border-white/5 rounded-2xl overflow-hidden">
        {loading && <div className="px-6 py-4 text-sm text-gray-400 border-b border-white/5">Đang tải dữ liệu...</div>}
        <table className="w-full">
          <thead>
            <tr className="text-[10px] text-gray-500 uppercase tracking-widest border-b border-white/5">
              <th className="text-left px-6 py-3 font-medium">Sản phẩm</th>
              <th className="text-left px-6 py-3 font-medium hidden md:table-cell">Thương hiệu</th>
              <th className="text-left px-6 py-3 font-medium hidden lg:table-cell">Series</th>
              <th className="text-right px-6 py-3 font-medium">Giá từ</th>
              <th className="text-center px-6 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((product) => {
              const pid = product._id || product.id;
              return (
                <tr key={pid} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <img src={getThumbnail(product)} alt=""
                        className="w-10 h-10 object-contain bg-white/5 rounded-xl p-1 flex-shrink-0"
                        onError={(e) => { e.target.src = 'https://picsum.photos/seed/fallback/80/80'; }} />
                      <div>
                        <p className="text-sm font-medium text-white">{product.name}</p>
                        <p className="text-[11px] text-gray-500 line-clamp-1">
                          {product.description ? 'Đã có mô tả' : '—'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 hidden md:table-cell">
                    <span className="text-xs bg-white/5 text-gray-400 px-2 py-1 rounded-lg">{product.brand}</span>
                  </td>
                  <td className="px-6 py-3 hidden lg:table-cell">
                    {product.seriesName ? (
                      <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded-lg">{product.seriesName}</span>
                    ) : (
                      <span className="text-[11px] text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span className="text-sm font-bold text-red-400">{Number(product.price || 0).toLocaleString()}₫</span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => { setEditingProduct(product); setShowForm(true); }}
                        disabled={isReadOnlyMode}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => setDeleteConfirm(pid)}
                        disabled={isReadOnlyMode}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {displayed.length === 0 && <div className="py-16 text-center text-gray-600 font-bold">Không tìm thấy sản phẩm nào</div>}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">Hiển thị {displayed.length} / {filtered.length} sản phẩm</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition-all text-sm">←</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button key={page} onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${currentPage === page ? 'bg-red-600 text-white' : 'border border-white/10 text-gray-400 hover:text-white'}`}>{page}</button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition-all text-sm">→</button>
          </div>
        </div>
      )}

      {showForm && (
        <ProductFormPage
          editingProduct={editingProduct}
          onClose={() => { setShowForm(false); setEditingProduct(null); }}
          onSaveSuccess={handleSaveSuccess}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#13151e] border border-white/10 rounded-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-white mb-2">Xóa sản phẩm?</h3>
            <p className="text-sm text-gray-400 mb-6">Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white transition-all">
                Hủy
              </button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-bold text-white transition-all">
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
