import React, { useEffect, useMemo, useRef, useState } from 'react';
import ProductService from '../../services/productService';

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
const STORAGE_PRESETS = ['128GB', '256GB', '512GB', '1TB'];
const RAM_PRESETS = ['6', '8', '12', '16'];
const COLOR_PRESETS = ['Đen', 'Trắng', 'Xanh', 'Tím', 'Vàng'];

const createEmptyVariant = (overrides = {}) => ({
  color: '',
  storageLabel: '',
  price: '',
  stock: '',
  ramGb: '',
  ...overrides,
});

const normalizeStorageLabel = (value) => {
  const normalized = String(value || '').trim().toUpperCase();
  if (!normalized) return '';
  if (normalized.endsWith('TB') || normalized.endsWith('GB')) return normalized;
  if (/^\d+$/.test(normalized)) return `${normalized}GB`;
  return normalized;
};

const buildVariantPreviewName = (baseName, variant) => {
  const base = String(baseName || '').trim();
  const ramPart = variant?.ramGb ? `${variant.ramGb}GB RAM` : '';
  const storagePart = normalizeStorageLabel(variant?.storageLabel || '');
  return [base, ramPart, storagePart].filter(Boolean).join(' - ');
};

const emptyForm = {
  name: '',
  brand: '',
  description: '',
  images: [],
  specifications: {
    screen: '',
    cpu: '',
    battery: '',
    camera: '',
    os: '',
    connectivity: '',
  },
  variants: [createEmptyVariant({ color: 'Đen', storageLabel: '128GB' })],
};

