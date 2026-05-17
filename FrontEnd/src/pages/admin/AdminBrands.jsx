import React, { useEffect, useState, useRef } from 'react';
import AdminService from '../../services/adminService';
import ProductService from '../../services/productService';

const AdminBrands = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ name: '', logoUrl: '', isActive: true, sortOrder: 0 });
  const logoInputRef = React.useRef(null);

  // Drag state
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const dragNode = useRef(null);

  useEffect(() => { fetchBrands(); }, []);

  const fetchBrands = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await AdminService.getBrands();
      const data = res.data?.data ?? res.data ?? [];
      setBrands(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[AdminBrands] Fetch error:', e);
      const msg = e.response?.data?.message || e.message || 'Không thể tải danh sách thương hiệu. Đảm bảo backend đang chạy tại http://localhost:8080';
      setFetchError(msg);
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingBrand(null);
    setForm({ name: '', logoUrl: '', isActive: true, sortOrder: 0 });
    setShowForm(true);
  };

  const openEdit = (brand) => {
    setEditingBrand(brand);
    setForm({ name: brand.name || '', logoUrl: brand.logoUrl || '', isActive: brand.isActive !== false, sortOrder: brand.sortOrder || 0 });
    setShowForm(true);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await ProductService.uploadImage(file);
      setForm((p) => ({ ...p, logoUrl: res.data.imageUrl }));
    } catch {
      alert('Upload logo thất bại');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { alert('Vui lòng nhập tên thương hiệu.'); return; }
    setSaving(true);
    try {
      const payload = { ...form, sortOrder: form.sortOrder || 0 };
      if (editingBrand) {
        const res = await AdminService.updateBrand(editingBrand.id, payload);
        setBrands((p) => p.map((b) => b.id === editingBrand.id ? res.data : b));
      } else {
        const res = await AdminService.createBrand(payload);
        setBrands((p) => [res.data, ...p]);
      }
      setShowForm(false);
    } catch (e) {
      alert(e.response?.data?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await AdminService.deleteBrand(id);
      setBrands((p) => p.filter((b) => b.id !== id));
      setDeleteConfirm(null);
    } catch (e) {
      alert(e.response?.data?.message || 'Xóa thất bại');
    }
  };

  const handleToggleActive = async (brand) => {
    try {
      const res = await AdminService.updateBrand(brand.id, { ...brand, isActive: !brand.isActive });
      setBrands((p) => p.map((b) => b.id === brand.id ? res.data : b));
    } catch {
      alert('Cập nhật thất bại');
    }
  };

  // ── Drag & Drop Handlers ─────────────────────────────────────────────────
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    dragNode.current = e.target;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget);
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = draggedIndex;
    if (dragIndex === null || dragIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...brands];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(dropIndex, 0, moved);
    setBrands(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);

    // Save new order to backend
    try {
      const brandIds = updated.map((b) => b.id);
      const res = await AdminService.reorderBrands(brandIds);
      setBrands(res.data || updated);
    } catch (e) {
      alert('Lưu thứ tự thất bại. Vui lòng thử lại.');
      fetchBrands();
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Thương hiệu</h1>
          <p className="text-sm text-gray-500 mt-1">{brands.length} thương hiệu · Kéo thả để sắp xếp thứ tự hiển thị</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Thêm thương hiệu
        </button>
      </div>

      {/* Hint */}
      {brands.length > 1 && (
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-white/5 border border-white/5 rounded-xl px-4 py-2.5">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Kéo thả để thay đổi thứ tự hiển thị trên trang chủ. Thương hiệu ở trên sẽ hiển thị trước.
        </div>
      )}

      {/* Brand list */}
      <div className="bg-[#13151e] border border-white/5 rounded-2xl overflow-hidden">
        {loading && <div className="px-6 py-4 text-sm text-gray-400 border-b border-white/5">Đang tải...</div>}
        {fetchError && (
          <div className="px-6 py-4 border-b border-red-500/20 bg-red-500/5">
            <p className="text-sm text-red-400 font-medium">Lỗi: {fetchError}</p>
            <button onClick={fetchBrands} className="mt-2 text-xs text-red-400 underline hover:text-red-300">Thử lại</button>
          </div>
        )}

        {!loading && brands.length === 0 && !fetchError && (
          <div className="py-16 text-center text-gray-600 font-bold">Chưa có thương hiệu nào</div>
        )}

        {!loading && brands.length > 0 && (
          <div className="divide-y divide-white/[0.03]">
            {brands.map((brand, index) => (
              <div
                key={brand.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-4 px-6 py-4 group transition-all cursor-grab active:cursor-grabbing ${
                  dragOverIndex === index && draggedIndex !== index ? 'bg-red-500/5 border-t border-b border-red-500/20' : ''
                } ${draggedIndex === index ? 'opacity-40' : ''} hover:bg-white/[0.02]`}
              >
                {/* Drag handle */}
                <div className="flex-shrink-0 text-gray-600 hover:text-gray-400 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8h16M4 16h16" />
                  </svg>
                </div>

                {/* Logo */}
                <div className="flex-shrink-0">
                  {brand.logoUrl ? (
                    <img src={brand.logoUrl} alt={brand.name} className="w-12 h-12 rounded-xl object-contain bg-white/5 border border-white/10 p-1" onError={(e) => { e.target.src = 'https://picsum.photos/seed/brand/48/48'; }} />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 font-bold text-lg">{brand.name.charAt(0)}</div>
                  )}
                </div>

                {/* Name + order */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{brand.name}</p>
                  <p className="text-[11px] text-gray-600 mt-0.5">#{index + 1} · {brand.isActive !== false ? 'Hoạt động' : 'Tắt'}</p>
                </div>

                {/* Toggle */}
                <button
                  onClick={() => handleToggleActive(brand)}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                    brand.isActive !== false ? 'bg-red-600' : 'bg-gray-600'
                  }`}
                  title={brand.isActive !== false ? 'Tắt thương hiệu' : 'Bật thương hiệu'}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    brand.isActive !== false ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(brand)} className="p-2 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all" title="Sửa">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onClick={() => setDeleteConfirm(brand.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Xóa">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#13151e] border border-white/10 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h3 className="text-lg font-black text-white">{editingBrand ? 'Sửa thương hiệu' : 'Thêm thương hiệu mới'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Tên thương hiệu *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="VD: Apple, Samsung, Xiaomi..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-red-500/50"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Logo</label>
                <div className="flex items-center gap-3">
                  {form.logoUrl ? (
                    <div className="relative group w-16 h-16">
                      <img src={form.logoUrl} alt="logo" className="w-full h-full object-contain bg-white/5 rounded-xl border border-white/10 p-0.5" />
                      <button onClick={() => setForm((p) => ({ ...p, logoUrl: '' }))} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold">×</button>
                    </div>
                  ) : (
                    <button onClick={() => logoInputRef.current?.click()} disabled={uploading} className="w-16 h-16 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-red-500/40 transition-all">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                      <span className="text-[9px] mt-0.5">{uploading ? '...' : 'Logo'}</span>
                    </button>
                  )}
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  <p className="text-[10px] text-gray-600">Click để upload logo</p>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Trạng thái</label>
                <div className="flex gap-3">
                  {[{ v: true, l: 'Hoạt động' }, { v: false, l: 'Tắt' }].map((s) => (
                    <label key={String(s.v)} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={form.isActive === s.v}
                        onChange={() => setForm((p) => ({ ...p, isActive: s.v }))}
                        className="accent-red-600"
                      />
                      <span className="text-sm text-gray-300">{s.l}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-white/5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white transition-all">Hủy</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50">
                {saving ? 'Đang lưu...' : (editingBrand ? 'Lưu thay đổi' : 'Thêm thương hiệu')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#13151e] border border-white/10 rounded-2xl w-full max-w-sm p-6 text-center">
            <h3 className="text-lg font-black text-white mb-2">Xóa thương hiệu?</h3>
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

export default AdminBrands;
