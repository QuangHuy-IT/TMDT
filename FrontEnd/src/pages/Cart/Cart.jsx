/**
 * Cart.jsx — Shopee-style shopping cart
 *
 * Requires (same folder or adjust import paths):
 *   ./CartItem.jsx
 *   ./CartSummary.jsx
 *   ./VoucherSection.jsx
 *
 * Context: ShopContext with { state: { cart, isAuthenticated, user }, dispatch }
 * Dispatch actions used:
 *   UPDATE_CART_QUANTITY  { id, quantity }
 *   REMOVE_FROM_CART      id
 *   CLEAR_CART
 */

import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShopContext } from '../../context/ShopContext';
import CartItem      from './CartItem';
import CartSummary   from './CartSummary';
import VoucherSection from './VoucherSection';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => n.toLocaleString('vi-VN') + '₫';

// ─── Column header ─────────────────────────────────────────────────────────────
const ColHeader = ({ allChecked, onToggleAll, totalItems }) => (
  <div
    className="grid items-center gap-3 px-5 py-3 bg-white border-b border-gray-100"
    style={{ gridTemplateColumns: '44px 1fr 130px 138px 120px 80px' }}
  >
    <div className="flex justify-center">
      <input
        type="checkbox"
        checked={allChecked}
        onChange={(e) => onToggleAll(e.target.checked)}
        className="w-[17px] h-[17px] rounded accent-red-600 cursor-pointer"
      />
    </div>
    <span className="text-[13px] text-gray-500">
      Sản phẩm
      <span className="text-gray-400 ml-1">({totalItems})</span>
    </span>
    <span className="text-[13px] text-gray-500 text-center">Đơn giá</span>
    <span className="text-[13px] text-gray-500 text-center">Số lượng</span>
    <span className="text-[13px] text-gray-500 text-center">Số tiền</span>
    <span className="text-[13px] text-gray-500 text-center">Thao tác</span>
  </div>
);

// ─── Empty state ───────────────────────────────────────────────────────────────
const EmptyCart = () => (
  <div className="flex flex-col items-center justify-center py-24 bg-white">
    <svg className="w-24 h-24 text-gray-200 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3
           2.3c-.6.6-.2 1.7.7 1.7H17m0 0a2 2 0 100 4 2 2 0
           000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
    <p className="text-[15px] font-medium text-gray-500 mb-1">Giỏ hàng của bạn còn trống</p>
    <p className="text-[13px] text-gray-400 mb-7">Hãy khám phá và thêm sản phẩm bạn yêu thích!</p>
    <Link
      to="/"
      className="px-8 py-2.5 bg-red-600 text-white text-[14px] font-medium
                 rounded hover:bg-red-700 active:scale-[0.98] transition-all"
    >
      Mua ngay
    </Link>
  </div>
);

