import React, { useEffect, useMemo, useRef, useState } from 'react';
import ProductService from '../../services/productService';
import AdminService from '../../services/adminService';
import SeriesService from '../../services/seriesService';

const ITEMS_PER_PAGE = 8;

const SPEC_KEYS = ['screen', 'cpu', 'battery', 'camera', 'os', 'connectivity'];
const SPEC_LABELS = {
  screen: 'Màn hình',
  cpu: 'Vi xử lý',
  battery: 'Pin',
  camera: 'Camera',
  os: 'Hệ điều hành',
  connectivity: 'Kết nối',
};

const STORAGE_PRESETS = ['64GB', '128GB', '256GB', '512GB', '1TB', '2TB', '5TB'];
const RAM_PRESETS = ['2', '4', '6', '8', '12', '16', '32', '64', '128'];
const COLOR_PRESETS = ['Đen', 'Trắng', 'Xanh', 'Tím', 'Vàng', 'Hồng', 'Đỏ', 'Bạc', 'Nâu', 'Cam'];

// Convert storage label like "128GB", "256GB", "1TB" to integer bytes
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
  specifications: {
    screen: '', cpu: '', battery: '', camera: '', os: '', connectivity: '',
  },
  variants: [], // [{id, color, storageLabel, ramGb, price, stock, colorImageUrl}]
};

import { TiptapEditor } from '../../components/ui/RichTextEditor';

const createEmptyVariant = () => ({
  id: null,
  color: '',
  storageLabel: '',
  ramGb: '',
  price: '',
  stock: '',
  colorImageUrl: '',
});

