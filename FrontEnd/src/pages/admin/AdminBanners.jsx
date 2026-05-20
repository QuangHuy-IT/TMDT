import React, { useEffect, useState, useCallback } from 'react';
import AdminService from '../../services/adminService';
import ProductService from '../../services/productService';

const BANNER_POSITIONS = [
  { value: 'home_hero', label: 'Trang chủ (Hero Slider)' },
  { value: 'sidebar', label: 'Thanh bên (Sidebar)' },
];

const AdminBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Brand selector
  const [brands, setBrands] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(false);

  // Product search (flash-sale style)
  const [productSearch, setProductSearch] = useState('');
  const [productDropdown, setProductDropdown] = useState(false);
  const [productList, setProductList] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);

  // Promotion search (flash-sale style)
  const [promotionSearch, setPromotionSearch] = useState('');
  const [promotionDropdown, setPromotionDropdown] = useState(false);
  const [promotionList, setPromotionList] = useState([]);
  const [loadingPromotions, setLoadingPromotions] = useState(false);

  const [form, setForm] = useState({
    title: '', imageUrl: '', linkUrl: '', position: 'home_hero',
    isActive: true, sortOrder: 0, startAt: '', endAt: '',
    linkType: 'none',
    brandId: '',
    productId: '',
    promotionSlug: '',
  });
  const imageInputRef = React.useRef(null);

  useEffect(() => { fetchBanners(); }, []);

  // Load brands when needed
  useEffect(() => {
    if (form.linkType === 'brand' && brands.length === 0) {
      setLoadingBrands(true);
      AdminService.getBrands().then((r) => setBrands(r.data || [])).catch(console.error).finally(() => setLoadingBrands(false));
    }
  }, [form.linkType]);

  // Debounced product search
  useEffect(() => {
    if (form.linkType !== 'product') return;
    const q = productSearch.trim();
    const timer = setTimeout(() => {
      setLoadingProducts(true);
      ProductService.getAdminProducts()
        .then((r) => {
          const all = r.data || [];
          if (q.length < 1) {
            setProductList(all.slice(0, 15));
          } else {
            const lower = q.toLowerCase();
            setProductList(all.filter((p) =>
              p.name?.toLowerCase().includes(lower) ||
              p.brand?.toLowerCase().includes(lower) ||
              p.slug?.toLowerCase().includes(lower)
            ).slice(0, 15));
          }
        })
        .catch(console.error)
        .finally(() => setLoadingProducts(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch, form.linkType]);

  // Debounced promotion search
  useEffect(() => {
    if (form.linkType !== 'promotion') return;
    const q = promotionSearch.trim();
    const timer = setTimeout(() => {
      setLoadingPromotions(true);
      AdminService.getPromotions()
        .then((r) => {
          const data = r.data?.data ?? r.data ?? [];
          if (q.length < 1) {
            setPromotionList(data.slice(0, 15));
          } else {
            const lower = q.toLowerCase();
            setPromotionList(data.filter((p) =>
              p.name?.toLowerCase().includes(lower) ||
              p.title?.toLowerCase().includes(lower) ||
              p.slug?.toLowerCase().includes(lower)
            ).slice(0, 15));
          }
        })
        .catch(console.error)
        .finally(() => setLoadingPromotions(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [promotionSearch, form.linkType]);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await AdminService.getBanners();
      setBanners(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const resetForm = (nextSortOrder = 1) => {
    setForm({ title: '', imageUrl: '', linkUrl: '', position: 'home_hero', isActive: true, sortOrder: nextSortOrder, startAt: '', endAt: '', linkType: 'none', brandId: '', productId: '', promotionSlug: '' });
    setProductSearch('');
    setProductList([]);
    setProductDropdown(false);
    setSelectedProduct(null);
    setSelectedVariant(null);
    setPromotionSearch('');
    setPromotionList([]);
    setPromotionDropdown(false);
  };

  const openAdd = () => {
    setEditingBanner(null);
    setBrands([]);
    const maxOrder = banners.reduce((max, b) => Math.max(max, Number(b.sortOrder) || 0), 0);
    resetForm(maxOrder + 1);
    setShowForm(true);
  };

  const openEdit = (banner) => {
    let linkType = 'none';
    let brandId = '', productId = '', promotionSlug = '';
    const url = banner.linkUrl || '';
    if (url.includes('/khuyen-mai/') || url.includes('/promo')) { linkType = 'promotion'; promotionSlug = url.split('/').pop(); }
    else if (url.includes('/products/')) { linkType = 'product'; productId = url.split('/').pop(); }
    else if (url.includes('/brands/')) { linkType = 'brand'; brandId = url.split('/').pop(); }

    setEditingBanner(banner);
    setForm({ title: banner.title || '', imageUrl: banner.imageUrl || '', linkUrl: banner.linkUrl || '', position: banner.position || 'home_hero', isActive: banner.isActive !== false, sortOrder: banner.sortOrder || 0, startAt: banner.startAt || '', endAt: banner.endAt || '', linkType, brandId, productId, promotionSlug });
    setProductSearch('');
    setProductList([]);
    setProductDropdown(false);
    setSelectedProduct(null);
    setSelectedVariant(null);
    setPromotionSearch(promotionSlug || '');
    setPromotionList([]);
    setPromotionDropdown(false);

    // Load brand list nếu là brand
    if (linkType === 'brand') {
      setLoadingBrands(true);
      AdminService.getBrands().then((r) => {
        const brandList = r.data || [];
        setBrands(brandList);
      }).catch(console.error).finally(() => setLoadingBrands(false));
    }

    // Load promotion list nếu là promotion
    if (linkType === 'promotion') {
      setLoadingPromotions(true);
      AdminService.getPromotions().then((r) => {
        const data = r.data?.data ?? r.data ?? [];
        setPromotionList(data);
      }).catch(console.error).finally(() => setLoadingPromotions(false));
    }

    // Load product list + tìm product đang chọn nếu là product
    if (linkType === 'product' && productId) {
      setLoadingProducts(true);
      ProductService.getAdminProducts().then((r) => {
        const all = r.data || [];
        setProductList(all.slice(0, 15));
        const found = all.find((p) => String(p.id) === String(productId) || p.slug === productId);
        if (found) {
          setSelectedProduct(found);
          setProductSearch(found.name);
          // Tìm variant đang chọn nếu linkUrl có variant id
          const parts = url.split('/');
          const variantId = parts[parts.length - 1];
          const isVariant = found.variantItems?.some((v) => String(v.id) === variantId);
          if (isVariant) {
            const v = found.variantItems.find((x) => String(x.id) === variantId);
            setSelectedVariant(v);
          }
        }
      }).catch(console.error).finally(() => setLoadingProducts(false));
    }

    setShowForm(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await ProductService.uploadImage(file);
      setForm((p) => ({ ...p, imageUrl: res.data.imageUrl }));
    } catch { alert('Upload ảnh thất bại'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const buildLinkUrl = () => {
    const { linkType, brandId, productId, promotionSlug } = form;
    if (linkType === 'none') return '';
    if (linkType === 'brand' && brandId) {
      const b = brands.find((x) => String(x.id) === String(brandId));
      return b ? `/brands/${b.slug}` : '';
    }
    if (linkType === 'promotion' && promotionSlug) return `/khuyen-mai/${promotionSlug}`;
    if (linkType === 'product') {
      // Ưu tiên: product slug (URL cần slug, không phải id)
      if (selectedProduct) return `/products/${selectedProduct.slug || selectedProduct.id}`;
      if (form.productId) return `/products/${form.productId}`;
      return '';
    }
    return '';
  };

  const handleSave = async () => {
    if (!form.title.trim()) { alert('Vui lòng nhập tiêu đề.'); return; }
    if (!form.imageUrl) { alert('Vui lòng upload ảnh banner.'); return; }

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        imageUrl: form.imageUrl,
        linkUrl: buildLinkUrl(),
        position: form.position,
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder) || 0,
        startAt: form.startAt || null,
        endAt: form.endAt || null,
      };
      if (editingBanner) {
        const res = await AdminService.updateBanner(editingBanner.id, payload);
        setBanners((p) => p.map((b) => b.id === editingBanner.id ? res.data : b));
      } else {
        const res = await AdminService.createBanner(payload);
        setBanners((p) => [res.data, ...p]);
      }
      setShowForm(false);
    } catch (e) { alert(e.response?.data?.message || 'Lưu thất bại'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await AdminService.deleteBanner(id);
      setBanners((p) => p.filter((b) => b.id !== id));
      setDeleteConfirm(null);
    } catch (e) { alert(e.response?.data?.message || 'Xóa thất bại'); }
  };

  const selectProduct = (p) => {
    setSelectedProduct(p);
    setSelectedVariant(null);
    setForm((prev) => ({ ...prev, productId: p.slug || p.id }));
    setProductSearch(p.name);
    setProductDropdown(false);
  };

  const selectVariant = (v) => {
    setSelectedVariant(v);
    // Luôn lưu product slug (không phải variant id) vì route /products/:slug cần slug
    setForm((prev) => ({ ...prev, productId: selectedProduct?.slug || selectedProduct?.id || form.productId }));
  };

  const selectPromotion = (p) => {
    setForm((prev) => ({ ...prev, promotionSlug: p.slug || p.id }));
    setPromotionSearch(p.name || p.title || p.slug || '');
    setPromotionDropdown(false);
  };

  const posLabel = (pos) => BANNER_POSITIONS.find((p) => p.value === pos)?.label || pos;

  const handleToggleActive = async (banner) => {
    try {
      const res = await AdminService.updateBanner(banner.id, { ...banner, isActive: !banner.isActive });
      setBanners((p) => p.map((b) => b.id === banner.id ? res.data : b));
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Quảng cáo</h1>
          <p className="text-sm text-gray-500 mt-1">{banners.length} banner</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Thêm banner
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#13151e] border border-white/5 rounded-2xl overflow-hidden">
        {loading && <div className="px-6 py-4 text-sm text-gray-400 border-b border-white/5">Đang tải...</div>}
        <table className="w-full">
          <thead>
            <tr className="text-[10px] text-gray-500 uppercase tracking-widest border-b border-white/5">
              <th className="text-left px-6 py-3 font-medium">Banner</th>
              <th className="text-left px-6 py-3 font-medium hidden lg:table-cell">Vị trí</th>
              <th className="text-center px-6 py-3 font-medium">Trạng thái</th>
              <th className="text-center px-6 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {banners.map((banner) => (
              <tr key={banner.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <img src={banner.imageUrl} alt={banner.title} className="w-16 h-10 rounded-lg object-cover bg-white/5 border border-white/10" onError={(e) => { e.target.src = 'https://picsum.photos/seed/banner/160/100'; }} />
                    <div>
                      <p className="text-sm font-medium text-white">{banner.title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{banner.linkUrl || 'Không có liên kết'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3 hidden lg:table-cell">
                  <span className="text-xs bg-white/5 text-gray-400 px-2 py-1 rounded-lg">{posLabel(banner.position)}</span>
                </td>
                <td className="px-6 py-3 text-center">
                  <button
                    onClick={() => handleToggleActive(banner)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                      banner.isActive !== false ? 'bg-red-600' : 'bg-white/10'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      banner.isActive !== false ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => openEdit(banner)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => setDeleteConfirm(banner.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && banners.length === 0 && (
          <div className="py-16 text-center text-gray-600 font-bold">Chưa có banner nào</div>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#13151e] border border-white/10 rounded-2xl w-full max-w-5xl my-8 mx-4">
            <div className="flex items-center justify-between px-8 py-5 border-b border-white/5">
              <h3 className="text-xl font-black text-white">{editingBanner ? 'Sửa banner' : 'Thêm banner mới'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="px-8 py-6">
              {/* Ảnh: 2 cột 2 dòng fill hết | Tiêu đề: cột 3-4 | Vị trí: cột 3 | Thứ tự: cột 4 */}
              <div className="grid grid-cols-4 gap-6 mb-6">
                {/* Ảnh banner: col-span-2, row-span-2, fill full */}
                <div className="col-span-2 row-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Ảnh banner *</label>
                  {form.imageUrl ? (
                    <div className="relative group w-full aspect-[3/1] rounded-xl overflow-hidden border border-white/10">
                      <img src={form.imageUrl} alt="banner" className="w-full h-full object-cover" />
                      <button onClick={() => setForm((p) => ({ ...p, imageUrl: '' }))} className="absolute top-2 right-2 w-7 h-7 bg-red-600 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold text-sm">×</button>
                    </div>
                  ) : (
                    <button onClick={() => imageInputRef.current?.click()} disabled={uploading} className="w-full aspect-[3/1] border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-red-500/40 transition-all">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                      <span className="text-sm mt-2">{uploading ? 'Đang tải...' : 'Chọn ảnh'}</span>
                      <span className="text-xs mt-1 text-gray-600">1200×400px</span>
                    </button>
                  )}
                  <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </div>

                {/* Tiêu đề: col-span-2 (cột 3-4) */}
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Tiêu đề *</label>
                  <input type="text" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="VD: Khuyến mãi mùa hè 2026"
                    className="w-full bg-[#1a1d2e] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-red-500/50" />
                </div>

                {/* Vị trí hiển thị: cột 3 dòng 2 */}
                <div className="col-span-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Vị trí hiển thị *</label>
                  <div className="relative">
                    <select value={form.position} onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))}
                      className="w-full bg-[#1a1d2e] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer pr-10">
                      {BANNER_POSITIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Thứ tự: cột 4 dòng 2 */}
                <div className="col-span-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Thứ tự</label>
                  <input type="number" min="0" value={form.sortOrder} onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))}
                    className="w-full bg-[#1a1d2e] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-red-500/50" />
                </div>
              </div>

              {/* Link selector + Schedule: 2 columns */}
              <div className="grid grid-cols-2 items-start gap-6">
                {/* Left: Link type + selector card */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Liên kết khi click</label>
                    <div className="relative">
                      <select value={form.linkType} onChange={(e) => setForm((p) => ({ ...p, linkType: e.target.value, brandId: '', productId: '', promotionSlug: '' }))}
                        className="w-full bg-[#1a1d2e] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer pr-10">
                        <option value="none">Không liên kết</option>
                        <option value="brand">Trang thương hiệu</option>
                        <option value="promotion">Trang khuyến mãi</option>
                        <option value="product">Trang sản phẩm</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {form.linkType === 'brand' && (
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Chọn thương hiệu *</label>
                      {loadingBrands ? (
                        <div className="py-3 text-sm text-gray-400">Đang tải thương hiệu...</div>
                      ) : (
                        <div className="relative">
                          <select value={form.brandId} onChange={(e) => setForm((p) => ({ ...p, brandId: e.target.value }))}
                            className="w-full bg-[#1a1d2e] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer pr-10">
                            <option value="">-- Chọn thương hiệu --</option>
                            {brands.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.slug})</option>)}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {form.linkType === 'product' && (
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Sản phẩm *</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={productSearch}
                          onChange={(e) => { setProductSearch(e.target.value); setProductDropdown(true); setSelectedProduct(null); setSelectedVariant(null); }}
                          onFocus={() => setProductDropdown(true)}
                          placeholder="Tìm tên sản phẩm..."
                          className="w-full bg-[#1a1d2e] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-red-500/50"
                        />
                        {productDropdown && (
                          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-[#1a1d2e] border border-white/10 rounded-xl max-h-72 overflow-y-auto shadow-xl">
                            {loadingProducts ? (
                              <div className="px-4 py-3 text-sm text-gray-400">Đang tải...</div>
                            ) : productList.length === 0 ? (
                              <div className="px-4 py-3 text-sm text-gray-500">Không tìm thấy sản phẩm</div>
                            ) : (
                              productList.map((p) => (
                                <button
                                  key={p.id}
                                  onClick={() => selectProduct(p)}
                                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left transition-colors border-b border-white/5 last:border-b-0"
                                >
                                  {p.thumbnailUrl && <img src={p.thumbnailUrl} alt="" className="w-10 h-10 rounded-lg object-cover bg-white/5 flex-shrink-0" />}
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-200 truncate">{p.name}</p>
                                    <p className="text-[11px] text-gray-500">{p.brand} · {p.variantItems?.length || 0} phân loại</p>
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                      {selectedProduct && (
                        <div className="mt-3">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Phân loại (màu / RAM / Bộ nhớ) *</label>
                          <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1">
                            {(selectedProduct.variantItems || []).map((v) => (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() => selectVariant(v)}
                                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                                  selectedVariant?.id === v.id
                                    ? 'border-red-500 bg-red-500/10'
                                    : 'border-white/10 bg-white/5 hover:border-white/20'
                                }`}
                              >
                                {v.colorImageUrl ? (
                                  <img src={v.colorImageUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs text-gray-400">{v.color?.charAt(0) || '?'}</span>
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-gray-200">
                                    {v.color} {v.storageLabel || `${v.storageGb}GB`} {v.ramGb ? `· ${v.ramGb}GB RAM` : ''}
                                  </p>
                                  <p className="text-[11px] text-gray-400">
                                    SKU: {v.sku} · Giá: {Number(v.price).toLocaleString()}đ · Tồn: {v.stock}
                                  </p>
                                </div>
                                {selectedVariant?.id === v.id && (
                                  <span className="text-red-400 font-bold text-sm flex-shrink-0">✓</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedVariant && (
                        <p className="text-[11px] text-green-400 mt-2">✓ Đã chọn: {selectedVariant.color} {selectedVariant.storageLabel || `${selectedVariant.storageGb}GB`}</p>
                      )}
                    </div>
                  )}

                  {form.linkType === 'promotion' && (
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Chọn trang khuyến mãi *</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={promotionSearch}
                          onChange={(e) => { setPromotionSearch(e.target.value); setPromotionDropdown(true); }}
                          onFocus={() => setPromotionDropdown(true)}
                          placeholder="Gõ tên khuyến mãi để tìm..."
                          className="w-full bg-[#1a1d2e] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-red-500/50"
                        />
                        {promotionDropdown && (
                          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-[#1a1d2e] border border-white/10 rounded-xl max-h-72 overflow-y-auto shadow-xl">
                            {loadingPromotions ? (
                              <div className="px-4 py-3 text-sm text-gray-400">Đang tải...</div>
                            ) : promotionList.length === 0 ? (
                              <div className="px-4 py-3 text-sm text-gray-500">Không tìm thấy khuyến mãi nào</div>
                            ) : (
                              promotionList.map((p) => (
                                <button
                                  key={p.id}
                                  onClick={() => selectPromotion(p)}
                                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 text-left transition-colors border-b border-white/5 last:border-b-0"
                                >
                                  <div>
                                    <p className="text-sm font-medium text-gray-200">{p.name || p.title}</p>
                                    <p className="text-[11px] text-gray-500">{p.discount ? `${p.discount}%` : p.slug || ''}</p>
                                  </div>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    p.isActive ? 'bg-green-500/10 text-green-400' : 'bg-white/10 text-gray-400'
                                  }`}>
                                    {p.isActive ? 'Đang chạy' : 'Không hoạt động'}
                                  </span>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                      {form.promotionSlug && (
                        <p className="text-[11px] text-gray-500 mt-2">URL: /khuyen-mai/{form.promotionSlug}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Bắt đầu / Kết thúc stacked */}
                <div className="grid grid-rows-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Bắt đầu</label>
                    <input type="datetime-local" value={form.startAt} onChange={(e) => setForm((p) => ({ ...p, startAt: e.target.value }))}
                      className="w-full bg-[#1a1d2e] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-red-500/50" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Kết thúc</label>
                    <input type="datetime-local" value={form.endAt} onChange={(e) => setForm((p) => ({ ...p, endAt: e.target.value }))}
                      className="w-full bg-[#1a1d2e] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-red-500/50" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-8 py-5 border-t border-white/5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white transition-all">Hủy</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50">
                {saving ? 'Đang lưu...' : (editingBanner ? 'Lưu thay đổi' : 'Thêm banner')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#13151e] border border-white/10 rounded-2xl w-full max-w-sm p-6 text-center">
            <h3 className="text-lg font-black text-white mb-2">Xóa banner?</h3>
            <p className="text-sm text-gray-400 mb-6">Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white transition-all">Hủy</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-bold text-white transition-all">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBanners;
