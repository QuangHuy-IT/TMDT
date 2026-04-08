import React, { useEffect, useMemo, useRef, useState } from 'react';
import ProductService from '../../services/productService';

const ITEMS_PER_PAGE = 8;

const SPEC_KEYS = ['screen', 'cpu', 'ram', 'storage', 'battery', 'camera', 'os', 'connectivity'];
const SPEC_LABELS = { screen: 'Màn hình', cpu: 'Vi xử lý', ram: 'RAM', storage: 'Bộ nhớ', battery: 'Pin', camera: 'Camera', os: 'Hệ điều hành', connectivity: 'Kết nối' };

const emptyForm = {
  name: '', brand: '', price: '', stock: '', description: '',
  images: [],   // Mảng base64 hoặc URL
  specifications: { screen: '', cpu: '', ram: '', storage: '', battery: '', camera: '', os: '', connectivity: '' },
};

export const AdminProducts = () => {
  const [productList, setProductList] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' | 'specs'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await ProductService.getAdminProducts();
      setProductList(response.data || []);
    } catch (error) {
      console.error('Cannot load products', error);
      alert('Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() =>
    productList.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase())
    ), [productList, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const displayed = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const openAdd = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setActiveTab('basic');
    setShowModal(true);
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      brand: product.brand,
      price: product.price,
      stock: product.stock ?? '',
      description: product.description || '',
      images: product.images || (product.image ? [product.image] : []),
      specifications: product.specifications || emptyForm.specifications,
    });
    setActiveTab('basic');
    setShowModal(true);
  };

  // Xử lý upload ảnh — đọc file thành base64
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const response = await ProductService.uploadImage(file);
        uploadedUrls.push(response.data.imageUrl);
      }

      setForm(f => ({
        ...f,
        images: [...f.images, ...uploadedUrls],
      }));
    } catch (error) {
      console.error('Upload image failed', error);
      const serverMessage = error.response?.data?.message || error.response?.data?.error;
      alert(serverMessage || 'Upload ảnh thất bại');
    } finally {
      setUploading(false);
    }

    // Reset input để có thể chọn lại cùng file
    e.target.value = '';
  };

  const removeImage = (index) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.brand.trim() || !form.price) return;
    const payload = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock) || 0,
    };

    setSaving(true);
    try {
      if (editingProduct) {
        const id = editingProduct._id || editingProduct.id;
        const response = await ProductService.updateProduct(id, payload);
        setProductList(prev => prev.map(p =>
          (p._id === id || p.id === id) ? response.data : p
        ));
      } else {
        const response = await ProductService.createProduct(payload);
        setProductList(prev => [response.data, ...prev]);
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
    try {
      await ProductService.deleteProduct(id);
      setProductList(prev => prev.filter(p => p._id !== id && p.id !== id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Delete product failed', error);
      alert(error.response?.data?.message || 'Xóa sản phẩm thất bại');
    }
  };

  const getThumbnail = (p) => (p.images && p.images[0]) || p.image || '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Sản phẩm</h1>
          <p className="text-sm text-gray-500 mt-1">{productList.length} sản phẩm trong kho</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Thêm sản phẩm
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input type="text" placeholder="Tìm theo tên, thương hiệu..." value={search}
          onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          className="w-full bg-[#13151e] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-all" />
      </div>

      {/* Table */}
      <div className="bg-[#13151e] border border-white/5 rounded-2xl overflow-hidden">
        {loading && (
          <div className="px-6 py-4 text-sm text-gray-400 border-b border-white/5">Đang tải dữ liệu...</div>
        )}
        <table className="w-full">
          <thead>
            <tr className="text-[10px] text-gray-500 uppercase tracking-widest border-b border-white/5">
              <th className="text-left px-6 py-3 font-medium">Sản phẩm</th>
              <th className="text-left px-6 py-3 font-medium hidden md:table-cell">Thương hiệu</th>
              <th className="text-center px-6 py-3 font-medium hidden lg:table-cell">Tồn kho</th>
              <th className="text-right px-6 py-3 font-medium">Giá</th>
              <th className="text-center px-6 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map(product => {
              const pid = product._id || product.id;
              return (
                <tr key={pid} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <img src={getThumbnail(product)} alt="" className="w-10 h-10 object-contain bg-white/5 rounded-xl p-1 flex-shrink-0"
                        onError={(e) => { e.target.src = 'https://picsum.photos/seed/fallback/80/80'; }} />
                      <div>
                        <p className="text-sm font-medium text-white">{product.name}</p>
                        <p className="text-[11px] text-gray-500 line-clamp-1">{product.description || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 hidden md:table-cell">
                    <span className="text-xs bg-white/5 text-gray-400 px-2 py-1 rounded-lg">{product.brand}</span>
                  </td>
                  <td className="px-6 py-3 text-center hidden lg:table-cell">
                    <span className={`text-xs font-bold ${(product.stock ?? 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {product.stock ?? '—'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span className="text-sm font-bold text-red-400">{product.price.toLocaleString()}₫</span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(product)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => setDeleteConfirm(pid)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">Hiển thị {displayed.length} / {filtered.length} sản phẩm</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition-all text-sm">←</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setCurrentPage(p)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${currentPage === p ? 'bg-red-600 text-white' : 'border border-white/10 text-gray-400 hover:text-white'}`}>{p}</button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition-all text-sm">→</button>
          </div>
        </div>
      )}

      {/* ===== MODAL THÊM/SỬA ===== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#13151e] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h3 className="text-lg font-black text-white">
                {editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/5">
              {[['basic', 'Thông tin cơ bản'], ['specs', 'Thông số kỹ thuật']].map(([tab, label]) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-sm font-bold transition-all ${activeTab === tab ? 'text-red-400 border-b-2 border-red-500' : 'text-gray-500 hover:text-gray-300'}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Modal Body — scrollable */}
            <div className="overflow-y-auto flex-1 px-6 py-5">
              {activeTab === 'basic' ? (
                <div className="space-y-4">
                  {/* Tên + Thương hiệu */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'name', label: 'Tên sản phẩm', placeholder: 'iPhone 15 Pro Max' },
                      { key: 'brand', label: 'Thương hiệu', placeholder: 'Apple' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">{f.label}</label>
                        <input type="text" value={form[f.key]} placeholder={f.placeholder}
                          onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-all" />
                      </div>
                    ))}
                  </div>

                  {/* Giá + Tồn kho */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'price', label: 'Giá (VNĐ)', placeholder: '29990000' },
                      { key: 'stock', label: 'Tồn kho', placeholder: '100' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">{f.label}</label>
                        <input type="number" value={form[f.key]} placeholder={f.placeholder}
                          onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-all" />
                      </div>
                    ))}
                  </div>

                  {/* Mô tả */}
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Mô tả</label>
                    <textarea value={form.description} rows={3} placeholder="Mô tả sản phẩm..."
                      onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-all resize-none" />
                  </div>

                  {/* Upload ảnh */}
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                      Hình ảnh sản phẩm
                    </label>

                    {/* Khu vực upload */}
                      <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                      className="w-full border-2 border-dashed border-white/10 rounded-xl py-6 flex flex-col items-center gap-2 text-gray-500 hover:border-red-500/40 hover:text-gray-300 transition-all">
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

                    {/* Preview ảnh đã chọn */}
                    {form.images.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-3">
                        {form.images.map((img, i) => (
                          <div key={i} className="relative group">
                            <img src={img} alt="" className="w-20 h-20 object-contain bg-white/5 rounded-xl border border-white/10 p-1"
                              onError={(e) => { e.target.src = 'https://picsum.photos/seed/fallback/80/80'; }} />
                            <button onClick={() => removeImage(i)}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              ×
                            </button>
                            {i === 0 && (
                              <span className="absolute bottom-1 left-1 text-[8px] bg-red-600 text-white px-1 rounded font-bold">CHÍNH</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Tab Thông số kỹ thuật */
                <div className="space-y-4">
                  {SPEC_KEYS.map(key => (
                    <div key={key}>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">{SPEC_LABELS[key]}</label>
                      <input type="text"
                        value={form.specifications[key] || ''}
                        placeholder={key === 'screen' ? '6.7-inch OLED, 120Hz' : key === 'cpu' ? 'Apple A17 Pro' : ''}
                        onChange={e => setForm(prev => ({ ...prev, specifications: { ...prev.specifications, [key]: e.target.value } }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-all" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-white/5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white hover:border-white/20 transition-all">
                Hủy
              </button>
              <button onClick={handleSave} disabled={saving || uploading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-bold text-white transition-all active:scale-95">
                {saving ? 'Đang lưu...' : (editingProduct ? 'Lưu thay đổi' : 'Thêm sản phẩm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Xóa */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#13151e] border border-white/10 rounded-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-lg font-black text-white mb-2">Xóa sản phẩm?</h3>
            <p className="text-sm text-gray-400 mb-6">Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white transition-all">Hủy</button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-bold text-white transition-all">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};