// ─── Main Cart ─────────────────────────────────────────────────────────────────
export const Cart = () => {
  const { state, dispatch } = useContext(ShopContext);
  const { cart, isAuthenticated } = state;
  const navigate  = useNavigate();
  const location  = useLocation();

  // ── Auth guard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated)
      navigate('/login', { state: { from: location }, replace: true });
  }, [isAuthenticated, navigate, location]);

  // ── Stable cartId (handles both id and _id schema) ───────────────────────────
  const enriched = cart.map((item) => ({
    ...item,
    cartId: item.id || item._id,
  }));

  // ── Selection state ──────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  // Prune stale ids when cart items are removed
  useEffect(() => {
    const valid = new Set(enriched.map((i) => i.cartId));
    setSelectedIds((prev) => new Set([...prev].filter((id) => valid.has(id))));
  }, [cart]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isAuthenticated) return null;

  // ── Derived values ───────────────────────────────────────────────────────────
  const allChecked  = enriched.length > 0 && enriched.every((i) => selectedIds.has(i.cartId));
  const selected    = enriched.filter((i) => selectedIds.has(i.cartId));
  const selectedQty = selected.reduce((s, i) => s + i.quantity, 0);
  const grandTotal  = selected.reduce((s, i) => s + i.price * i.quantity, 0);

  // Group by brand for shop-style sections
  const brands = [...new Set(enriched.map((i) => i.brand))];

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleToggleAll = (checked) =>
    setSelectedIds(checked ? new Set(enriched.map((i) => i.cartId)) : new Set());

  const handleToggleBrand = (brand, checked) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      enriched
        .filter((i) => i.brand === brand)
        .forEach((i) => (checked ? next.add(i.cartId) : next.delete(i.cartId)));
      return next;
    });

  const handleToggleItem = (cartId, checked) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      checked ? next.add(cartId) : next.delete(cartId);
      return next;
    });

  const handleQtyChange = (cartId, quantity) =>
    dispatch({ type: 'UPDATE_CART_QUANTITY', payload: { id: cartId, quantity } });

  const handleRemove = (cartId) =>
    dispatch({ type: 'REMOVE_FROM_CART', payload: cartId });

  const handleDeleteSelected = () => {
    if (!selectedIds.size) {
      alert('Vui lòng chọn sản phẩm muốn xóa.');
      return;
    }
    if (window.confirm('Xóa các sản phẩm đã chọn?')) {
      selectedIds.forEach((id) => dispatch({ type: 'REMOVE_FROM_CART', payload: id }));
      setSelectedIds(new Set());
    }
  };

  const handleCheckout = () => {
    if (!selectedIds.size) {
      alert('Vui lòng chọn ít nhất 1 sản phẩm.');
      return;
    }
    navigate('/checkout');
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-3">

        {/* ── Page title ── */}
        <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-2">
          <Link to="/" className="hover:text-red-600 transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">Giỏ hàng</span>
          {cart.length > 0 && (
            <span className="text-gray-400">({cart.length} sản phẩm)</span>
          )}
        </div>

        {cart.length === 0 ? (
          /* ── Empty state ── */
          <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm bg-white">
            <EmptyCart />
          </div>
        ) : (
          <>
            {/* ── Cart table ── */}
            <div className="rounded-[28px] border border-gray-100 overflow-hidden bg-white shadow-sm">
              {/* Column header */}
              <ColHeader
                allChecked={allChecked}
                onToggleAll={handleToggleAll}
                totalItems={enriched.length}
              />

              {/* Brand-grouped rows */}
              {brands.map((brand) => {
                const brandItems  = enriched.filter((i) => i.brand === brand);
                const brandChecked = brandItems.every((i) => selectedIds.has(i.cartId));

                return (
                  <div key={brand}>
                    {/* Shop / brand sub-header */}
                    <div className="flex items-center gap-2.5 px-5 py-2.5 bg-red-50 border-b border-gray-100">
                      <input
                        type="checkbox"
                        checked={brandChecked}
                        onChange={(e) => handleToggleBrand(brand, e.target.checked)}
                        className="w-[17px] h-[17px] rounded accent-red-600 cursor-pointer"
                      />
                      <div className="flex items-center gap-1.5 text-[13px] font-semibold text-red-600">
                        {/* Store icon */}
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="2">
                          <circle cx="9" cy="21" r="1" />
                          <circle cx="20" cy="21" r="1" />
                          <path d="M1 1h4l2.68 13.39a2 2 0 001.98 1.61h9.72a2 2 0 001.98-1.61L23 6H6" />
                        </svg>
                        {brand}
                      </div>
                    </div>

                    {/* Items */}
                    {brandItems.map((item) => (
                      <CartItem
                        key={item.cartId}
                        item={item}
                        checked={selectedIds.has(item.cartId)}
                        onToggle={(checked) => handleToggleItem(item.cartId, checked)}
                        onQtyChange={(qty) => handleQtyChange(item.cartId, qty)}
                        onRemove={() => handleRemove(item.cartId)}
                      />
                    ))}
                  </div>
                );
              })}
            </div>

            {/* ── Voucher section ── */}
            <VoucherSection
              onApply={(code) => {
                if (code) console.log('[Voucher applied]', code);
              }}
            />

            {/* ── Order summary card (above sticky bar) ── */}
            <div className="bg-white rounded-[28px] border border-gray-100 px-6 py-5 shadow-sm">
              <div className="flex items-center justify-between text-[13.5px] text-gray-500 mb-2">
                <span>Tạm tính ({selectedQty} sản phẩm)</span>
                <span className="font-medium text-gray-700">{fmt(grandTotal)}</span>
              </div>
              <div className="flex items-center justify-between text-[13.5px] text-gray-500 mb-2">
                <span>Phí vận chuyển</span>
                <span className="text-green-600 font-medium">Miễn phí</span>
              </div>
              <div className="flex items-center justify-between text-[13.5px] text-gray-500 mb-3">
                <span>Giảm giá voucher</span>
                <span className="text-red-600 font-medium">−0₫</span>
              </div>
              <div className="border-t border-dashed border-gray-200 pt-3 flex items-center justify-between">
                <span className="text-[14px] font-semibold text-gray-800">Tổng cộng</span>
                <span className="text-[20px] font-bold text-red-600">{fmt(grandTotal)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Sticky footer ── */}
      {cart.length > 0 && (
        <CartSummary
          allChecked={allChecked}
          totalItems={enriched.length}
          selectedQty={selectedQty}
          grandTotal={grandTotal}
          onToggleAll={handleToggleAll}
          onDeleteSelected={handleDeleteSelected}
          onCheckout={handleCheckout}
        />
      )}
    </div>
  );
};
