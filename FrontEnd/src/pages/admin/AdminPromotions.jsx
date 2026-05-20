import React, { useState, useEffect, useCallback } from 'react';
import AdminService from '../../services/adminService';

const AdminPromotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Promotion selector state (flash-sale style)
  const [promotionSearch, setPromotionSearch] = useState('');
  const [promotionDropdown, setPromotionDropdown] = useState(false);
  const [loadingPromotions, setLoadingPromotions] = useState(false);
  const [promotionList, setPromotionList] = useState([]);

  // Load promotions from API
  useEffect(() => {
    AdminService.getPromotions()
      .then((res) => {
        const data = res.data?.data ?? res.data ?? [];
        if (Array.isArray(data) && data.length > 0) {
          setPromotions(data.map((p) => ({
            id: p.id,
            name: p.name || p.title || 'Khuyến mãi',
            slug: p.slug || '',
            discount: p.discount ? `${p.discount}%` : '-',
            status: p.isActive ? 'active' : 'ended',
            startDate: p.startDate || p.startAt || '',
            endDate: p.endDate || p.endAt || '',
          })));
        }
      })
      .catch(() => {});
  }, []);

  // Debounced promotion search via API
  useEffect(() => {
    if (!showForm) return;
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
  }, [promotionSearch, showForm]);

  const statusConfig = {
    active: { label: 'Đang chạy', color: 'bg-green-500/10 text-green-400' },
    scheduled: { label: 'Đã lên lịch', color: 'bg-blue-500/10 text-blue-400' },
    draft: { label: 'Nháp', color: 'bg-gray-500/10 text-gray-400' },
    ended: { label: 'Đã kết thúc', color: 'bg-red-500/10 text-red-400' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Khuyến mãi</h1>
          <p className="text-sm text-gray-500 mt-1">{promotions.length} khuyến mãi</p>
        </div>
        <button onClick={() => { setEditingPromotion({}); setShowForm(true); setPromotionSearch(''); setPromotionDropdown(false); setPromotionList([]); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Thêm khuyến mãi
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Đang chạy', count: promotions.filter((p) => p.status === 'active').length, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
          { label: 'Đã lên lịch', count: promotions.filter((p) => p.status === 'scheduled').length, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'Nháp', count: promotions.filter((p) => p.status === 'draft').length, color: 'text-gray-400', bg: 'bg-white/5 border-white/10' },
          { label: 'Đã kết thúc', count: promotions.filter((p) => p.status === 'ended').length, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
        ].map((stat) => (
          <div key={stat.label} className={`bg-[#13151e] border rounded-2xl p-5 ${stat.bg}`}>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.count}</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Promotions table */}
      <div className="bg-[#13151e] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-[10px] text-gray-500 uppercase tracking-widest border-b border-white/5">
              <th className="text-left px-6 py-3 font-medium">Khuyến mãi</th>
              <th className="text-center px-6 py-3 font-medium">Giảm giá</th>
              <th className="text-center px-6 py-3 font-medium">Trạng thái</th>
              <th className="text-center px-6 py-3 font-medium hidden md:table-cell">Thời gian</th>
              <th className="text-center px-6 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {promotions.map((promo) => {
              const cfg = statusConfig[promo.status] || statusConfig.draft;
              return (
                <tr key={promo.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-3">
                    <p className="text-sm font-medium text-white">{promo.name}</p>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className="text-sm font-black text-red-400">{promo.discount}</span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${cfg.color}`}>{cfg.label}</span>
                  </td>
                  <td className="px-6 py-3 text-center hidden md:table-cell">
                    <p className="text-xs text-gray-500">
                      {promo.startDate ? `${promo.startDate} → ${promo.endDate}` : '—'}
                    </p>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => { setEditingPromotion(promo); setShowForm(true); setPromotionSearch(promo.name || ''); setPromotionDropdown(false); setPromotionList([]); }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => setDeleteConfirm(promo.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {promotions.length === 0 && (
          <div className="py-16 text-center text-gray-600 font-bold">Chưa có khuyến mãi nào</div>
        )}
      </div>

      {/* Add/Edit Promotion Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#13151e] border border-white/10 rounded-2xl w-full max-w-lg my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h3 className="text-lg font-black text-white">{editingPromotion?.id ? 'Sửa khuyến mãi' : 'Thêm khuyến mãi mới'}</h3>
              <button onClick={() => { setShowForm(false); setEditingPromotion(null); setPromotionSearch(''); setPromotionDropdown(false); setPromotionList([]); }} className="text-gray-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

              {/* Promotion name */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Tên khuyến mãi *</label>
                <input type="text" value={editingPromotion?.name || ''}
                  onChange={(e) => setEditingPromotion(prev => prev ? { ...prev, name: e.target.value } : { name: e.target.value })}
                  placeholder="VD: Summer Sale 2026"
                  className="w-full bg-[#1a1d2e] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-red-500/50" />
              </div>

              {/* Discount */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Giảm giá (%)</label>
                <input type="number" min="0" max="100" value={editingPromotion?.discount?.replace('%', '') || ''}
                  onChange={(e) => setEditingPromotion(prev => prev ? { ...prev, discount: `${e.target.value}%` } : { discount: `${e.target.value}%` })}
                  placeholder="VD: 20"
                  className="w-full bg-[#1a1d2e] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-red-500/50" />
              </div>

              {/* Search & Select Promotion (flash-sale style) */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Chọn khuyến mãi đã có</label>
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
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-[#1a1d2e] border border-white/10 rounded-xl max-h-60 overflow-y-auto shadow-xl">
                      {loadingPromotions ? (
                        <div className="px-4 py-3 text-sm text-gray-400">Đang tìm...</div>
                      ) : promotionList.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500">Không tìm thấy khuyến mãi nào</div>
                      ) : (
                        promotionList.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              setEditingPromotion(prev => prev ? { ...prev, ...p, name: p.name || p.title } : { name: p.name || p.title, ...p });
                              setPromotionSearch(p.name || p.title || '');
                              setPromotionDropdown(false);
                            }}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 text-left transition-colors border-b border-white/5 last:border-b-0"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-200">{p.name || p.title}</p>
                              <p className="text-[11px] text-gray-500">{p.discount ? `${p.discount}%` : p.slug || ''}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              p.isActive ? 'bg-green-500/10 text-green-400' :
                              'bg-white/10 text-gray-400'
                            }`}>
                              {p.isActive ? 'Đang chạy' : 'Không hoạt động'}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {editingPromotion?.id && (
                  <p className="text-[10px] text-green-400 mt-1">✓ Đã chọn khuyến mãi: {editingPromotion.name}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Trạng thái</label>
                <div className="relative">
                  <select value={editingPromotion?.status || 'draft'}
                    onChange={(e) => setEditingPromotion(prev => prev ? { ...prev, status: e.target.value } : { status: e.target.value })}
                    className="w-full bg-[#1a1d2e] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer pr-10">
                    <option value="active">Đang chạy</option>
                    <option value="scheduled">Đã lên lịch</option>
                    <option value="draft">Nháp</option>
                    <option value="ended">Đã kết thúc</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Bắt đầu</label>
                  <input type="date" value={editingPromotion?.startDate || ''}
                    onChange={(e) => setEditingPromotion(prev => prev ? { ...prev, startDate: e.target.value } : { startDate: e.target.value })}
                    className="w-full bg-[#1a1d2e] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-red-500/50" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Kết thúc</label>
                  <input type="date" value={editingPromotion?.endDate || ''}
                    onChange={(e) => setEditingPromotion(prev => prev ? { ...prev, endDate: e.target.value } : { endDate: e.target.value })}
                    className="w-full bg-[#1a1d2e] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-red-500/50" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-white/5">
              <button onClick={() => { setShowForm(false); setEditingPromotion(null); setPromotionSearch(''); setPromotionDropdown(false); setPromotionList([]); }}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white transition-all">Hủy</button>
              <button onClick={() => {
                if (!editingPromotion?.name?.trim()) {
                  alert('Vui lòng nhập tên khuyến mãi.');
                  return;
                }
                if (editingPromotion?.id) {
                  setPromotions(prev => prev.map(p => p.id === editingPromotion.id ? { ...p, ...editingPromotion } : p));
                } else {
                  setPromotions(prev => [{ ...editingPromotion, id: Date.now() }, ...prev]);
                }
                setShowForm(false);
                setEditingPromotion(null);
                setPromotionSearch('');
                setPromotionDropdown(false);
                setPromotionList([]);
              }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-bold text-white transition-all active:scale-95">
                {editingPromotion?.id ? 'Lưu thay đổi' : 'Thêm khuyến mãi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#13151e] border border-white/10 rounded-2xl w-full max-w-sm p-6 text-center">
            <h3 className="text-lg font-black text-white mb-2">Xóa khuyến mãi?</h3>
            <p className="text-sm text-gray-400 mb-6">Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white transition-all">Hủy</button>
              <button onClick={() => { setPromotions(prev => prev.filter(p => p.id !== deleteConfirm)); setDeleteConfirm(null); }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-bold text-white transition-all">Xóa</button>
            </div>
          </div>
        </div>
      )}

      {/* Coming soon notice */}
      <div className="bg-[#13151e] border border-dashed border-amber-500/30 rounded-2xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🚀</span>
        </div>
        <h3 className="text-lg font-black text-white mb-2">Tính năng đang được phát triển</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Phần khuyến mãi đang trong quá trình xây dựng. Bạn có thể quản lý voucher trong hệ thống.
          Liên hệ đội ngũ phát triển để được hỗ trợ thêm.
        </p>
        <div className="flex items-center justify-center gap-4 mt-5 flex-wrap">
          {['Tạo voucher giảm giá', 'Lên lịch khuyến mãi', 'Flash sale', 'Mã khuyến mãi tự động'].map((f) => (
            <span key={f} className="text-[11px] bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-full font-bold border border-amber-500/20">
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPromotions;
