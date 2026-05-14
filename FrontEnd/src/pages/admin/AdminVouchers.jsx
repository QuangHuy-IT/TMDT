import React, { useState, useEffect, useCallback } from 'react';
import AdminService from '../../services/adminService';

const toDatetimeLocal = (dt) => {
  if (!dt) return '';
  const d = dt instanceof Date ? dt : new Date(dt);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const toISO = (val) => val ? new Date(val).toISOString() : null;

const fmt = (n) => n != null ? Number(n).toLocaleString('vi-VN') : '—';

const statusOf = (v) => {
  if (!v.isActive) return { label: 'Tắt', color: 'bg-gray-500/10 text-gray-400', cls: 'gray' };
  const now = new Date();
  const start = v.startAt ? new Date(v.startAt) : null;
  const end   = v.endAt   ? new Date(v.endAt)   : null;
  if (start && now < start) return { label: 'Sắp diễn ra', color: 'bg-blue-500/10 text-blue-400', cls: 'blue' };
  if (end && now > end)     return { label: 'Đã hết hạn',  color: 'bg-red-500/10 text-red-400',   cls: 'red' };
  if (v.usageLimit && v.usedCount >= v.usageLimit)
    return { label: 'Hết lượt', color: 'bg-orange-500/10 text-orange-400', cls: 'orange' };
  return { label: 'Đang hoạt động', color: 'bg-green-500/10 text-green-400', cls: 'green' };
};

// ─── Voucher Form Modal ─────────────────────────────────────────────────────
const VoucherModal = ({ voucher, onClose, onSave, saving }) => {
  const [form, setForm] = useState({
    code:             voucher?.code             || '',
    discountType:     voucher?.discountType     || 'PERCENT',
    discountValue:    voucher?.discountValue   || '',
    maxDiscountAmount: voucher?.maxDiscountAmount || '',
    minOrderAmount:   voucher?.minOrderAmount  || '',
    startAt:          toDatetimeLocal(voucher?.startAt),
    endAt:            toDatetimeLocal(voucher?.endAt),
    usageLimit:       voucher?.usageLimit      || '',
    isActive:         voucher?.isActive         ?? true,
  });
  const [error, setError] = useState('');

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setError('');
  };

  const submit = () => {
    const code = form.code.trim().toUpperCase();
    if (!code) { setError('Mã voucher không được để trống'); return; }
    if (form.discountType === 'PERCENT' && (!form.discountValue || Number(form.discountValue) <= 0 || Number(form.discountValue) > 100)) {
      setError('Phần trăm giảm phải từ 0.01 đến 100'); return;
    }
    if (form.discountType === 'FIXED' && (!form.discountValue || Number(form.discountValue) <= 0)) {
      setError('Số tiền giảm phải lớn hơn 0'); return;
    }
    if (!form.startAt || !form.endAt) { setError('Vui lòng chọn thời gian'); return; }
    if (new Date(form.endAt) <= new Date(form.startAt)) {
      setError('Thời gian kết thúc phải sau thời gian bắt đầu'); return;
    }

    onSave({
      ...(voucher?.id ? { id: voucher.id } : {}),
      code:             code,
      discountType:     form.discountType,
      discountValue:    Number(form.discountValue),
      maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
      minOrderAmount:   form.minOrderAmount   ? Number(form.minOrderAmount)   : null,
      startAt:          toISO(form.startAt),
      endAt:            toISO(form.endAt),
      usageLimit:       form.usageLimit ? Number(form.usageLimit) : null,
      isActive:         form.isActive,
    });
  };

  const isPercent = form.discountType === 'PERCENT';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#13151e] border border-white/10 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 bg-[#13151e] z-10">
          <h3 className="text-lg font-black text-white">
            {voucher?.id ? 'Sửa mã giảm giá' : 'Tạo mã giảm giá'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">

          {/* Code */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
              Mã voucher *
            </label>
            <input
              type="text" value={form.code}
              onChange={(e) => set('code', e.target.value.toUpperCase())}
              placeholder="VD: SUMMER2026"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200
                         placeholder-gray-600 uppercase focus:outline-none focus:border-red-500/50"
            />
          </div>

          {/* Discount type */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
              Loại giảm giá *
            </label>
            <select value={form.discountType}
              onChange={(e) => set('discountType', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200
                         focus:outline-none focus:border-red-500/50">
              <option value="PERCENT">Phần trăm (%)</option>
              <option value="FIXED">Số tiền cố định (VNĐ)</option>
            </select>
          </div>

          {/* Discount value */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
              Giá trị giảm {isPercent ? '(%) *' : '(VNĐ) *'}
            </label>
            <input
              type="number" value={form.discountValue}
              onChange={(e) => set('discountValue', e.target.value)}
              placeholder={isPercent ? 'VD: 10' : 'VD: 100000'}
              min="0"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200
                         placeholder-gray-600 focus:outline-none focus:border-red-500/50"
            />
          </div>

          {/* Max discount (for percent) */}
          {isPercent && (
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                Giảm tối đa (VNĐ)
              </label>
              <input
                type="number" value={form.maxDiscountAmount}
                onChange={(e) => set('maxDiscountAmount', e.target.value)}
                placeholder="VD: 200000"
                min="0"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200
                           placeholder-gray-600 focus:outline-none focus:border-red-500/50"
              />
            </div>
          )}

          {/* Min order amount */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
              Đơn hàng tối thiểu (VNĐ)
            </label>
            <input
              type="number" value={form.minOrderAmount}
              onChange={(e) => set('minOrderAmount', e.target.value)}
              placeholder="VD: 500000 (0 = không giới hạn)"
              min="0"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200
                         placeholder-gray-600 focus:outline-none focus:border-red-500/50"
            />
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Bắt đầu *</label>
              <input type="datetime-local" value={form.startAt}
                onChange={(e) => set('startAt', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-gray-200
                           focus:outline-none focus:border-red-500/50" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Kết thúc *</label>
              <input type="datetime-local" value={form.endAt}
                onChange={(e) => set('endAt', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-gray-200
                           focus:outline-none focus:border-red-500/50" />
            </div>
          </div>

          {/* Usage limit */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
              Số lần sử dụng tối đa
            </label>
            <input
              type="number" value={form.usageLimit}
              onChange={(e) => set('usageLimit', e.target.value)}
              placeholder="VD: 100 (để trống = không giới hạn)"
              min="1"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200
                         placeholder-gray-600 focus:outline-none focus:border-red-500/50"
            />
          </div>

          {/* Active */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive}
                onChange={(e) => set('isActive', e.target.checked)}
                className="accent-red-600 w-4 h-4 rounded" />
              <span className="text-sm text-gray-300 font-medium">Bật voucher</span>
            </label>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-white/5">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white transition-all">
            Hủy
          </button>
          <button onClick={submit} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-bold text-white
                       transition-all active:scale-95 disabled:opacity-50">
            {saving ? 'Đang lưu...' : (voucher?.id ? 'Lưu thay đổi' : 'Tạo voucher')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main AdminVouchers Component ───────────────────────────────────────────
const AdminVouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [filter, setFilter]     = useState('ALL'); // ALL | ACTIVE | INACTIVE | EXPIRED

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await AdminService.getVouchers();
      setVouchers(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVouchers(); }, [fetchVouchers]);

  const openAdd = () => { setEditing(null); setShowForm(true); };
  const openEdit = (v) => { setEditing(v);  setShowForm(true); };

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      if (payload.id) {
        const res = await AdminService.updateVoucher(payload.id, payload);
        setVouchers((p) => p.map((v) => v.id === payload.id ? res.data : v));
      } else {
        const res = await AdminService.createVoucher(payload);
        setVouchers((p) => [res.data, ...p]);
      }
      setShowForm(false);
    } catch (e) {
      alert(e.response?.data?.message || e.response?.data?.error || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (v) => {
    try {
      await AdminService.toggleVoucherActive(v.id, !v.isActive);
      setVouchers((p) => p.map((x) => x.id === v.id ? { ...x, isActive: !x.isActive } : x));
    } catch (e) {
      alert('Cập nhật thất bại');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await AdminService.deleteVoucher(deleteTarget);
      setVouchers((p) => p.filter((v) => v.id !== deleteTarget));
      setDeleteTarget(null);
    } catch (e) {
      alert(e.response?.data?.message || 'Xóa thất bại');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = vouchers.filter((v) => {
    if (filter === 'ACTIVE')   return v.isActive && !statusOf(v).cls.includes('blue') && !statusOf(v).cls.includes('red') && !statusOf(v).cls.includes('orange');
    if (filter === 'INACTIVE') return !v.isActive;
    if (filter === 'EXPIRED') return statusOf(v).cls === 'red' || statusOf(v).cls === 'orange';
    return true;
  });

  const stats = {
    total:   vouchers.length,
    active:  vouchers.filter((v) => v.isActive).length,
    expired: vouchers.filter((v) => !v.isActive || statusOf(v).cls === 'red').length,
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Mã giảm giá</h1>
          <p className="text-sm text-gray-500 mt-1">{vouchers.length} mã | {stats.active} đang hoạt động</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tạo mã mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
        {[
          { label: 'Tổng mã',     count: stats.total,   color: 'text-white',    bg: 'bg-white/5 border-white/10' },
          { label: 'Đang hoạt động', count: stats.active, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
          { label: 'Đã hết hạn / Tắt', count: stats.expired, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
        ].map((s) => (
          <div key={s.label} className={`bg-[#13151e] border rounded-2xl p-5 ${s.bg}`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.count}</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-[#13151e] border border-white/5 rounded-xl p-1 w-fit">
        {[
          { key: 'ALL',      label: 'Tất cả' },
          { key: 'ACTIVE',   label: 'Hoạt động' },
          { key: 'INACTIVE', label: 'Tắt' },
          { key: 'EXPIRED',  label: 'Hết hạn' },
        ].map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              filter === f.key ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#13151e] border border-white/5 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="px-6 py-4 text-sm text-gray-400 border-b border-white/5">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-600 font-bold">
            {vouchers.length === 0 ? 'Chưa có mã giảm giá nào' : 'Không có kết quả phù hợp'}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-gray-500 uppercase tracking-widest border-b border-white/5">
                <th className="text-left px-6 py-3 font-medium">Mã</th>
                <th className="text-center px-6 py-3 font-medium">Loại</th>
                <th className="text-center px-6 py-3 font-medium hidden md:table-cell">Giá trị</th>
                <th className="text-center px-6 py-3 font-medium hidden lg:table-cell">Đơn tối thiểu</th>
                <th className="text-center px-6 py-3 font-medium hidden lg:table-cell">Đã dùng / Tổng</th>
                <th className="text-center px-6 py-3 font-medium">Trạng thái</th>
                <th className="text-center px-6 py-3 font-medium">Bật/Tắt</th>
                <th className="text-center px-6 py-3 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => {
                const st = statusOf(v);
                const isPercent = v.discountType === 'PERCENT';
                const used = v.usedCount || 0;
                const limit = v.usageLimit;
                const pct = limit && limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : null;
                return (
                  <tr key={v.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-white font-mono tracking-wider">{v.code}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {v.startAt ? new Date(v.startAt).toLocaleDateString('vi-VN') : '—'}
                        {' → '}
                        {v.endAt ? new Date(v.endAt).toLocaleDateString('vi-VN') : '—'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${
                        isPercent ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                      }`}>
                        {isPercent ? 'Phần trăm' : 'Cố định'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center hidden md:table-cell">
                      <p className="text-sm font-black text-red-400">
                        {isPercent
                          ? `${v.discountValue}%`
                          : `${fmt(v.discountValue)} đ`}
                      </p>
                      {v.maxDiscountAmount && isPercent && (
                        <p className="text-[10px] text-gray-500">Tối đa {fmt(v.maxDiscountAmount)} đ</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center hidden lg:table-cell">
                      <span className="text-sm text-gray-400">
                        {v.minOrderAmount ? `${fmt(v.minOrderAmount)} đ` : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center hidden lg:table-cell">
                      {limit ? (
                        <>
                          <p className="text-xs text-gray-300">{used} / {limit}</p>
                          <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-orange-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-gray-500">Không giới hạn</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${st.color}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => handleToggle(v)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${
                          v.isActive ? 'bg-red-600' : 'bg-gray-600'
                        }`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          v.isActive ? 'translate-x-5' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEdit(v)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                          title="Sửa">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => setDeleteTarget(v.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          title="Xóa">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <VoucherModal
          voucher={editing}
          onClose={() => setShowForm(false)}
          onSave={handleSave}
          saving={saving}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#13151e] border border-white/10 rounded-2xl w-full max-w-sm p-6 text-center">
            <h3 className="text-lg font-black text-white mb-2">Xóa mã giảm giá?</h3>
            <p className="text-sm text-gray-400 mb-6">Mã '{vouchers.find((v) => v.id === deleteTarget)?.code}' sẽ bị xóa vĩnh viễn.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white transition-all">
                Hủy
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-bold text-white transition-all">
                {deleting ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVouchers;
