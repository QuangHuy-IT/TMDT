import React, { useEffect, useState, useRef } from 'react';
import AdminService from '../../services/adminService';
import SeriesService from '../../services/seriesService';

const AdminSeries = () => {
  const [allSeries, setAllSeries] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSeries, setEditingSeries] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', brandId: '', description: '', isActive: true, sortOrder: 0 });
  const logoInputRef = React.useRef(null);

  // Drag state
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const dragNode = useRef(null);

  // Filter state
  const [filterBrand, setFilterBrand] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [seriesRes, brandsRes] = await Promise.all([
        SeriesService.getAllSeries(),
        AdminService.getBrands(),
      ]);
      setAllSeries(seriesRes.data || []);
      setBrands(Array.isArray(brandsRes.data?.data) ? brandsRes.data.data : brandsRes.data || []);
    } catch (e) {
      console.error('[AdminSeries] Fetch error:', e);
      setFetchError(e.response?.data?.message || e.message || 'Không thể tải danh sách dòng sản phẩm.');
      setAllSeries([]);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingSeries(null);
    setForm({ name: '', brandId: filterBrand || '', description: '', isActive: true, sortOrder: 0 });
    setShowForm(true);
  };

  const openEdit = (series) => {
    setEditingSeries(series);
    setForm({
      name: series.name || '',
      brandId: series.brandId || '',
      description: series.description || '',
      isActive: series.isActive !== false,
      sortOrder: series.sortOrder || 0,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { alert('Vui lòng nhập tên dòng sản phẩm.'); return; }
    if (!form.brandId) { alert('Vui lòng chọn thương hiệu.'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        brandId: Number(form.brandId),
        description: form.description?.trim() || '',
        isActive: form.isActive,
        sortOrder: form.sortOrder || 0,
      };
      if (editingSeries) {
        const res = await SeriesService.updateSeries(editingSeries.id, payload);
        setAllSeries((p) => p.map((s) => s.id === editingSeries.id ? { ...s, ...res.data } : s));
      } else {
        const res = await SeriesService.createSeries(payload);
        setAllSeries((p) => [res.data, ...p]);
      }
      setShowForm(false);
    } catch (e) {
      alert(e.response?.data?.message || e.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await SeriesService.deleteSeries(id);
      setAllSeries((p) => p.filter((s) => s.id !== id));
      setDeleteConfirm(null);
    } catch (e) {
      alert(e.response?.data?.message || e.message || 'Xóa thất bại');
    }
  };

  const handleToggleActive = async (series) => {
    try {
      const res = await SeriesService.updateSeries(series.id, {
        ...series,
        brandId: series.brandId,
        name: series.name,
        description: series.description,
        isActive: !series.isActive,
        sortOrder: series.sortOrder,
      });
      setAllSeries((p) => p.map((s) => s.id === series.id ? { ...s, isActive: res.data.isActive } : s));
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

    const updated = [...allSeries];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(dropIndex, 0, moved);
    setAllSeries(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);

    try {
      const brandIds = updated.map((s) => s.id);
      const res = await SeriesService.updateSeries(brandIds[dropIndex], {
        ...updated[dropIndex],
        sortOrder: dropIndex,
      });
      setAllSeries(updated.map((s, i) => i === dropIndex ? { ...s, sortOrder: i } : s));
    } catch {
      fetchData();
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Group series by brand
  const grouped = React.useMemo(() => {
    const groupedMap = {};
    const filtered = filterBrand
      ? allSeries.filter(s => String(s.brandId) === String(filterBrand))
      : allSeries;

    filtered.forEach(s => {
      const key = s.brandId || 'none';
      if (!groupedMap[key]) {
        groupedMap[key] = {
          brandName: s.brandName || 'Không xác định',
          series: [],
        };
      }
      groupedMap[key].series.push(s);
    });
    return groupedMap;
  }, [allSeries, filterBrand]);

  const totalSeries = filterBrand
    ? allSeries.filter(s => String(s.brandId) === String(filterBrand)).length
    : allSeries.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Dòng sản phẩm</h1>
          <p className="text-sm text-gray-500 mt-1">{totalSeries} dòng sản phẩm · Kéo thả để sắp xếp</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Thêm dòng sản phẩm
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <select
            value={filterBrand}
            onChange={(e) => setFilterBrand(e.target.value)}
            className="bg-[#13151e] border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-red-500/50"
            style={{ color: '#e5e7eb' }}
          >
            <option value="">Tất cả thương hiệu</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        {filterBrand && (
          <button
            onClick={() => setFilterBrand('')}
            className="text-xs text-gray-500 hover:text-red-400 transition-colors"
          >
            ✕ Xóa lọc
          </button>
        )}
      </div>

      {/* Hint */}
      {totalSeries > 1 && (
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-white/5 border border-white/5 rounded-xl px-4 py-2.5">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Kéo thả để thay đổi thứ tự hiển thị. Dòng ở trên sẽ hiển thị trước trong danh sách.
        </div>
      )}

      {/* Series list */}
      <div className="bg-[#13151e] border border-white/5 rounded-2xl overflow-hidden">
        {loading && <div className="px-6 py-4 text-sm text-gray-400 border-b border-white/5">Đang tải...</div>}
        {fetchError && (
          <div className="px-6 py-4 border-b border-red-500/20 bg-red-500/5">
            <p className="text-sm text-red-400 font-medium">Lỗi: {fetchError}</p>
            <button onClick={fetchData} className="mt-2 text-xs text-red-400 underline hover:text-red-300">Thử lại</button>
          </div>
        )}

        {!loading && totalSeries === 0 && !fetchError && (
          <div className="py-16 text-center text-gray-600 font-bold">
            {filterBrand ? 'Không có dòng sản phẩm nào cho thương hiệu này' : 'Chưa có dòng sản phẩm nào'}
          </div>
        )}

        {!loading && totalSeries > 0 && (
          <div>
            {Object.entries(grouped).map(([brandId, group]) => (
              <div key={brandId}>
                {/* Brand header */}
                <div className="px-6 py-3 bg-[#1a1c27] border-b border-white/5">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{group.brandName}</span>
                  <span className="ml-2 text-[10px] text-gray-600">({group.series.length} dòng)</span>
                </div>

                <div className="divide-y divide-white/[0.03]">
                  {group.series.map((series, index) => (
                    <div
                      key={series.id}
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

                      {/* Icon */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 font-bold text-sm">
                        {series.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>

                      {/* Name + description */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{series.name}</p>
                        {series.description && (
                          <p className="text-[11px] text-gray-600 mt-0.5 truncate">{series.description}</p>
                        )}
                      </div>

                      {/* Slug */}
                      <div className="hidden md:block flex-shrink-0">
                        <span className="text-[10px] font-mono text-gray-600 bg-white/5 px-2 py-1 rounded">
                          {series.slug || '—'}
                        </span>
                      </div>

                      {/* Toggle */}
                      <button
                        onClick={() => handleToggleActive(series)}
                        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                          series.isActive !== false ? 'bg-red-600' : 'bg-gray-600'
                        }`}
                        title={series.isActive !== false ? 'Tắt dòng sản phẩm' : 'Bật dòng sản phẩm'}
                      >
                        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          series.isActive !== false ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => openEdit(series)} className="p-2 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all" title="Sửa">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => setDeleteConfirm(series.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Xóa">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
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
              <h3 className="text-lg font-black text-white">{editingSeries ? 'Sửa dòng sản phẩm' : 'Thêm dòng sản phẩm mới'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Thương hiệu *</label>
                <select
                  value={form.brandId}
                  onChange={(e) => setForm((p) => ({ ...p, brandId: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-red-500/50"
                  style={{ color: '#e5e7eb' }}
                >
                  <option value="">-- Chọn thương hiệu --</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Tên dòng sản phẩm *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="VD: Galaxy S, iPhone, Redmi..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-red-500/50"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Mô tả</label>
                <textarea
                  value={form.description || ''}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Mô tả ngắn về dòng sản phẩm (không bắt buộc)"
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-red-500/50 resize-none"
                />
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
                {saving ? 'Đang lưu...' : (editingSeries ? 'Lưu thay đổi' : 'Thêm dòng sản phẩm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#13151e] border border-white/10 rounded-2xl w-full max-w-sm p-6 text-center">
            <h3 className="text-lg font-black text-white mb-2">Xóa dòng sản phẩm?</h3>
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

export default AdminSeries;