const ProductFormPage = ({ editingProduct, onClose, onSaveSuccess }) => {
  const [form, setForm] = useState(emptyForm);
  const [fetching, setFetching] = useState(!!editingProduct);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingVariantIndex, setUploadingVariantIndex] = useState(null);

  const [pickerStorage, setPickerStorage] = useState('');
  const [pickerRam, setPickerRam] = useState('');
  const [pickerColor, setPickerColor] = useState('Đen');

  const [brands, setBrands] = useState([]);
  const [showBrandInput, setShowBrandInput] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [savingBrand, setSavingBrand] = useState(false);

  // Brand search dropdown
  const [brandSearch, setBrandSearch] = useState('');
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);

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
    setShowBrandDropdown(true);
    setLoadingBrands(true);
    const timer = setTimeout(() => {
      setLoadingBrands(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [brandSearch]);

  const filteredBrands = brands.filter((b) =>
    b.name?.toLowerCase().includes(brandSearch.toLowerCase())
  );

  const fileInputRef = useRef(null);
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
        // editingProduct has `id` and optionally `selectedVariant?.slug`
        const productId = editingProduct._id || editingProduct.id;
        // Use the first variant's slug if available, otherwise fetch all products and find one
        let variantSlug = editingProduct.selectedVariant?.slug;
        let data;

        if (variantSlug) {
          const res = await ProductService.getProductDetail(variantSlug);
          data = res.data;
        } else {
          // Fallback: fetch all products and match by id
          const res = await ProductService.getAdminProducts();
          const match = (res.data || []).find(p => (p._id || p.id) == productId);
          if (match?.selectedVariant?.slug) {
            const detailRes = await ProductService.getProductDetail(match.selectedVariant.slug);
            data = detailRes.data;
          } else {
            // Direct match, build minimal form
            data = match || {};
            data.variants = match?.variants || [];
            data.specifications = match?.specifications || {};
          }
        }

        setForm({
          name: data.name || '',
          brand: data.brand || '',
          seriesId: data.seriesId || '',
          description: data.description || '',
          thumbnailUrl: data.thumbnailUrl || '',
          images: data.images || [],
          specifications: {
            ...emptyForm.specifications,
            ...(data.specifications || {}),
          },
          variants: (data.variants || []).map(v => ({
            id: v.id || null,
            color: v.color || 'Đen',
            storageLabel: v.storageLabel || '',
            ramGb: v.ramGb ?? '',
            price: v.price ?? '',
            stock: v.stock ?? '',
            colorImageUrl: v.colorImageUrl || '',
          })),
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

  const updateSpecField = (key, value) => {
    updateForm((prev) => ({
      ...prev,
      specifications: { ...(prev.specifications || {}), [key]: value },
    }));
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

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = [];
      for (const file of files) {
        const response = await ProductService.uploadImage(file);
        urls.push(response.data.imageUrl);
      }
      updateForm((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
    } catch (error) {
      alert('Upload ảnh thất bại');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleVariantColorImageUpload = async (e, variantIndex) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVariantIndex(variantIndex);
    try {
      const response = await ProductService.uploadImage(file);
      updateVariantField(variantIndex, 'colorImageUrl', response.data.imageUrl);
    } catch (error) {
      alert('Upload ảnh màu thất bại');
    } finally {
      setUploadingVariantIndex(null);
      e.target.value = '';
    }
  };

  const removeImage = (index) => {
    updateForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const removeThumbnail = () => updateForm({ thumbnailUrl: '' });

  const handleAddVariant = () => {
    if (!pickerStorage) {
      alert('Vui lòng chọn Dung lượng trước khi thêm phiên bản.');
      return;
    }
    appendVariant({ color: pickerColor, storageLabel: pickerStorage, ramGb: pickerRam || null });
    setPickerStorage('');
    setPickerRam('');
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

    const payloadSpecifications = SPEC_KEYS.reduce((acc, key) => {
      acc[key] = String(form.specifications?.[key] || '').trim();
      return acc;
    }, {});

    const payload = {
      name: form.name.trim(),
      brand: form.brand,
      seriesId: form.seriesId || null,
      description: form.description,
      thumbnailUrl: form.thumbnailUrl || null,
      images: form.images,
      specifications: payloadSpecifications,
      variants: validVariants.map(v => {
        const label = (v.storageLabel || '').trim();
        return {
          id: v.id || null,
          color: (v.color || '').trim() || 'Default',
          storageLabel: label,
          storageGb: parseStorageToNumber(label),
          ramGb: v.ramGb ? Number(v.ramGb) : null,
          price: Number(v.price || 0),
          stock: Number(v.stock || 0),
          colorImageUrl: v.colorImageUrl || null,
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
            <p className="text-xs text-gray-500 mt-0.5">
              {editingProduct ? `ID: ${editingProduct._id || editingProduct.id}` : '1 sản phẩm = N phiên bản (RAM/storage khác nhau)'}
            </p>
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
        <div className="max-w-[1400px] mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">

          {/* Left Column */}
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
                  <p className="text-[10px] text-gray-600 mt-1">
                    Tên chung cho tất cả phiên bản. Mỗi phiên bản = 1 variant riêng trong CSDL.
                  </p>
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
                        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl max-h-60 overflow-y-auto shadow-xl">
                          {loadingBrands ? (
                            <div className="px-4 py-3 text-sm text-gray-500">Đang tìm...</div>
                          ) : filteredBrands.length === 0 && brandSearch ? (
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
                      {form.brand && (
                        <p className="text-[10px] text-green-400 mt-1">✓ Đã chọn: {form.brand}</p>
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
                            <option value="">-- Không thuộc dòng nào --</option>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Ảnh Thumbnail</label>
                  <p className="text-[10px] text-gray-600 mb-2">Ảnh đại diện trong danh sách.</p>
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

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Ảnh Gallery</label>
                  <p className="text-[10px] text-gray-600 mb-2">Nhiều ảnh trong trang chi tiết.</p>
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-28 h-28 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-red-500/40 hover:text-gray-300 transition-all">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-[11px]">{uploading ? '...' : 'Upload'}</span>
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} />
                </div>
              </div>

              {form.images.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {form.images.map((img, index) => img && img.trim() && (
                    <div key={index} className="relative group">
                      <img src={img} alt=""
                        className="w-20 h-20 object-contain bg-white/5 rounded-xl border border-white/10 p-1"
                        onError={(e) => { e.target.src = 'https://picsum.photos/seed/fallback/80/80'; }} />
                      <button onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold">×</button>
                      {index === 0 && <span className="absolute bottom-1 left-1 text-[8px] bg-red-600 text-white px-1 rounded font-bold">CHÍNH</span>}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Variants */}
            <section className="bg-[#13151e] border border-white/5 rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Phiên bản</h3>
                  <p className="text-xs text-gray-500 mt-1">Mỗi phiên bản (RAM/storage) = 1 row trong CSDL.</p>
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
                      <div className="col-span-3">
                        <label className="text-[10px] text-gray-500 block mb-1">Màu sắc</label>
                        <input type="text" list="variant-color-presets" value={variant.color || ''}
                          onChange={(e) => updateVariantField(index, 'color', e.target.value)}
                          placeholder="Đen, Bạc..."
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-red-500/50" />
                      </div>
                      <div className="col-span-3">
                        <label className="text-[10px] text-gray-500 block mb-1">Dung lượng</label>
                        <input type="text" list="variant-storage-presets" value={variant.storageLabel || ''}
                          onChange={(e) => updateVariantField(index, 'storageLabel', e.target.value)}
                          placeholder="256GB"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-gray-300" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] text-gray-500 block mb-1">RAM (GB)</label>
                        <input type="number" value={variant.ramGb || ''}
                          onChange={(e) => updateVariantField(index, 'ramGb', e.target.value)}
                          placeholder="8"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-gray-300" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] text-gray-500 block mb-1">Giá (VNĐ)</label>
                        <input type="number" value={variant.price || ''}
                          onChange={(e) => updateVariantField(index, 'price', e.target.value)}
                          placeholder="29990000"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-gray-300" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] text-gray-500 block mb-1">Tồn kho</label>
                        <input type="number" value={variant.stock || ''}
                          onChange={(e) => updateVariantField(index, 'stock', e.target.value)}
                          placeholder="10"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-gray-300" />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-500 block mb-1">Ảnh màu sắc</label>
                      <div className="flex items-center gap-3">
                        {variant.colorImageUrl ? (
                          <div className="relative group w-14 h-14">
                            <img src={variant.colorImageUrl} alt="Color"
                              className="w-full h-full object-contain bg-white/5 rounded-lg border border-white/10 p-0.5"
                              onError={(e) => { e.target.src = 'https://picsum.photos/seed/fallback/80/80'; }} />
                            <button type="button"
                              onClick={() => updateVariantField(index, 'colorImageUrl', '')}
                              className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 rounded-full text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold">×</button>
                          </div>
                        ) : (
                          <label className="w-14 h-14 border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-red-500/40 transition-all">
                            {uploadingVariantIndex === index ? (
                              <span className="text-[10px] text-gray-500">...</span>
                            ) : (
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                              </svg>
                            )}
                            <input type="file" accept="image/*" className="hidden"
                              onChange={(e) => handleVariantColorImageUpload(e, index)} />
                          </label>
                        )}
                        <p className="text-[9px] text-gray-600">Ảnh hiển thị khi chọn màu {variant.color || 'này'}</p>
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

            {/* Specifications */}
            <section className="bg-[#13151e] border border-white/5 rounded-2xl p-6 space-y-5">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Thông số kỹ thuật</h3>
              <div className="space-y-4">
                {SPEC_KEYS.map(key => (
                  <div key={key}>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">{SPEC_LABELS[key]}</label>
                    <input type="text" value={form.specifications[key] || ''}
                      placeholder={key === 'screen' ? '6.7-inch OLED, 120Hz' : key === 'cpu' ? 'Apple A17 Pro' : ''}
                      onChange={(e) => updateSpecField(key, e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-all" />
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Preview */}
          <div className="lg:block">
            <div className="sticky top-8">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Xem trước</h3>
              <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
                <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                  {form.thumbnailUrl ? (
                    <img src={form.thumbnailUrl} alt="preview"
                      className="w-full h-full object-contain"
                      onError={(e) => { e.target.src = 'https://picsum.photos/seed/preview/400/400'; }} />
                  ) : form.images.length > 0 ? (
                    <img src={form.images[0]} alt="preview"
                      className="w-full h-full object-contain"
                      onError={(e) => { e.target.src = 'https://picsum.photos/seed/preview/400/400'; }} />
                  ) : (
                    <div className="text-center text-gray-300">
                      <svg className="w-12 h-12 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <p className="text-xs">Chưa có ảnh</p>
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  {form.brand && <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{form.brand}</p>}
                  <p className="font-bold text-gray-900 text-sm leading-tight">{form.name || 'Tên sản phẩm'}</p>
                  {form.variants.length > 0 && (
                    <p className="text-lg font-black text-red-600">
                      {Number(form.variants.find(v => v.price)?.price || 0).toLocaleString()}₫
                    </p>
                  )}
                  {form.variants.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {[...new Set(form.variants.map(v => v.storageLabel).filter(Boolean))].map(s => (
                        <span key={s} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded font-bold">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
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