export const AdminProducts = () => {
  const [productList, setProductList] = useState([]);
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [quickVariant, setQuickVariant] = useState({ color: 'Đen', storageLabel: '256GB', ramGb: '8' });
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProducts();
  }, []);

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
          alert('Không thể tải danh sách sản phẩm. Vui lòng kiểm tra backend hoặc đăng nhập lại.');
        }
      } else {
        console.error('Cannot load products', error);
        alert('Không thể tải danh sách sản phẩm. Vui lòng kiểm tra backend hoặc đăng nhập lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => (
    productList.filter((product) => {
      const name = String(product.name || '').toLowerCase();
      const brand = String(product.brand || '').toLowerCase();
      const query = search.toLowerCase();
      return name.includes(query) || brand.includes(query);
    })
  ), [productList, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const displayed = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const openAdd = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setQuickVariant({ color: 'Đen', storageLabel: '256GB', ramGb: '8' });
    setShowModal(true);
  };

  const openEdit = (product) => {
    const mappedVariants = (product.variantItems || []).map((variant) => ({
      id: variant.id,
      color: variant.color || 'Đen',
      storageLabel: variant.storageLabel || 'Mặc định',
      price: variant.price ?? '',
      stock: variant.stock ?? '',
      ramGb: variant.ramGb ?? '',
    }));

    setEditingProduct(product);
    setForm({
      name: product.name || '',
      brand: product.brand || '',
      description: product.description || '',
      images: product.images || (product.image ? [product.image] : []),
      specifications: {
        ...emptyForm.specifications,
        ...(product.specifications || {}),
      },
      variants: mappedVariants.length > 0 ? mappedVariants : [createEmptyVariant({ color: 'Đen', storageLabel: '128GB' })],
    });
    setQuickVariant({ color: 'Đen', storageLabel: '256GB', ramGb: '8' });
    setShowModal(true);
  };

  const appendVariant = (overrides = {}) => {
    setForm((prev) => ({
      ...prev,
      variants: [...(prev.variants || []), createEmptyVariant(overrides)],
    }));
  };

  const removeVariantRow = (index) => {
    setForm((prev) => {
      const nextVariants = (prev.variants || []).filter((_, i) => i !== index);
      return {
        ...prev,
        variants: nextVariants.length > 0 ? nextVariants : [createEmptyVariant({ color: 'Đen', storageLabel: '128GB' })],
      };
    });
  };

  const updateVariantField = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      variants: (prev.variants || []).map((variant, i) => (i === index ? { ...variant, [key]: value } : variant)),
    }));
  };

  const updateSpecField = (key, value) => {
    setForm((prev) => ({
      ...prev,
      specifications: {
        ...(prev.specifications || {}),
        [key]: value,
      },
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const response = await ProductService.uploadImage(file);
        uploadedUrls.push(response.data.imageUrl);
      }

      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));
    } catch (error) {
      console.error('Upload image failed', error);
      const serverMessage = error.response?.data?.message || error.response?.data?.error;
      alert(serverMessage || 'Upload ảnh thất bại');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (index) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (isReadOnlyMode) {
      alert('Bạn không có quyền chỉnh sửa sản phẩm.');
      return;
    }

    if (!form.name.trim() || !form.brand.trim()) {
      alert('Vui lòng nhập tên sản phẩm và thương hiệu.');
      return;
    }

    const preparedVariants = (form.variants || [])
      .filter((variant) => (
        (variant.color || '').trim()
        || (variant.storageLabel || '').trim()
        || variant.price
        || variant.stock
        || variant.ramGb
      ))
      .map((variant) => ({
        color: (variant.color || '').trim() || 'Default',
        storageLabel: normalizeStorageLabel(variant.storageLabel) || 'Mặc định',
        price: Number(variant.price || 0),
        stock: Number(variant.stock || 0),
        ramGb: variant.ramGb ? Number(variant.ramGb) : null,
      }));

    if (preparedVariants.length === 0) {
      alert('Vui lòng thêm ít nhất 1 biến thể.');
      return;
    }

    if (preparedVariants.every((variant) => Number(variant.price || 0) <= 0)) {
      alert('Vui lòng nhập giá cho ít nhất 1 biến thể.');
      return;
    }

    const totalVariantStock = preparedVariants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0);
    const firstVariantPrice = preparedVariants.find((variant) => Number(variant.price || 0) > 0)?.price || 0;
    const payloadSpecifications = SPEC_KEYS.reduce((acc, key) => {
      acc[key] = String(form.specifications?.[key] || '').trim();
      return acc;
    }, {});

    const payload = {
      name: form.name,
      brand: form.brand,
      description: form.description,
      images: form.images,
      specifications: payloadSpecifications,
      variants: preparedVariants,
      price: Number(firstVariantPrice || 0),
      stock: Number(totalVariantStock || 0),
    };

    setSaving(true);
    try {
      if (editingProduct) {
        const id = editingProduct._id || editingProduct.id;
        const response = await ProductService.updateProduct(id, payload);
        setProductList((prev) => prev.map((product) => ((product._id === id || product.id === id) ? response.data : product)));
      } else {
        const response = await ProductService.createProduct(payload);
        setProductList((prev) => [response.data, ...prev]);
      }
      setShowModal(false);
    } catch (error) {
      console.error('Save product failed', error);
      alert(error.response?.data?.message || 'Lưu sản phẩm thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (isReadOnlyMode) {
      alert('Bạn không có quyền xóa sản phẩm.');
      return;
    }

    try {
      await ProductService.deleteProduct(id);
      setProductList((prev) => prev.filter((product) => product._id !== id && product.id !== id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Delete product failed', error);
      alert(error.response?.data?.message || 'Xóa sản phẩm thất bại');
    }
  };

  const getThumbnail = (product) => (product.images && product.images[0]) || product.image || '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Sản phẩm</h1>
          <p className="text-sm text-gray-500 mt-1">{productList.length} sản phẩm</p>
        </div>
        <button
          onClick={openAdd}
          disabled={isReadOnlyMode}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Thêm sản phẩm
        </button>
      </div>

      {isReadOnlyMode && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200">
          Bạn chưa có quyền quản trị đầy đủ. Đang hiển thị danh sách ở chế độ chỉ xem.
        </div>
      )}

      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input
          type="text"
          placeholder="Tìm theo tên, thương hiệu..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full bg-[#13151e] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-all"
        />
      </div>

      <div className="bg-[#13151e] border border-white/5 rounded-2xl overflow-hidden">
        {loading && <div className="px-6 py-4 text-sm text-gray-400 border-b border-white/5">Đang tải dữ liệu...</div>}
        <table className="w-full">
          <thead>
            <tr className="text-[10px] text-gray-500 uppercase tracking-widest border-b border-white/5">
              <th className="text-left px-6 py-3 font-medium">Sản phẩm</th>
              <th className="text-left px-6 py-3 font-medium hidden md:table-cell">Thương hiệu</th>
              <th className="text-right px-6 py-3 font-medium">Giá</th>
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
                      <img
                        src={getThumbnail(product)}
                        alt=""
                        className="w-10 h-10 object-contain bg-white/5 rounded-xl p-1 flex-shrink-0"
                        onError={(e) => { e.target.src = 'https://picsum.photos/seed/fallback/80/80'; }}
                      />
                      <div>
                        <p className="text-sm font-medium text-white">{product.name}</p>
                        <p className="text-[11px] text-gray-500 line-clamp-1">{product.description || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 hidden md:table-cell">
                    <span className="text-xs bg-white/5 text-gray-400 px-2 py-1 rounded-lg">{product.brand}</span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span className="text-sm font-bold text-red-400">{Number(product.price || 0).toLocaleString()}₫</span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(product)}
                        disabled={isReadOnlyMode}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(pid)}
                        disabled={isReadOnlyMode}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition-all text-sm"
            >
              ←
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${currentPage === page ? 'bg-red-600 text-white' : 'border border-white/10 text-gray-400 hover:text-white'}`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition-all text-sm"
            >
              →
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#13151e] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h3 className="text-lg font-black text-white">{editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
              <section className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Tên sản phẩm</label>
                    <input
                      type="text"
                      value={form.name}
                      placeholder="iPhone 15 Pro Max"
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Thương hiệu</label>
                    <input
                      type="text"
                      value={form.brand}
                      placeholder="Apple"
                      onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Mô tả</label>
                  <textarea
                    value={form.description}
                    rows={3}
                    placeholder="Mô tả sản phẩm..."
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Hình ảnh sản phẩm</label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full border-2 border-dashed border-white/10 rounded-xl py-6 flex flex-col items-center gap-2 text-gray-500 hover:border-red-500/40 hover:text-gray-300 transition-all"
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-xs font-bold">{uploading ? 'Đang upload ảnh...' : 'Nhấn để chọn ảnh'}</span>
                    <span className="text-[10px] text-gray-600">JPG, PNG, WEBP — nhiều file cùng lúc</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />

                  {form.images.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-3">
                      {form.images.map((img, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={img}
                            alt=""
                            className="w-20 h-20 object-contain bg-white/5 rounded-xl border border-white/10 p-1"
                            onError={(e) => { e.target.src = 'https://picsum.photos/seed/fallback/80/80'; }}
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                          {index === 0 && (
                            <span className="absolute bottom-1 left-1 text-[8px] bg-red-600 text-white px-1 rounded font-bold">CHÍNH</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-4 border-t border-white/5 pt-5">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h4 className="text-sm font-bold text-white">Biến thể</h4>
                    <p className="text-xs text-gray-500 mt-1">RAM và dung lượng chỉ nhập tại đây. Tồn kho được quản lý riêng ở mục Kho.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => appendVariant()}
                    className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 hover:border-red-500/50 hover:text-white transition-all"
                  >
                    + Thêm biến thể
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {STORAGE_PRESETS.map((storage) => (
                    <button
                      key={storage}
                      type="button"
                      onClick={() => appendVariant({ color: quickVariant.color, storageLabel: storage, ramGb: quickVariant.ramGb })}
                      className="text-[11px] px-2.5 py-1 rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                    >
                      + {storage}
                    </button>
                  ))}
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => appendVariant({ color, storageLabel: quickVariant.storageLabel, ramGb: quickVariant.ramGb })}
                      className="text-[11px] px-2.5 py-1 rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                    >
                      + {color}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">RAM mặc định</label>
                    <select
                      value={quickVariant.ramGb}
                      onChange={(e) => setQuickVariant((prev) => ({ ...prev, ramGb: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-gray-300"
                    >
                      {RAM_PRESETS.map((ram) => <option key={ram} value={ram}>{ram}GB</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">Dung lượng mặc định</label>
                    <select
                      value={quickVariant.storageLabel}
                      onChange={(e) => setQuickVariant((prev) => ({ ...prev, storageLabel: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-gray-300"
                    >
                      {STORAGE_PRESETS.map((storage) => <option key={storage} value={storage}>{storage}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">Màu mặc định</label>
                    <select
                      value={quickVariant.color}
                      onChange={(e) => setQuickVariant((prev) => ({ ...prev, color: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-gray-300"
                    >
                      {COLOR_PRESETS.map((color) => <option key={color} value={color}>{color}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  {(form.variants || []).map((variant, index) => (
                    <div key={variant.id || index} className="space-y-2 p-3 rounded-xl border border-white/10 bg-white/[0.02]">
                      <p className="text-[11px] text-emerald-300/90">
                        Tên hiển thị: {buildVariantPreviewName(form.name, variant) || 'Nhập tên sản phẩm ở trên'}
                      </p>
                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-4 md:col-span-3">
                          <label className="text-[10px] text-gray-500 block mb-1">Màu sắc</label>
                          <input
                            type="text"
                            list="variant-color-presets"
                            value={variant.color || ''}
                            onChange={(e) => updateVariantField(index, 'color', e.target.value)}
                            placeholder="Đen"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-gray-300"
                          />
                        </div>
                        <div className="col-span-4 md:col-span-3">
                          <label className="text-[10px] text-gray-500 block mb-1">Dung lượng</label>
                          <input
                            type="text"
                            list="variant-storage-presets"
                            value={variant.storageLabel || ''}
                            onChange={(e) => updateVariantField(index, 'storageLabel', e.target.value)}
                            placeholder="256GB"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-gray-300"
                          />
                        </div>
                        <div className="col-span-4 md:col-span-2">
                          <label className="text-[10px] text-gray-500 block mb-1">RAM (GB)</label>
                          <input
                            type="number"
                            value={variant.ramGb || ''}
                            onChange={(e) => updateVariantField(index, 'ramGb', e.target.value)}
                            placeholder="8"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-gray-300"
                          />
                        </div>
                        <div className="col-span-8 md:col-span-3">
                          <label className="text-[10px] text-gray-500 block mb-1">Giá</label>
                          <input
                            type="number"
                            value={variant.price || ''}
                            onChange={(e) => updateVariantField(index, 'price', e.target.value)}
                            placeholder="29990000"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-gray-300"
                          />
                        </div>
                        <div className="col-span-4 md:col-span-1 flex items-end">
                          <button
                            type="button"
                            onClick={() => removeVariantRow(index)}
                            className="w-full py-2 rounded-lg border border-red-500/30 text-red-400 text-xs hover:bg-red-500/10"
                          >
                            X
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <datalist id="variant-storage-presets">
                  {STORAGE_PRESETS.map((storage) => <option key={storage} value={storage} />)}
                </datalist>
                <datalist id="variant-color-presets">
                  {COLOR_PRESETS.map((color) => <option key={color} value={color} />)}
                </datalist>
              </section>

              <section className="space-y-4 border-t border-white/5 pt-5">
                <div>
                  <h4 className="text-sm font-bold text-white">Thông số kỹ thuật</h4>
                  <p className="text-xs text-gray-500 mt-1">Đã bỏ RAM và bộ nhớ vì 2 trường đó đang nằm ở biến thể.</p>
                </div>

                <div className="space-y-4">
                  {SPEC_KEYS.map((key) => (
                    <div key={key}>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">{SPEC_LABELS[key]}</label>
                      <input
                        type="text"
                        value={form.specifications[key] || ''}
                        placeholder={key === 'screen' ? '6.7-inch OLED, 120Hz' : key === 'cpu' ? 'Apple A17 Pro' : ''}
                        onChange={(e) => updateSpecField(key, e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-all"
                      />
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-white/5">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white hover:border-white/20 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-bold text-white transition-all active:scale-95"
              >
                {saving ? 'Đang lưu...' : (editingProduct ? 'Lưu thay đổi' : 'Thêm sản phẩm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#13151e] border border-white/10 rounded-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-lg font-black text-white mb-2">Xóa sản phẩm?</h3>
              <p className="text-sm text-gray-400 mb-6">Hành động này không thể hoàn tác.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-bold text-white transition-all"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
