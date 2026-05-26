import React, { useState, useEffect, useCallback } from 'react';
import AdminService from '../../services/adminService';

const DATETIME_LOCAL_RE = /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/;

const pad = (n) => String(n).padStart(2, '0');

const parseLocalDateTime = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (typeof value === 'string') {
    const match = value.match(DATETIME_LOCAL_RE);
    if (match) {
      const [, year, month, day, hour, minute, second = '0'] = match;
      return new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second),
        0
      );
    }
  }

  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

const toDatetimeLocal = (dt) => {
  if (!dt) return '';
  if (typeof dt === 'string') {
    const match = dt.match(DATETIME_LOCAL_RE);
    if (match) {
      const [, year, month, day, hour, minute] = match;
      return `${year}-${month}-${day}T${hour}:${minute}`;
    }
  }

  const d = parseLocalDateTime(dt);
  if (!d) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const nowDatetimeLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const toISO = (val) => {
  const normalized = toDatetimeLocal(val);
  return normalized ? `${normalized}:00` : null;
};

const statusColor = (s) => {
  const map = {
    RUNNING:  'bg-green-500/10 text-green-400',
    UPCOMING: 'bg-blue-500/10 text-blue-400',
    ENDED:    'bg-red-500/10 text-red-400',
    ACTIVE:   'bg-green-500/10 text-green-400',
    SOLD_OUT: 'bg-orange-500/10 text-orange-400',
    HIDDEN:   'bg-gray-500/10 text-gray-400',
  };
  return map[s] || 'bg-gray-500/10 text-gray-400';
};

const statusLabel = (s) => {
  const map = {
    RUNNING:  'Đang chạy',
    UPCOMING:  'Sắp tới',
    ENDED:     'Đã kết thúc',
    ACTIVE:    'Đang chạy',
    SOLD_OUT:  'Hết hàng',
    HIDDEN:    'Đã ẩn',
  };
  return map[s] || s;
};

const getCampaignActive = (campaign) => Boolean(campaign?.isActive ?? campaign?.active);

const getCampaignStatus = (campaign) => {
  const startAt = parseLocalDateTime(campaign?.startAt);
  const endAt = parseLocalDateTime(campaign?.endAt);

  if (!startAt || !endAt) {
    return 'ENDED';
  }

  const now = new Date().getTime();

  if (now < startAt.getTime()) return 'UPCOMING';
  if (now <= endAt.getTime()) return 'RUNNING';
  return 'ENDED';
};

const TABS = [
  { key: 'campaigns', label: 'Chiến dịch' },
  { key: 'sessions',  label: 'Phiên' },
  { key: 'products',  label: 'Sản phẩm' },
];

// ─── Campaign Form Modal ───────────────────────────────────────────────────
const CampaignModal = ({ campaign, onClose, onSave, saving }) => {
  const [form, setForm] = useState({
    title:    campaign?.title    || '',
    startAt:  campaign?.startAt ? toDatetimeLocal(campaign.startAt) : nowDatetimeLocal(),
    endAt:    toDatetimeLocal(campaign?.endAt),
  });

  const handle = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = () => {
    if (!form.title.trim()) { alert('Tiêu đề không được để trống'); return; }
    if (!form.startAt)      { alert('Vui lòng chọn thời gian bắt đầu'); return; }
    if (!form.endAt)        { alert('Vui lòng chọn thời gian kết thúc'); return; }
    if (new Date(form.endAt) <= new Date(form.startAt)) {
      alert('Thời gian kết thúc phải sau thời gian bắt đầu'); return;
    }
    onSave({
      ...(campaign?.id ? { id: campaign.id } : {}),
      title:   form.title.trim(),
      startAt: toISO(form.startAt),
      endAt:   toISO(form.endAt),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#13151e] border border-white/10 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h3 className="text-lg font-black text-white">
            {campaign?.id ? 'Sửa chiến dịch' : 'Tạo chiến dịch mới'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
              Tiêu đề chiến dịch *
            </label>
            <input
              type="text" value={form.title}
              onChange={(e) => handle('title', e.target.value)}
              placeholder="VD: Flash Sale Tháng 6 2026"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200
                         placeholder-gray-600 focus:outline-none focus:border-red-500/50"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Bắt đầu *</label>
            <input
              type="datetime-local" value={form.startAt}
              onChange={(e) => handle('startAt', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200
                         focus:outline-none focus:border-red-500/50"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Kết thúc *</label>
            <input
              type="datetime-local" value={form.endAt}
              onChange={(e) => handle('endAt', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200
                         focus:outline-none focus:border-red-500/50"
            />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-white/5">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white transition-all">
            Hủy
          </button>
          <button onClick={submit} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-bold text-white
                       transition-all active:scale-95 disabled:opacity-50">
            {saving ? 'Đang lưu...' : (campaign?.id ? 'Lưu thay đổi' : 'Tạo chiến dịch')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Session Form Modal ────────────────────────────────────────────────────
const SessionModal = ({ session, campaignId, onClose, onSave, saving }) => {
  const [form, setForm] = useState({
    startAt: session?.startAt ? toDatetimeLocal(session.startAt) : nowDatetimeLocal(),
    endAt:   toDatetimeLocal(session?.endAt),
  });

  const handle = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = () => {
    if (!form.startAt) { alert('Vui lòng chọn thời gian bắt đầu'); return; }
    if (!form.endAt)   { alert('Vui lòng chọn thời gian kết thúc'); return; }
    if (new Date(form.endAt) <= new Date(form.startAt)) {
      alert('Thời gian kết thúc phải sau thời gian bắt đầu'); return;
    }
    onSave({
      ...(session?.id ? { id: session.id } : {}),
      campaignId,
      startAt: toISO(form.startAt),
      endAt:   toISO(form.endAt),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#13151e] border border-white/10 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h3 className="text-lg font-black text-white">
            {session?.id ? 'Sửa phiên' : 'Tạo phiên mới'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Bắt đầu *</label>
            <input type="datetime-local" value={form.startAt}
              onChange={(e) => handle('startAt', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200
                         focus:outline-none focus:border-red-500/50" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Kết thúc *</label>
            <input type="datetime-local" value={form.endAt}
              onChange={(e) => handle('endAt', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200
                         focus:outline-none focus:border-red-500/50" />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-white/5">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white transition-all">
            Hủy
          </button>
          <button onClick={submit} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-bold text-white
                       transition-all active:scale-95 disabled:opacity-50">
            {saving ? 'Đang lưu...' : (session?.id ? 'Lưu thay đổi' : 'Tạo phiên')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Product Form Modal ─────────────────────────────────────────────────────
const ProductModal = ({ product, sessions, onClose, onSave, saving }) => {
  const [form, setForm] = useState({
    sessionId:    product?.sessionId  || sessions[0]?.id || '',
    variantId:    product?.variantId  || '',
    flashPrice:   product?.flashPrice || '',
    quantity:     product?.quantity   || '',
    limitPerUser: product?.limitPerUser || 1,
    sortOrder:    product?.sortOrder   || 0,
  });

  // ── Product search state ─────────────────────────────────────────────────
  const [products, setProducts]       = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [search, setSearch]           = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(
    product?.variantId ? { id: product.productId, name: product.productName, variants: product.variantItems || [] } : null
  );
  const [selectedVariant, setSelectedVariant] = useState(
    product?.variantId ? { id: product.variantId, sku: product.sku, color: product.color, storageLabel: product.storageLabel, price: product.flashPrice } : null
  );

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const res = await import('../../services/productService').then(m => m.default.getAdminProducts());
      setProducts(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase()) ||
    p.slug?.toLowerCase().includes(search.toLowerCase())
  );

  const selectProduct = (p) => {
    setSelectedProduct(p);
    setSelectedVariant(null);
    setForm((prev) => ({ ...prev, variantId: '' }));
    setSearch(p.name);
    setShowDropdown(false);
  };

  const selectVariant = (v) => {
    setSelectedVariant(v);
    setForm((prev) => ({ ...prev, variantId: String(v.id) }));
  };

  const handle = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = () => {
    if (!form.sessionId)   { alert('Vui lòng chọn phiên'); return; }
    if (!selectedVariant) { alert('Vui lòng chọn sản phẩm và phân loại (màu/ram) trước'); return; }
    if (!form.flashPrice || Number(form.flashPrice) <= 0) { alert('Giá flash sale không hợp lệ'); return; }
    if (!form.quantity || Number(form.quantity) <= 0)     { alert('Số lượng phải lớn hơn 0'); return; }
    onSave({
      ...(product?.id ? { id: product.id } : {}),
      sessionId:    Number(form.sessionId),
      variantId:    selectedVariant.id,
      productName:  selectedProduct?.name || '',
      flashPrice:   Number(form.flashPrice),
      quantity:     Number(form.quantity),
      limitPerUser: Number(form.limitPerUser) || 1,
      sortOrder:    Number(form.sortOrder) || 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#13151e] border border-white/10 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 bg-[#13151e]">
          <h3 className="text-lg font-black text-white">
            {product?.id ? 'Sửa sản phẩm flash sale' : 'Thêm sản phẩm vào flash sale'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Phiên *</label>
            <select value={form.sessionId} onChange={(e) => handle('sessionId', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200
                         focus:outline-none focus:border-red-500/50">
              <option value="">-- Chọn phiên --</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {statusLabel(s.status)} | {toDatetimeLocal(s.startAt).replace('T', ' ')} → {toDatetimeLocal(s.endAt).replace('T', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* ── Product search ── */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Sản phẩm *</label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowDropdown(true);
                  setSelectedProduct(null);
                  setSelectedVariant(null);
                  setForm((p) => ({ ...p, variantId: '' }));
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Tìm tên sản phẩm..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200
                           placeholder-gray-600 focus:outline-none focus:border-red-500/50"
              />
              {showDropdown && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-[#1a1d2e] border border-white/10 rounded-xl max-h-60 overflow-y-auto shadow-xl">
                  {loadingProducts ? (
                    <div className="px-4 py-3 text-sm text-gray-400">Đang tải...</div>
                  ) : filtered.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500">Không tìm thấy sản phẩm</div>
                  ) : (
                    filtered.slice(0, 15).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => selectProduct(p)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left transition-colors"
                      >
                        {p.thumbnailUrl && (
                          <img src={p.thumbnailUrl} alt="" className="w-10 h-10 rounded-lg object-cover bg-white/5 flex-shrink-0" />
                        )}
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
              <p className="text-[11px] text-green-400 mt-1">✓ Đã chọn: {selectedProduct.name}</p>
            )}
          </div>

          {/* ── Variant picker ── */}
          {selectedProduct && (
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                Phân loại (màu / RAM / Bộ nhớ) *
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
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
                        <span className="text-xs text-gray-400">{v.color?.charAt(0)}</span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-200">
                        {v.color} {v.storageLabel || `${v.storageGb}GB`} {v.ramGb ? `· ${v.ramGb}GB RAM` : ''}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        SKU: {v.sku} · Giá gốc: {Number(v.price).toLocaleString()}đ · Tồn: {v.stock}
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Giá flash (VNĐ) *</label>
              <input type="number" value={form.flashPrice}
                onChange={(e) => handle('flashPrice', e.target.value)}
                placeholder="VD: 999000"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200
                           placeholder-gray-600 focus:outline-none focus:border-red-500/50" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Số lượng *</label>
              <input type="number" value={form.quantity}
                onChange={(e) => handle('quantity', e.target.value)}
                placeholder="VD: 50"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200
                           placeholder-gray-600 focus:outline-none focus:border-red-500/50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Giới hạn/user</label>
              <input type="number" min="1" value={form.limitPerUser}
                onChange={(e) => handle('limitPerUser', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200
                           focus:outline-none focus:border-red-500/50" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Thứ tự</label>
              <input type="number" min="0" value={form.sortOrder}
                onChange={(e) => handle('sortOrder', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200
                           focus:outline-none focus:border-red-500/50" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-white/5">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white transition-all">
            Hủy
          </button>
          <button onClick={submit} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-bold text-white
                       transition-all active:scale-95 disabled:opacity-50">
            {saving ? 'Đang lưu...' : (product?.id ? 'Lưu thay đổi' : 'Thêm sản phẩm')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main AdminFlashSale Component ─────────────────────────────────────────
const AdminFlashSale = () => {
  const [tab, setTab] = useState('campaigns');
  const [campaigns, setCampaigns]       = useState([]);
  const [sessions, setSessions]         = useState([]);
  const [products, setProducts]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [selectedCampaign, setSelected] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);

  // Modals
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showSessionModal,  setShowSessionModal]   = useState(false);
  const [showProductModal,  setShowProductModal]   = useState(false);
  const [editingCampaign,   setEditingCampaign]   = useState(null);
  const [editingSession,    setEditingSession]    = useState(null);
  const [editingProduct,    setEditingProduct]    = useState(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null); // { type, id }
  const [deleting, setDeleting]        = useState(false);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await AdminService.getFlashSaleCampaigns();
      setCampaigns(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSessions = useCallback(async (campaignId) => {
    if (!campaignId) { setSessions([]); return; }
    try {
      const res = await AdminService.getFlashSaleSessions(campaignId);
      setSessions(res.data || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchProducts = useCallback(async (sessionId) => {
    if (!sessionId) { setProducts([]); return; }
    try {
      const res = await AdminService.getFlashSaleProducts(sessionId);
      setProducts(res.data || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  // When tab changes, load appropriate data
  useEffect(() => {
    if (tab === 'campaigns') {
      // nothing extra
    } else if (tab === 'sessions' && selectedCampaign) {
      fetchSessions(selectedCampaign.id);
    } else if (tab === 'products' && selectedSession) {
      fetchProducts(selectedSession.id);
    }
  }, [tab, selectedCampaign, selectedSession, fetchSessions, fetchProducts]);

  // ── Campaign handlers ──────────────────────────────────────────────────────
  const openAddCampaign = () => {
    setEditingCampaign(null);
    setShowCampaignModal(true);
  };

  const openEditCampaign = (c) => {
    setEditingCampaign(c);
    setShowCampaignModal(true);
  };

  const handleSaveCampaign = async (payload) => {
    setSaving(true);
    try {
      if (payload.id) {
        const res = await AdminService.updateFlashSaleCampaign(payload.id, payload);
        setCampaigns((p) => p.map((c) => c.id === payload.id ? res.data : c));
      } else {
        const res = await AdminService.createFlashSaleCampaign(payload);
        setCampaigns((p) => [res.data, ...p]);
      }
      setShowCampaignModal(false);
    } catch (e) {
      alert(e.response?.data?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCampaign = async (c) => {
    try {
      if (getCampaignActive(c)) {
        await AdminService.deactivateFlashSaleCampaign(c.id);
      } else {
        await AdminService.activateFlashSaleCampaign(c.id);
      }
      setCampaigns((p) => p.map((x) =>
        x.id === c.id ? { ...x, isActive: !getCampaignActive(x), active: !getCampaignActive(x) } : x
      ));
    } catch (e) {
      alert('Cập nhật thất bại');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { type, id } = deleteTarget;
      if (type === 'campaign') {
        await AdminService.deleteFlashSaleCampaign(id);
        setCampaigns((p) => p.filter((c) => c.id !== id));
        if (selectedCampaign?.id === id) setSelected(null);
      } else if (type === 'session') {
        await AdminService.deleteFlashSaleSession(id);
        setSessions((p) => p.filter((s) => s.id !== id));
        if (selectedSession?.id === id) setSelectedSession(null);
      } else if (type === 'product') {
        await AdminService.removeFlashSaleProduct(id);
        setProducts((p) => p.filter((x) => x.id !== id));
      }
      setDeleteTarget(null);
    } catch (e) {
      alert(e.response?.data?.message || 'Xóa thất bại');
    } finally {
      setDeleting(false);
    }
  };

  // ── Session handlers ───────────────────────────────────────────────────────
  const openAddSession = () => {
    setEditingSession(null);
    setShowSessionModal(true);
  };

  const openEditSession = (s) => {
    setEditingSession(s);
    setShowSessionModal(true);
  };

  const handleSaveSession = async (payload) => {
    setSaving(true);
    try {
      if (payload.id) {
        const res = await AdminService.updateFlashSaleSession(payload.id, payload);
        setSessions((p) => p.map((s) => s.id === payload.id ? res.data : s));
      } else {
        const res = await AdminService.createFlashSaleSession(payload);
        setSessions((p) => [...p, res.data]);
      }
      setShowSessionModal(false);
    } catch (e) {
      alert(e.response?.data?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshStatuses = async () => {
    try {
      await AdminService.updateFlashSaleSessionStatuses();
      if (selectedCampaign) fetchSessions(selectedCampaign.id);
      fetchCampaigns();
    } catch (e) {
      alert('Cập nhật trạng thái thất bại');
    }
  };

  // ── Product handlers ──────────────────────────────────────────────────────
  const openAddProduct = () => {
    setEditingProduct(null);
    setShowProductModal(true);
  };

  const openEditProduct = (p) => {
    setEditingProduct(p);
    setShowProductModal(true);
  };

  const handleSaveProduct = async (payload) => {
    setSaving(true);
    try {
      if (payload.id) {
        const res = await AdminService.updateFlashSaleProduct(payload.id, payload);
        setProducts((p) => p.map((x) => x.id === payload.id ? res.data : x));
      } else {
        const res = await AdminService.addFlashSaleProduct(payload);
        setProducts((p) => [res.data, ...p]);
      }
      setShowProductModal(false);
    } catch (e) {
      alert(e.response?.data?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleHideShow = async (p) => {
    try {
      if (p.status === 'HIDDEN') {
        await AdminService.showFlashSaleProduct(p.id);
      } else {
        await AdminService.hideFlashSaleProduct(p.id);
      }
      setProducts((prev) => prev.map((x) =>
        x.id === p.id ? { ...x, status: x.status === 'HIDDEN' ? 'ACTIVE' : 'HIDDEN' } : x
      ));
    } catch (e) {
      alert('Cập nhật thất bại');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const runningCampaigns  = campaigns.filter((c) => getCampaignStatus(c) === 'RUNNING');
  const upcomingCampaigns = campaigns.filter((c) => getCampaignStatus(c) === 'UPCOMING');
  const endedCampaigns    = campaigns.filter((c) => getCampaignStatus(c) === 'ENDED');

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Sale</h1>
          <p className="text-sm text-gray-500 mt-1">
            {campaigns.length} chiến dịch | {sessions.length} phiên | {products.length} sản phẩm
          </p>
        </div>
        <button
          onClick={handleRefreshStatuses}
          className="flex items-center gap-2 px-4 py-2 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white text-sm font-bold rounded-xl transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Cập nhật trạng thái
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Đang chạy',  count: runningCampaigns.length,  color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
          { label: 'Sắp tới',     count: upcomingCampaigns.length, color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'Đã kết thúc', count: endedCampaigns.length,    color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
          { label: 'Tổng chiến dịch', count: campaigns.length,   color: 'text-white',       bg: 'bg-white/5 border-white/10' },
        ].map((stat) => (
          <div key={stat.label} className={`bg-[#13151e] border rounded-2xl p-5 ${stat.bg}`}>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.count}</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-[#13151e] border border-white/5 rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
              tab === t.key
                ? 'bg-red-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── CAMPAIGNS TAB ── */}
      {tab === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 font-medium">Quản lý chiến dịch flash sale</p>
            <button
              onClick={openAddCampaign}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm chiến dịch
            </button>
          </div>

          <div className="bg-[#13151e] border border-white/5 rounded-2xl overflow-hidden">
            {loading ? (
              <div className="px-6 py-4 text-sm text-gray-400 border-b border-white/5">Đang tải...</div>
            ) : campaigns.length === 0 ? (
              <div className="py-16 text-center text-gray-600 font-bold">Chưa có chiến dịch nào</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] text-gray-500 uppercase tracking-widest border-b border-white/5">
                    <th className="text-left px-6 py-3 font-medium">Chiến dịch</th>
                    <th className="text-center px-6 py-3 font-medium hidden md:table-cell">Thời gian</th>
                    <th className="text-center px-6 py-3 font-medium">Trạng thái</th>
                    <th className="text-center px-6 py-3 font-medium">Tắt/Bật</th>
                    <th className="text-center px-6 py-3 font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-white">{c.title}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {c.sessions?.length || 0} phiên
                        </p>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <p className="text-xs text-gray-400">
                          {toDatetimeLocal(c.startAt).replace('T', ' ')}
                        </p>
                        <p className="text-xs text-gray-500">→ {toDatetimeLocal(c.endAt).replace('T', ' ')}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${statusColor(getCampaignStatus(c))}`}>
                          {statusLabel(getCampaignStatus(c))}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleCampaign(c)}
                          className={`relative w-11 h-6 rounded-full transition-colors ${
                            getCampaignActive(c) ? 'bg-red-600' : 'bg-gray-600'
                          }`}
                        >
                          <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                            getCampaignActive(c) ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEditCampaign(c)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                            title="Sửa">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button onClick={() => setDeleteTarget({ type: 'campaign', id: c.id })}
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
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── SESSIONS TAB ── */}
      {tab === 'sessions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-500 font-medium">Chọn chiến dịch:</p>
              <select
                value={selectedCampaign?.id || ''}
                onChange={(e) => {
                  const c = campaigns.find((x) => x.id === Number(e.target.value));
                  setSelected(c || null);
                  setSelectedSession(null);
                  setProducts([]);
                }}
                className="bg-[#13151e] border border-white/10 rounded-xl px-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-red-500/50"
              >
                <option value="">-- Chọn chiến dịch --</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            {selectedCampaign && (
              <button onClick={openAddSession}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Thêm phiên
              </button>
            )}
          </div>

          {selectedCampaign ? (
            <div className="bg-[#13151e] border border-white/5 rounded-2xl overflow-hidden">
              {sessions.length === 0 ? (
                <div className="py-16 text-center text-gray-600 font-bold">Chưa có phiên nào trong chiến dịch này</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-[10px] text-gray-500 uppercase tracking-widest border-b border-white/5">
                      <th className="text-left px-6 py-3 font-medium">Phiên</th>
                      <th className="text-center px-6 py-3 font-medium hidden md:table-cell">Thời gian</th>
                      <th className="text-center px-6 py-3 font-medium">Trạng thái</th>
                      <th className="text-center px-6 py-3 font-medium">Sản phẩm</th>
                      <th className="text-center px-6 py-3 font-medium">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr key={s.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-white">Phiên #{s.sessionNumber || s.id}</p>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <p className="text-xs text-gray-400">{toDatetimeLocal(s.startAt).replace('T', ' ')}</p>
                          <p className="text-xs text-gray-500">→ {toDatetimeLocal(s.endAt).replace('T', ' ')}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${statusColor(s.status)}`}>
                            {statusLabel(s.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm text-gray-300">{s.products?.length || 0}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => openEditSession(s)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                              title="Sửa">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button onClick={() => setDeleteTarget({ type: 'session', id: s.id })}
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
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div className="bg-[#13151e] border border-dashed border-white/10 rounded-2xl p-16 text-center">
              <p className="text-gray-600 font-bold">Vui lòng chọn chiến dịch để xem phiên</p>
            </div>
          )}
        </div>
      )}

      {/* ── PRODUCTS TAB ── */}
      {tab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-sm text-gray-500 font-medium">Chiến dịch:</p>
              <select
                value={selectedCampaign?.id || ''}
                onChange={(e) => {
                  const c = campaigns.find((x) => x.id === Number(e.target.value));
                  setSelected(c || null);
                  setSelectedSession(null);
                  setProducts([]);
                  if (c) fetchSessions(c.id);
                }}
                className="bg-[#13151e] border border-white/10 rounded-xl px-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-red-500/50"
              >
                <option value="">-- Chọn chiến dịch --</option>
                {campaigns.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>

              {sessions.length > 0 && (
                <>
                  <p className="text-sm text-gray-500 font-medium">Phiên:</p>
                  <select
                    value={selectedSession?.id || ''}
                    onChange={(e) => {
                      const s = sessions.find((x) => x.id === Number(e.target.value));
                      setSelectedSession(s || null);
                      if (s) fetchProducts(s.id);
                      else setProducts([]);
                    }}
                    className="bg-[#13151e] border border-white/10 rounded-xl px-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-red-500/50"
                  >
                    <option value="">-- Chọn phiên --</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        #{s.sessionNumber || s.id} - {statusLabel(s.status)} ({toDatetimeLocal(s.startAt).replace('T', ' ')})
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
            {selectedSession && (
              <button onClick={openAddProduct}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Thêm sản phẩm
              </button>
            )}
          </div>

          {selectedSession ? (
            <div className="bg-[#13151e] border border-white/5 rounded-2xl overflow-hidden">
              {products.length === 0 ? (
                <div className="py-16 text-center text-gray-600 font-bold">Chưa có sản phẩm nào trong phiên này</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-[10px] text-gray-500 uppercase tracking-widest border-b border-white/5">
                      <th className="text-left px-6 py-3 font-medium">Sản phẩm</th>
                      <th className="text-center px-6 py-3 font-medium hidden md:table-cell">Giá gốc</th>
                      <th className="text-center px-6 py-3 font-medium">Giá flash</th>
                      <th className="text-center px-6 py-3 font-medium">Đã bán / Tổng</th>
                      <th className="text-center px-6 py-3 font-medium">Trạng thái</th>
                      <th className="text-center px-6 py-3 font-medium">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => {
                      const sold = p.soldQuantity || 0;
                      const total = p.quantity || 0;
                      const pct = total > 0 ? Math.min(100, Math.round((sold / total) * 100)) : 0;
                      return (
                        <tr key={p.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-white">{p.productName || `Variant #${p.variantId}`}</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              SKU: {p.sku || '—'} | {p.color || ''} {p.ramGb ? `${p.ramGb}GB RAM` : ''} {p.storageGb ? `/ ${p.storageGb}GB` : ''}
                            </p>
                          </td>
                          <td className="px-6 py-4 hidden md:table-cell text-center">
                            <span className="text-sm text-gray-400 line-through">
                              {p.originalPrice?.toLocaleString('vi-VN') || p.price?.toLocaleString('vi-VN')} đ
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-black text-red-400">
                              {p.flashPrice?.toLocaleString('vi-VN')} đ
                            </span>
                            {p.discountPercent && (
                              <span className="ml-1 text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                                -{p.discountPercent}%
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <p className="text-xs text-gray-300">{sold} / {total}</p>
                            <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                              <div className="bg-red-600 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${statusColor(p.status)}`}>
                              {statusLabel(p.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => openEditProduct(p)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                                title="Sửa">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button onClick={() => handleHideShow(p)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all"
                                title={p.status === 'HIDDEN' ? 'Hiện' : 'Ẩn'}>
                                {p.status === 'HIDDEN' ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                  </svg>
                                )}
                              </button>
                              <button onClick={() => setDeleteTarget({ type: 'product', id: p.id })}
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
          ) : (
            <div className="bg-[#13151e] border border-dashed border-white/10 rounded-2xl p-16 text-center">
              <p className="text-gray-600 font-bold">Vui lòng chọn chiến dịch và phiên để xem sản phẩm</p>
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {showCampaignModal && (
        <CampaignModal
          campaign={editingCampaign}
          onClose={() => setShowCampaignModal(false)}
          onSave={handleSaveCampaign}
          saving={saving}
        />
      )}

      {showSessionModal && (
        <SessionModal
          session={editingSession}
          campaignId={selectedCampaign?.id}
          onClose={() => setShowSessionModal(false)}
          onSave={handleSaveSession}
          saving={saving}
        />
      )}

      {showProductModal && (
        <ProductModal
          product={editingProduct}
          sessions={sessions}
          onClose={() => setShowProductModal(false)}
          onSave={handleSaveProduct}
          saving={saving}
        />
      )}

      {/* ── Delete Confirm ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#13151e] border border-white/10 rounded-2xl w-full max-w-sm p-6 text-center">
            <h3 className="text-lg font-black text-white mb-2">Xác nhận xóa?</h3>
            <p className="text-sm text-gray-400 mb-6">
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white transition-all">
                Hủy
              </button>
              <button onClick={handleDeleteConfirm} disabled={deleting}
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

export default AdminFlashSale;
