import React, { useEffect, useMemo, useState, useCallback } from 'react';
import AdminService from '../../services/adminService';
import ProductService from '../../services/productService';

const buildVariantLabel = (productName, variant) => {
  const parts = [productName];
  if (variant?.ramGb) parts.push(`${variant.ramGb}GB RAM`);
  if (variant?.storageLabel) parts.push(variant.storageLabel);
  else if (variant?.storageGb) parts.push(`${variant.storageGb}GB`);
  if (variant?.color) parts.push(variant.color);
  return parts.join(' - ');
};

const toDatetimeLocal = (dt) => {
  if (!dt) return '';
  const d = dt instanceof Date ? dt : new Date(dt);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const statusColor = (s) => {
  const map = {
    ACTIVE: 'bg-green-500/10 text-green-400',
    UPCOMING: 'bg-blue-500/10 text-blue-400',
    ENDED: 'bg-gray-500/10 text-gray-400',
  };
  return map[s] || 'bg-gray-500/10 text-gray-400';
};

const statusLabel = (s) => {
  const map = {
    ACTIVE: 'Đang giảm giá',
    UPCOMING: 'Sắp tới',
    ENDED: 'Đã kết thúc',
  };
  return map[s] || s;
};

export const AdminDiscounts = () => {
  const [products, setProducts] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [formData, setFormData] = useState({
    discountType: 'PERCENT',
    discountPercent: '',
    discountAmount: '',
    startAt: '',
    endAt: '',
  });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, discRes] = await Promise.all([
        ProductService.getAdminInventoryProducts(),
        AdminService.getDiscounts(),
      ]);
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
      setDiscounts(Array.isArray(discRes.data) ? discRes.data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const getDiscountForVariant = useCallback((variantId) => {
    return discounts.find((d) => d.variantId === variantId);
  }, [discounts]);

  const filteredProducts = useMemo(() => {
    const query = search.toLowerCase();
    return products.filter((product) => {
      const name = String(product.name || '').toLowerCase();
      const brand = String(product.brand || '').toLowerCase();
      return name.includes(query) || brand.includes(query);
    });
  }, [products, search]);

  const handleSelectVariant = (product, variant) => {
    const pid = product.id || product._id;
    const vid = variant.id;
    setSelectedVariant({ product, variant });
    setExpandedProductId(pid);

    const existing = getDiscountForVariant(vid);
    if (existing) {
      // Kiểm tra discountPercent trước (dùng %) hay không (dùng số tiền)
      const isPercent = existing.discountPercent && existing.discountPercent > 0;
      setFormData({
        discountType: isPercent ? 'PERCENT' : 'FIXED',
        discountPercent: isPercent ? String(existing.discountPercent) : '',
        discountAmount: !isPercent && existing.discountPrice ? String(existing.discountPrice) : '',
        startAt: existing.startAt ? toDatetimeLocal(existing.startAt) : '',
        endAt: existing.endAt ? toDatetimeLocal(existing.endAt) : '',
      });
      setEditingId(existing.id);
    } else {
      setFormData({ discountType: 'PERCENT', discountPercent: '', discountAmount: '', startAt: '', endAt: '' });
      setEditingId(null);
    }
  };

  const calcDiscountPrice = useCallback(() => {
    if (!selectedVariant) return null;
    const base = selectedVariant.variant.price;
    if (formData.discountType === 'FIXED' && formData.discountAmount) {
      const amt = Number(formData.discountAmount);
      // formData.discountAmount = GIÁ SAU GIẢM → số tiền giảm = base - amt
      return Math.max(0, base - amt);
    }
    if (formData.discountType === 'PERCENT' && formData.discountPercent) {
      const pct = Number(formData.discountPercent);
      return Math.round(base * (100 - pct) / 100);
    }
    return null;
  }, [selectedVariant, formData]);

  const handleSave = async () => {
    if (!selectedVariant) { alert('Vui lòng chọn một phiên bản sản phẩm.'); return; }
    const pct = Number(formData.discountPercent);
    const amt = Number(formData.discountAmount);
    if (formData.discountType === 'PERCENT') {
      if (!formData.discountPercent || pct < 1 || pct > 99) {
        alert('Phần trăm giảm giá phải từ 1% đến 99%.'); return;
      }
    } else {
      if (!formData.discountAmount || amt <= 0) {
        alert('Giá sau giảm phải lớn hơn 0.'); return;
      }
      if (amt >= selectedVariant.variant.price) {
        alert('Giá sau giảm phải nhỏ hơn giá gốc.'); return;
      }
    }
    if (!formData.startAt || !formData.endAt) { alert('Vui lòng chọn thời gian bắt đầu và kết thúc.'); return; }
    if (new Date(formData.endAt) <= new Date(formData.startAt)) {
      alert('Thời gian kết thúc phải sau thời gian bắt đầu.'); return;
    }

    setSaving(true);
    try {
      const toISO = (val) => val ? new Date(val).toISOString() : null;
      const payload = {
        variantId: selectedVariant.variant.id,
        discountType: formData.discountType,
        discountPercent: formData.discountType === 'PERCENT' ? pct : null,
        discountAmount: formData.discountType === 'FIXED' ? amt : null,
        startAt: toISO(formData.startAt),
        endAt: toISO(formData.endAt),
      };

      if (editingId) {
        const res = await AdminService.updateDiscount(editingId, payload);
        setDiscounts((prev) => prev.map((d) => d.id === editingId ? res.data : d));
      } else {
        const res = await AdminService.createDiscount(payload);
        setDiscounts((prev) => [res.data, ...prev]);
      }

      setSelectedVariant(null);
      setFormData({ discountType: 'PERCENT', discountPercent: '', discountAmount: '', startAt: '', endAt: '' });
      setEditingId(null);
    } catch (e) {
      alert(e.response?.data?.message || 'Lưu thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await AdminService.deleteDiscount(id);
      setDiscounts((prev) => prev.filter((d) => d.id !== id));
      setDeletingId(null);
    } catch {
      alert('Xóa thất bại.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Giảm giá</h1>
        <p className="text-sm text-gray-500 mt-1">Thiết lập giảm giá cho từng phiên bản sản phẩm</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Product list */}
        <div className="lg:col-span-2">
          <div className="relative mb-3">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Tìm sản phẩm theo tên, thương hiệu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#13151e] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-all"
            />
          </div>

          <div className="space-y-3">
            {loading && <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>}
            {!loading && filteredProducts.length === 0 && (
              <div className="bg-[#13151e] border border-white/5 rounded-2xl p-6 text-sm text-gray-500">
                Không tìm thấy sản phẩm.
              </div>
            )}

            {filteredProducts.map((product) => {
              const pid = product.id || product._id;
              const expanded = expandedProductId === pid;
              const variants = product.variantItems || [];

              return (
                <div key={pid} className="bg-[#13151e] border border-white/5 rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedProductId(expanded ? null : pid)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="text-left">
                      <p className="text-sm font-bold text-white">{product.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{product.brand} · {variants.length} phiên bản</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Đang giảm giá</p>
                      <p className="text-sm font-bold text-emerald-400">
                        {variants.filter((v) => getDiscountForVariant(v.id)?.status === 'ACTIVE').length} / {variants.length}
                      </p>
                    </div>
                  </button>

                  {expanded && (
                    <div className="border-t border-white/5 p-4 space-y-2">
                      {variants.length === 0 && (
                        <p className="text-xs text-gray-500">Sản phẩm chưa có phiên bản.</p>
                      )}
                      {variants.map((variant) => {
                        const variantId = variant.id;
                        const discount = getDiscountForVariant(variantId);
                        const isSelected = selectedVariant?.variant?.id === variantId;

                        return (
                          <div
                            key={variantId}
                            onClick={() => handleSelectVariant(product, variant)}
                            className={`grid grid-cols-12 gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'border-red-500/50 bg-red-500/5'
                                : discount
                                  ? 'border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40'
                                  : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                            }`}
                          >
                            <div className="col-span-12 lg:col-span-5">
                              <p className="text-xs font-bold text-white">{buildVariantLabel(product.name, variant)}</p>
                              <p className="text-[11px] text-gray-500 mt-1">
                                {variant.sku} · {Number(variant.price).toLocaleString()}đ
                              </p>
                            </div>

                            <div className="col-span-6 lg:col-span-3 flex items-center">
                              {discount ? (
                                <div className="flex flex-col">
                                  <span className="text-sm font-black text-red-400">
                                    {discount.discountAmount && discount.discountAmount > 0
                                      ? `Giảm ${Number(discount.discountAmount).toLocaleString()}đ`
                                      : `-${discount.discountPercent}%`}
                                  </span>
                                  <span className="text-[10px] text-gray-500">
                                    Còn {Number(discount.discountPrice).toLocaleString()}đ
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-600">Chưa giảm giá</span>
                              )}
                            </div>

                            <div className="col-span-6 lg:col-span-4 flex items-center">
                              {discount ? (
                                <div className="flex items-center gap-2 w-full">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor(discount.status)}`}>
                                    {statusLabel(discount.status)}
                                  </span>
                                  {isSelected && (
                                    <span className="ml-auto text-red-400 text-xs font-bold">Đang chọn</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[11px] text-gray-600">Nhấn để thiết lập giảm giá</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Discount form */}
        <div className="bg-[#13151e] border border-white/5 rounded-2xl p-4 h-fit space-y-4">
          <h3 className="text-sm font-bold text-white">
            {editingId ? 'Sửa giảm giá' : 'Thiết lập giảm giá'}
          </h3>

          {selectedVariant ? (
            <>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <p className="text-xs text-gray-500 mb-1">Phiên bản đã chọn:</p>
                <p className="text-sm font-bold text-white">{buildVariantLabel(selectedVariant.product.name, selectedVariant.variant)}</p>
                <p className="text-[11px] text-gray-500 mt-1">
                  SKU: {selectedVariant.variant.sku}
                </p>
                <p className="text-[11px] font-bold text-gray-300 mt-1">
                  Giá gốc: <span className="text-white">{Number(selectedVariant.variant.price).toLocaleString()}đ</span>
                </p>
              </div>

              {/* Discount type */}
              <div>
                <label className="text-[10px] text-gray-500 block mb-1.5">Loại giảm giá *</label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData((p) => ({ ...p, discountType: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-red-500/50"
                >
                  <option value="PERCENT">Phần trăm (%)</option>
                  <option value="FIXED">Số tiền cố định (VNĐ)</option>
                </select>
              </div>

              {/* Discount value */}
              {formData.discountType === 'PERCENT' ? (
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1.5">Phần trăm giảm giá (%) *</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={formData.discountPercent}
                    onChange={(e) => setFormData((p) => ({ ...p, discountPercent: e.target.value }))}
                    placeholder="VD: 15"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-red-500/50"
                  />
                  {formData.discountPercent && (
                    <p className="text-[10px] text-emerald-400 mt-1">
                      Giá sau giảm: {calcDiscountPrice()?.toLocaleString()}đ
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1.5">Giá sau giảm (VNĐ) *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.discountAmount}
                    onChange={(e) => setFormData((p) => ({ ...p, discountAmount: e.target.value }))}
                    placeholder="VD: 10000000"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-red-500/50"
                  />
                  {formData.discountAmount && (
                    <p className="text-[10px] text-emerald-400 mt-1">
                      Giảm {calcDiscountPrice()?.toLocaleString()}đ → Còn {Number(formData.discountAmount).toLocaleString()}đ
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1.5">Bắt đầu *</label>
                  <input
                    type="datetime-local"
                    value={formData.startAt}
                    onChange={(e) => setFormData((p) => ({ ...p, startAt: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-red-500/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1.5">Kết thúc *</label>
                  <input
                    type="datetime-local"
                    value={formData.endAt}
                    onChange={(e) => setFormData((p) => ({ ...p, endAt: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-red-500/50"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedVariant(null);
                    setFormData({ discountType: 'PERCENT', discountPercent: '', discountAmount: '', startAt: '', endAt: '' });
                    setEditingId(null);
                  }}
                  className="flex-1 py-2 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-bold text-white transition-all disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Thiết lập giảm giá'}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 font-medium">Nhấn vào phiên bản bên trái</p>
              <p className="text-xs text-gray-600 mt-1">để thiết lập giảm giá</p>
            </div>
          )}

          {/* Active discounts summary */}
          {discounts.filter((d) => d.status === 'ACTIVE').length > 0 && (
            <div className="border-t border-white/5 pt-4">
              <p className="text-xs font-bold text-gray-500 mb-2">Đang giảm giá ({discounts.filter((d) => d.status === 'ACTIVE').length})</p>
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {discounts
                  .filter((d) => d.status === 'ACTIVE')
                  .map((d) => {
                    // Find product + variant for full label
                    const product = products.find((p) => (p.id || p._id) === d.productId);
                    const variant = product?.variantItems?.find((v) => v.id === d.variantId);
                    const fullLabel = variant
                      ? buildVariantLabel(product?.name || d.productName || '', variant)
                      : `${d.productName || ''} ${d.ramLabel ? d.ramLabel + ' ' : ''}${d.storageLabel || ''} ${d.color || ''}`.trim();

                    return (
                      <div
                        key={d.id}
                        onClick={() => {
                          if (product && variant) {
                            handleSelectVariant(product, variant);
                          }
                        }}
                        className="flex items-start justify-between gap-2 p-2.5 rounded-lg border border-emerald-500/10 bg-emerald-500/5 hover:border-emerald-500/30 cursor-pointer transition-all"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold text-gray-200 leading-tight">{fullLabel}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {d.discountAmount && d.discountAmount > 0
                              ? `Giảm ${Number(d.discountAmount).toLocaleString()}đ → Còn ${Number(d.discountPrice).toLocaleString()}đ`
                              : `Giảm ${d.discountPercent}% → Còn ${Number(d.discountPrice).toLocaleString()}đ`}
                          </p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeletingId(d.id); }}
                          className="p-1 rounded text-gray-500 hover:text-red-400 transition-all flex-shrink-0"
                          title="Xóa"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#13151e] border border-white/10 rounded-2xl w-full max-w-sm p-6 text-center">
            <h3 className="text-lg font-black text-white mb-2">Xóa giảm giá?</h3>
            <p className="text-sm text-gray-400 mb-6">Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white transition-all"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
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

export default AdminDiscounts;
