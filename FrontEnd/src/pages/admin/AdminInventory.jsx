import React, { useEffect, useMemo, useState } from 'react';
import ProductService from '../../services/productService';

const parseIntSafe = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const buildVariantLabel = (productName, variant) => {
  const parts = [productName];
  if (variant?.ramGb) {
    parts.push(`${variant.ramGb}GB RAM`);
  }
  if (variant?.storageLabel) {
    parts.push(variant.storageLabel);
  } else if (variant?.storageGb) {
    parts.push(`${variant.storageGb}GB`);
  }
  if (variant?.color) {
    parts.push(variant.color);
  }
  return parts.join(' - ');
};

export const AdminInventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [deltaByVariant, setDeltaByVariant] = useState({});
  const [note, setNote] = useState('');
  const [confirmData, setConfirmData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastApplied, setLastApplied] = useState(null);

  useEffect(() => {
    fetchInventoryProducts();
  }, []);

  const fetchInventoryProducts = async () => {
    setLoading(true);
    try {
      const response = await ProductService.getAdminInventoryProducts();
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Cannot load inventory products', error);
      alert(error.response?.data?.message || 'Không thể tải dữ liệu kho');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const query = search.toLowerCase();
    return products.filter((product) => {
      const name = String(product.name || '').toLowerCase();
      const brand = String(product.brand || '').toLowerCase();
      return name.includes(query) || brand.includes(query);
    });
  }, [products, search]);

  const updateDelta = (variantId, value) => {
    setDeltaByVariant((prev) => ({
      ...prev,
      [variantId]: value,
    }));
  };

  const adjustDeltaByStep = (variantId, step) => {
    const current = parseIntSafe(deltaByVariant[variantId] || 0);
    updateDelta(variantId, String(current + step));
  };

  const openConfirm = (product) => {
    const variantItems = product.variantItems || [];
    const changes = variantItems
      .map((variant) => {
        const delta = parseIntSafe(deltaByVariant[variant.id] || 0);
        if (!delta) return null;
        const beforeStock = Number(variant.stock || 0);
        return {
          variantId: variant.id,
          variantName: buildVariantLabel(product.name, variant),
          beforeStock,
          delta,
          afterStock: beforeStock + delta,
        };
      })
      .filter(Boolean);

    if (changes.length === 0) {
      alert('Bạn chưa thay đổi số lượng phiên bản nào.');
      return;
    }

    const invalid = changes.find((item) => item.afterStock < 0);
    if (invalid) {
      alert(`Số lượng sau điều chỉnh không hợp lệ: ${invalid.variantName}`);
      return;
    }

    setConfirmData({
      product,
      changes,
      note: note.trim(),
    });
  };

  const confirmApply = async () => {
    if (!confirmData) return;

    setSubmitting(true);
    try {
      const payload = {
        note: confirmData.note,
        changes: confirmData.changes.map((item) => ({
          variantId: item.variantId,
          delta: item.delta,
        })),
      };

      const response = await ProductService.adjustInventory(confirmData.product.id, payload);
      setLastApplied(response.data);

      const changedVariantIds = confirmData.changes.map((item) => item.variantId);
      setDeltaByVariant((prev) => {
        const next = { ...prev };
        changedVariantIds.forEach((id) => {
          delete next[id];
        });
        return next;
      });

      setConfirmData(null);
      setNote('');
      await fetchInventoryProducts();
    } catch (error) {
      console.error('Adjust inventory failed', error);
      alert(error.response?.data?.message || 'Cập nhật kho thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Kho</h1>
        <p className="text-sm text-gray-500 mt-1">Chọn sản phẩm để điều chỉnh tồn kho theo từng phiên bản</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <div className="relative mb-3">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Tìm sản phẩm theo tên, thương hiệu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#13151e] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-all"
            />
          </div>

          <div className="space-y-3">
            {loading && <p className="text-sm text-gray-500">Đang tải dữ liệu kho...</p>}

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
                      <p className="text-xs text-gray-500">Tổng tồn kho</p>
                      <p className="text-sm font-bold text-emerald-400">{Number(product.stock || 0)}</p>
                    </div>
                  </button>

                  {expanded && (
                    <div className="border-t border-white/5 p-4 space-y-3">
                      {variants.length === 0 && <p className="text-xs text-gray-500">Sản phẩm chưa có phiên bản.</p>}

                      {variants.map((variant) => {
                        const variantId = variant.id;
                        const delta = parseIntSafe(deltaByVariant[variantId] || 0);
                        const beforeStock = Number(variant.stock || 0);
                        const afterStock = beforeStock + delta;
                        const variantName = buildVariantLabel(product.name, variant);

                        return (
                          <div key={variantId} className="grid grid-cols-12 gap-2 p-3 rounded-xl border border-white/10 bg-white/[0.02]">
                            <div className="col-span-12 lg:col-span-5">
                              <p className="text-xs font-bold text-white">{variantName}</p>
                              <p className="text-[11px] text-gray-500 mt-1">SKU: {variant.sku}</p>
                            </div>

                            <div className="col-span-4 lg:col-span-2">
                              <label className="text-[10px] text-gray-500 block mb-1">Hiện tại</label>
                              <div className="h-9 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm text-white font-bold">
                                {beforeStock}
                              </div>
                            </div>

                            <div className="col-span-8 lg:col-span-3">
                              <label className="text-[10px] text-gray-500 block mb-1">Điều chỉnh</label>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => adjustDeltaByStep(variantId, -1)}
                                  className="w-9 h-9 rounded-lg border border-white/10 text-gray-300 hover:text-white hover:border-white/20"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  value={deltaByVariant[variantId] ?? ''}
                                  onChange={(e) => updateDelta(variantId, e.target.value)}
                                  placeholder="0"
                                  className="w-full h-9 text-center bg-white/5 border border-white/10 rounded-lg text-sm text-gray-200"
                                />
                                <button
                                  type="button"
                                  onClick={() => adjustDeltaByStep(variantId, 1)}
                                  className="w-9 h-9 rounded-lg border border-white/10 text-gray-300 hover:text-white hover:border-white/20"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            <div className="col-span-12 lg:col-span-2">
                              <label className="text-[10px] text-gray-500 block mb-1">Sau điều chỉnh</label>
                              <div className={`h-9 flex items-center justify-center rounded-lg border text-sm font-bold ${afterStock >= 0 ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-red-500/30 text-red-400 bg-red-500/10'}`}>
                                {afterStock}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {variants.length > 0 && (
                        <button
                          type="button"
                          onClick={() => openConfirm(product)}
                          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-bold text-white transition-all"
                        >
                          Xác nhận thay đổi cho {product.name}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[#13151e] border border-white/5 rounded-2xl p-4 h-fit space-y-4">
          <h3 className="text-sm font-bold text-white">Ghi chú điều chỉnh</h3>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder="Ví dụ: kiểm kho cuối ngày, nhập hàng mới..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-red-500/50 resize-none"
          />

          {lastApplied && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
              <p className="text-xs font-bold text-emerald-300">Đã lưu thay đổi gần nhất</p>
              <p className="text-xs text-emerald-200 mt-1">{lastApplied.productName}</p>
              <ul className="mt-2 space-y-1">
                {(lastApplied.changes || []).map((item) => (
                  <li key={item.variantId} className="text-[11px] text-emerald-100">
                    {item.variantName}: {item.beforeStock} {item.delta > 0 ? `+ ${item.delta}` : `- ${Math.abs(item.delta)}`} = {item.afterStock}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {confirmData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#13151e] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-black text-white">Xác nhận lưu thay đổi kho</h3>
              <button onClick={() => setConfirmData(null)} className="text-gray-400 hover:text-white">×</button>
            </div>

            <div className="px-6 py-4 overflow-y-auto space-y-3">
              <p className="text-sm text-gray-300">Sản phẩm: <span className="font-bold text-white">{confirmData.product.name}</span></p>
              {confirmData.note && <p className="text-xs text-gray-400">Ghi chú: {confirmData.note}</p>}

              {confirmData.changes.map((item) => (
                <div key={item.variantId} className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
                  <p className="text-xs font-bold text-white">{item.variantName}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {item.beforeStock} {item.delta > 0 ? `+ ${item.delta}` : `- ${Math.abs(item.delta)}`} = <span className="text-emerald-300 font-bold">{item.afterStock}</span>
                  </p>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-white/5 flex gap-3">
              <button
                onClick={() => setConfirmData(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-300 hover:text-white"
              >
                Quay lại chỉnh
              </button>
              <button
                onClick={confirmApply}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-bold text-white"
              >
                {submitting ? 'Đang lưu...' : 'Đồng ý và lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
