import React, { useEffect, useMemo, useState, useRef } from 'react';
import ProductService from '../../services/productService';

const parseIntSafe = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const buildVariantLabel = (productName, variant) => {
  const parts = [productName];
  if (variant?.ramGb) parts.push(`${variant.ramGb}GB RAM`);
  if (variant?.storageLabel) parts.push(variant.storageLabel);
  else if (variant?.storageGb) parts.push(`${variant.storageGb}GB`);
  if (variant?.color) parts.push(variant.color);
  return parts.join(' - ');
};

const formatDate = (dt) => {
  if (!dt) return '';
  const d = new Date(dt);
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const AdminInventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search
  const [search, setSearch] = useState('');
  const [expandedProductIds, setExpandedProductIds] = useState(new Set());

  // Per-variant delta: { [variantId]: number }
  const [deltaByVariant, setDeltaByVariant] = useState({});

  // Ghi chú
  const [note, setNote] = useState('');

  // Cart items (pending adjust items)
  const [pendingItems, setPendingItems] = useState([]);

  // Log history
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logPage, setLogPage] = useState(0);
  const [logTotalPages, setLogTotalPages] = useState(0);
  const [expandedLogId, setExpandedLogId] = useState(null);

  // Modal xác nhận
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInventoryProducts();
    fetchLogs(0);
  }, []);

  const fetchInventoryProducts = async () => {
    setLoading(true);
    try {
      const response = await ProductService.getAdminInventoryProducts();
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Cannot load inventory products', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (page = 0) => {
    setLoadingLogs(true);
    try {
      const response = await ProductService.getInventoryLogs(page, 10);
      setLogs(response.data.content || []);
      setLogTotalPages(response.data.totalPages || 0);
      setLogPage(page);
    } catch (error) {
      console.error('Cannot load logs', error);
    } finally {
      setLoadingLogs(false);
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
    setDeltaByVariant((prev) => ({ ...prev, [variantId]: value }));
  };

  const adjustDeltaByStep = (variantId, step) => {
    const current = parseIntSafe(deltaByVariant[variantId] || 0);
    updateDelta(variantId, String(current + step));
  };

  const toggleProduct = (productId) => {
    setExpandedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const addProductToPending = (product) => {
    const variants = product.variantItems || [];
    let added = false;

    const newItems = [...pendingItems];
    variants.forEach((variant) => {
      const delta = parseIntSafe(deltaByVariant[variant.id] || 0);
      if (delta === 0) return;

      const beforeStock = Number(variant.stock || 0);
      const afterStock = beforeStock + delta;
      if (afterStock < 0) return;

      const existingIdx = newItems.findIndex((i) => i.variantId === variant.id);
      if (existingIdx >= 0) {
        newItems[existingIdx] = {
          ...newItems[existingIdx],
          delta,
          beforeStock,
          afterStock,
        };
      } else {
        newItems.push({
          productId: product.id,
          productName: product.name,
          variantId: variant.id,
          variantName: buildVariantLabel(product.name, variant),
          sku: variant.sku,
          delta,
          beforeStock,
          afterStock,
        });
      }
      added = true;
    });

    if (added) {
      setPendingItems(newItems);
      setDeltaByVariant((prev) => {
        const next = { ...prev };
        variants.forEach((v) => { delete next[v.id]; });
        return next;
      });
    }
  };

  const removePendingItem = (variantId) => {
    setPendingItems((prev) => prev.filter((i) => i.variantId !== variantId));
  };

  const openConfirm = () => {
    if (pendingItems.length === 0) {
      alert('Chưa có thay đổi nào để lưu.');
      return;
    }
    const invalid = pendingItems.find((i) => i.afterStock < 0);
    if (invalid) {
      alert(`Số lượng không hợp lệ: ${invalid.variantName}`);
      return;
    }
    setConfirmOpen(true);
  };

  const confirmApply = async () => {
    setSubmitting(true);
    try {
      const payload = {
        items: pendingItems.map((item) => ({ variantId: item.variantId, delta: item.delta })),
        note: note.trim(),
      };
      await ProductService.batchAdjustInventory(payload);
      setPendingItems([]);
      setNote('');
      setConfirmOpen(false);
      await fetchInventoryProducts();
      await fetchLogs(0);
    } catch (error) {
      console.error('Adjust inventory failed', error);
      alert(error.response?.data?.message || 'Cập nhật kho thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingStats = useMemo(() => {
    const totalAdjustments = pendingItems.length;
    const totalProducts = new Set(pendingItems.map((i) => i.productId)).size;
    return { totalAdjustments, totalProducts };
  }, [pendingItems]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Kho</h1>
        <p className="text-sm text-gray-500 mt-1">Chọn sản phẩm để điều chỉnh tồn kho, xác nhận nhiều sản phẩm cùng lúc</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Left: Product list */}
        <div className="xl:col-span-3 space-y-3">
          <div className="relative">
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

          {loading && <p className="text-sm text-gray-500 px-2">Đang tải dữ liệu kho...</p>}

          {!loading && filteredProducts.length === 0 && (
            <div className="bg-[#13151e] border border-white/5 rounded-2xl p-6 text-sm text-gray-500 text-center">
              Không tìm thấy sản phẩm.
            </div>
          )}

          {filteredProducts.map((product) => {
            const pid = product.id || product._id;
            const expanded = expandedProductIds.has(pid);
            const variants = product.variantItems || [];

            return (
              <div key={pid} className="bg-[#13151e] border border-white/5 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleProduct(pid)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                >
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">{product.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{product.brand} · {variants.length} phiên bản</p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <p className="text-xs text-gray-500">Tổng tồn kho</p>
                    <p className="text-sm font-bold text-emerald-400">{Number(product.stock || 0)}</p>
                    <svg className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
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
                                className="w-9 h-9 rounded-lg border border-white/10 text-gray-300 hover:text-white hover:border-white/20 transition-all"
                              >−</button>
                              <input
                                type="number"
                                value={deltaByVariant[variantId] ?? ''}
                                onChange={(e) => updateDelta(variantId, e.target.value)}
                                placeholder="0"
                                className="w-full h-9 text-center bg-white/5 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-red-500/50"
                              />
                              <button
                                type="button"
                                onClick={() => adjustDeltaByStep(variantId, 1)}
                                className="w-9 h-9 rounded-lg border border-white/10 text-gray-300 hover:text-white hover:border-white/20 transition-all"
                              >+</button>
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
                        onClick={() => addProductToPending(product)}
                        className="w-full px-4 py-2.5 rounded-xl border border-dashed border-white/10 text-sm text-gray-400 hover:border-red-500/30 hover:text-red-400 transition-all"
                      >
                        + Thêm vào danh sách điều chỉnh
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Pending list + Log history */}
        <div className="xl:col-span-2 space-y-4">

          {/* Ghi chú + Pending */}
          <div className="bg-[#13151e] border border-white/5 rounded-2xl p-4 space-y-4">
            <h3 className="text-sm font-bold text-white">Ghi chú điều chỉnh</h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="VD: kiểm kho cuối ngày, nhập hàng mới..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-red-500/50 resize-none"
            />

            {/* Pending items */}
            {pendingItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-400">Sản phẩm chờ xác nhận</p>
                  <p className="text-[10px] text-gray-500">{pendingStats.totalProducts} sản phẩm · {pendingStats.totalAdjustments} phiên bản</p>
                </div>
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {pendingItems.map((item) => (
                    <div key={item.variantId} className="flex items-center justify-between p-2.5 rounded-xl border border-white/10 bg-white/[0.02]">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-white truncate">{item.variantName}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {item.beforeStock} {item.delta > 0 ? `+${item.delta}` : item.delta} = <span className="text-emerald-400 font-bold">{item.afterStock}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePendingItem(item.variantId)}
                        className="ml-2 w-6 h-6 rounded-full bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 flex items-center justify-center text-sm flex-shrink-0 transition-all"
                      >×</button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={openConfirm}
                  className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-bold text-white transition-all"
                >
                  Xác nhận điều chỉnh
                </button>
              </div>
            )}

            {pendingItems.length === 0 && (
              <p className="text-xs text-gray-600 text-center py-4">Chưa có sản phẩm nào được thêm. Mở rộng sản phẩm, nhập số lượng và nhấn "Thêm vào danh sách".</p>
            )}
          </div>

          {/* Log history */}
          <div className="bg-[#13151e] border border-white/5 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Lịch sử điều chỉnh</h3>
              <button
                type="button"
                onClick={() => fetchLogs(0)}
                className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
              >Làm mới</button>
            </div>

            {loadingLogs && <p className="text-xs text-gray-600 text-center py-3">Đang tải...</p>}

            {!loadingLogs && logs.length === 0 && (
              <p className="text-xs text-gray-600 text-center py-3">Chưa có lịch sử điều chỉnh.</p>
            )}

            {logs.map((log) => {
              const expanded = expandedLogId === log.id;
              return (
                <div key={log.id} className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedLogId(expanded ? null : log.id)}
                    className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="text-left min-w-0">
                      <p className="text-xs font-bold text-white truncate">{log.logCode}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{formatDate(log.createdAt)}</p>
                      {log.note && <p className="text-[10px] text-gray-600 mt-0.5 truncate italic">"{log.note}"</p>}
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-[10px] text-gray-500">{log.totalProducts} sp · {log.totalAdjustments} điều chỉnh</p>
                      <svg className={`w-3 h-3 text-gray-500 ml-auto mt-1 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {expanded && (
                    <div className="border-t border-white/5 px-3 py-2 space-y-1.5">
                      {(log.items || []).map((item) => (
                        <div key={item.variantId} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] text-white truncate">{item.variantName}</p>
                            <p className="text-[10px] text-gray-600">SKU: {item.sku}</p>
                          </div>
                          <p className="text-[11px] font-bold text-emerald-400 flex-shrink-0 ml-2">
                            {item.beforeStock} {item.delta > 0 ? `+${item.delta}` : item.delta} = {item.afterStock}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {logTotalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={logPage === 0}
                  onClick={() => fetchLogs(logPage - 1)}
                  className="px-3 py-1 rounded-lg border border-white/10 text-xs text-gray-400 hover:text-white disabled:opacity-30 transition-all"
                >‹ Trước</button>
                <span className="text-[10px] text-gray-500">{logPage + 1} / {logTotalPages}</span>
                <button
                  type="button"
                  disabled={logPage >= logTotalPages - 1}
                  onClick={() => fetchLogs(logPage + 1)}
                  className="px-3 py-1 rounded-lg border border-white/10 text-xs text-gray-400 hover:text-white disabled:opacity-30 transition-all"
                >Sau ›</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#13151e] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-black text-white">Xác nhận điều chỉnh kho</h3>
              <button onClick={() => setConfirmOpen(false)} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
            </div>

            <div className="px-6 py-4 overflow-y-auto space-y-3">
              {note && (
                <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs text-gray-500 mb-0.5">Ghi chú:</p>
                  <p className="text-sm text-gray-200 italic">{note}</p>
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{pendingStats.totalProducts} sản phẩm</span>
                <span>·</span>
                <span>{pendingStats.totalAdjustments} phiên bản</span>
              </div>

              {pendingItems.map((item) => (
                <div key={item.variantId} className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
                  <p className="text-xs font-bold text-white">{item.variantName}</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {item.beforeStock} {item.delta > 0 ? `+ ${item.delta}` : `- ${Math.abs(item.delta)}`} = <span className="text-emerald-300 font-bold">{item.afterStock}</span>
                  </p>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-white/5 flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-300 hover:text-white transition-all"
              >
                Quay lại
              </button>
              <button
                onClick={confirmApply}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-bold text-white transition-all disabled:opacity-50"
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
