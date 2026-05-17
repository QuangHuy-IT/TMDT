import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import ProductService from '../services/productService';
import ReviewSection from '../components/review/ReviewSection';

const inferColorHex = (value) => {
  const normalized = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (normalized.includes('den')) return '#111827';
  if (normalized.includes('trang') || normalized.includes('white')) return '#f3f4f6';
  if (normalized.includes('xanh')) return '#2563eb';
  if (normalized.includes('do') || normalized.includes('red')) return '#dc2626';
  if (normalized.includes('vang') || normalized.includes('gold')) return '#ca8a04';
  if (normalized.includes('bac') || normalized.includes('silver')) return '#9ca3af';
  if (normalized.includes('tim') || normalized.includes('purple')) return '#7c3aed';
  if (normalized.includes('hong') || normalized.includes('pink')) return '#ec4899';
  return '#6b7280';
};

const normalizeProduct = (raw, fallbackId) => {
  if (!raw || typeof raw !== 'object') return null;

  let images = [];
  if (Array.isArray(raw.images)) {
    images = raw.images.filter(Boolean);
  }
  if (images.length === 0 && raw.thumbnailUrl && raw.thumbnailUrl.trim()) {
    images = [raw.thumbnailUrl];
  }

  const variantItems = Array.isArray(raw.variants) ? raw.variants
    : Array.isArray(raw.variantItems) ? raw.variantItems : [];

  const variantOptions = raw.variantOptions && typeof raw.variantOptions === 'object'
    ? raw.variantOptions : {};

  const relatedProducts = Array.isArray(raw.relatedProducts) ? raw.relatedProducts : [];

  const storages = Array.isArray(variantOptions.storages) ? variantOptions.storages : [];
  const basePrices = variantOptions.basePrices || {};

  const colors = [];
  const colorSet = new Set();
  variantItems.forEach(item => {
    if (item.color && !colorSet.has(item.color)) {
      colorSet.add(item.color);
      colors.push({ name: item.color, hex: inferColorHex(item.color) });
    }
  });

  const fallbackStock = variantItems.reduce((sum, item) => sum + Number(item?.stock || 0), 0);
  const stock = Number(raw.stock ?? fallbackStock ?? 0);

  return {
    ...raw,
    id: raw.id || raw._id || fallbackId,
    images,
    price: Number(raw.price || 0),
    stock,
    baseName: raw.baseName || raw.name || '',
    variantItems,
    relatedProducts,
    variants: {
      storages,
      colors,
      basePrices,
    },
    specifications: raw.specifications && typeof raw.specifications === 'object'
      ? raw.specifications : {},
  };
};

export const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch } = useContext(ShopContext);
  const { isAuthenticated } = state;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // UI state (NOT tied to product.id to avoid resets during renders)
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedStorage, setSelectedStorage] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchDetail = async () => {
      setLoading(true);
      setError('');
      setActiveImage(0);
      setQuantity(1);
      setSelectedStorage(null);
      setSelectedColor(null);

      try {
        const response = await ProductService.getProductDetail(slug);
        if (!mounted) return;
        const normalized = normalizeProduct(response.data, slug);
        setProduct(normalized);
      } catch (e) {
        if (!mounted) return;
        setError('Không tải được thông tin sản phẩm.');
        setProduct(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDetail();
    return () => { mounted = false; };
  }, [slug]);

  // Initialize selections when product data changes
  useEffect(() => {
    if (!product) return;
    const storages = product.variants?.storages || [];
    const colors = product.variants?.colors || [];
    setSelectedStorage(storages.length > 0 ? storages[0] : null);
    setSelectedColor(colors.length > 0 ? colors[0] : null);
  }, [product?.baseName]); // Only re-init when baseName changes (i.e., navigating to a different product line)

  const images = product?.images || [];

  // Current price based on selected storage
  const currentPrice = useMemo(() => {
    if (!product) return 0;
    if (product.isFlashSale && product.flashSalePrice != null) {
      return Number(product.flashSalePrice);
    }
    if (selectedStorage && product.variants?.basePrices?.[selectedStorage] != null) {
      return Number(product.variants.basePrices[selectedStorage]);
    }
    return Number(product.price || 0);
  }, [product, selectedStorage]);

  // Find the "active" variant: matches selectedStorage AND selectedColor
  // Search across ALL variants: current product's variantItems + relatedProducts
  const allVariants = useMemo(() => [
    ...(product?.variantItems || []),
    ...(product?.relatedProducts || []).flatMap(p => p.variantItems || p.variants || []),
  ], [product]);

  const activeVariant = useMemo(() => {
    if (!allVariants.length) return null;
    return allVariants.find(v => {
      const matchStorage = v.storageLabel === selectedStorage;
      const matchColor = !selectedColor || !v.color
        || v.color.toLowerCase() === selectedColor.name.toLowerCase();
      return matchStorage && matchColor;
    }) || allVariants.find(v => v.storageLabel === selectedStorage)
      || allVariants[0] || null;
  }, [allVariants, selectedStorage, selectedColor]);

  // Available colors for the selected storage (across all variants)
  const availableColors = useMemo(() => {
    if (!allVariants.length || !selectedStorage) return product?.variants?.colors || [];
    const colorsForStorage = [];
    const seen = new Set();
    allVariants.forEach(v => {
      if (v.storageLabel === selectedStorage && v.color && !seen.has(v.color)) {
        seen.add(v.color);
        colorsForStorage.push({ name: v.color, hex: inferColorHex(v.color) });
      }
    });
    return colorsForStorage.length > 0 ? colorsForStorage : (product?.variants?.colors || []);
  }, [allVariants, selectedStorage, product]);

  // If selected color not available for this storage, auto-select the first available
  useEffect(() => {
    if (!product || availableColors.length === 0) return;
    const colorAvailable = availableColors.some(c =>
      c.name.toLowerCase() === selectedColor?.name?.toLowerCase()
    );
    if (!colorAvailable) {
      setSelectedColor(availableColors[0]);
    }
  }, [availableColors]);

  // Max stock for current variant
  const maxQuantity = useMemo(() => {
    if (activeVariant?.stock != null) return Math.max(1, Number(activeVariant.stock));
    if (product?.stock != null) return Math.max(1, Number(product.stock));
    return 1;
  }, [activeVariant, product]);

  const addToCart = () => {
    if (!product) return;

    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }

    if (maxQuantity <= 0) return;

    dispatch({
      type: 'ADD_TO_CART',
      payload: {
        ...product,
        variantId: activeVariant?.id || null,
        id: String(product.id),
        quantity,
        price: currentPrice,
        ram: activeVariant?.ramGb ? `${activeVariant.ramGb}GB` : '',
        storage: activeVariant?.storageLabel || selectedStorage || '',
        color: selectedColor?.name || '',
        sku: activeVariant?.sku || '',
        images: product.images,
      },
    });
  };

  // Navigate to different storage variant
  const switchStorage = (storage) => {
    if (!product) return;
    const target = [...(product.variantItems || []), ...(product.relatedProducts || [])]
      .find(v => v.storageLabel === storage);
    if (target?.slug) {
      navigate(`/products/${target.slug}`);
    } else {
      setSelectedStorage(storage);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-gray-50">
        <p className="text-sm font-bold text-gray-500">Đang tải chi tiết sản phẩm...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <h2 className="text-2xl font-black text-gray-800">Không tìm thấy sản phẩm</h2>
        <p className="mt-2 text-sm text-gray-500">{error || 'Sản phẩm không tồn tại hoặc đã bị xóa.'}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-700"
        >
          Về trang chủ
        </button>
      </div>
    );
  }

  const displayName = product.name || product.baseName || 'Sản phẩm';
  const hasMultipleStorages = (product.variants?.storages?.length || 0) > 1;

  return (
    <main className="min-h-screen bg-[#f8f8f6] pb-20">
      <div className="mx-auto max-w-6xl px-4 pt-8">
        <nav className="mb-6 flex items-center gap-2 text-xs text-gray-400">
          <button onClick={() => navigate('/')} className="hover:text-red-600">Trang chủ</button>
          <span>/</span>
          <button onClick={() => navigate(`/brands/${product.brandSlug || product.brand}`)}
            className="hover:text-red-600">{product.brand || 'Khác'}</button>
          <span>/</span>
          <span className="text-gray-700">{displayName}</span>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* ===== LEFT: Image Gallery ===== */}
          <section className="space-y-3">
            <div className="relative rounded-2xl border border-gray-100 bg-white overflow-hidden">
              <div className="relative aspect-square flex items-center justify-center overflow-hidden bg-gray-50">
                <img
                  src={images[activeImage] && images[activeImage].trim()
                    ? images[activeImage]
                    : 'https://picsum.photos/seed/fallback/700/700'}
                  alt={product.name}
                  className="h-full w-full object-contain"
                  onError={(e) => { e.currentTarget.src = 'https://picsum.photos/seed/fallback/700/700'; }}
                />

                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImage((i) => (i - 1 + images.length) % images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-lg hover:bg-white"
                      aria-label="Ảnh trước"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M10 12L6 8l4-4" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => setActiveImage((i) => (i + 1) % images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-lg hover:bg-white"
                      aria-label="Ảnh sau"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M6 12l4-4-4-4" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </>
                )}

                {images.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImage(idx)}
                        className={`h-1.5 rounded-full transition-all ${activeImage === idx ? 'w-5 bg-red-500' : 'w-1.5 bg-white/60'}`}
                        aria-label={`Ảnh ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    onClick={() => setActiveImage(index)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${activeImage === index ? 'border-red-500' : 'border-gray-200'}`}
                  >
                    <img src={image} alt={`Thumb ${index + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4">
              <h2 className="mb-2 text-sm font-black uppercase tracking-wide text-gray-900">Mô tả</h2>
              {product.description ? (
                <div
                  className="prose prose-sm max-w-none text-sm leading-relaxed text-gray-600 [&_img]:rounded-lg [&_img]:max-w-full [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-bold [&_h3]:text-sm [&_h3]:font-bold [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-red-600 [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              ) : (
                <p className="text-sm leading-relaxed text-gray-500">Sản phẩm đang được cập nhật mô tả.</p>
              )}
            </div>

            {/* Specifications */}
            {Object.keys(product.specifications || {}).length > 0 && (
              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-gray-900">Thông số kỹ thuật</h2>
                <div className="space-y-2">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-4 border-b border-gray-100 pb-2 text-sm last:border-0 last:pb-0">
                      <span className="text-gray-500">{key}</span>
                      <span className="text-right font-medium text-gray-800">{String(value || '')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ===== RIGHT: Product Info + Variants ===== */}
          <section className="space-y-5">
            {/* Brand + Stock badge */}
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-red-600">
                {product.brand || 'Khác'}
              </span>
              <span className={`text-[11px] font-bold uppercase ${
                maxQuantity > 0 ? 'text-green-600' : 'text-red-500'
              }`}>
                {maxQuantity > 0 ? `Còn ${maxQuantity} sản phẩm` : 'Hết hàng'}
              </span>
            </div>

            <h1 className="text-3xl font-black text-gray-900">{displayName}</h1>

            {/* Price */}
            <div>
              {product.isFlashSale && product.flashSalePrice != null && (
                <p className="text-sm text-gray-400 line-through mb-0.5">
                  {Number(product.price || 0).toLocaleString('vi-VN')}₫
                </p>
              )}
              <p className="text-3xl font-black text-red-600">
                {Number(currentPrice || 0).toLocaleString('vi-VN')}₫
              </p>
              {product.isFlashSale && product.sale > 0 && (
                <span className="mt-1 inline-block rounded bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">
                  -{product.sale}%
                </span>
              )}
            </div>

            {/* ===== Storage Variant Buttons ===== */}
            {hasMultipleStorages && (
              <div>
                <p className="mb-3 text-xs font-bold uppercase text-gray-500">Phiên bản</p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.storages.map((storage) => {
                    const storagePrice = product.variants.basePrices?.[storage];
                    const isActive = storage === selectedStorage;
                    const existsInRelated = product.relatedProducts?.some(
                      p => (p.variants?.[0] || p.variantItems?.[0])?.storageLabel === storage
                        && p.id !== product.id
                    );
                    const productOfStorage = [...(product.variantItems || []), ...(product.relatedProducts || [])]
                      .find(v => v.storageLabel === storage);
                    const canNavigate = isActive || existsInRelated;

                    return (
                      <button
                        key={storage}
                        onClick={() => {
                          if (!isActive && productOfStorage?.slug) {
                            navigate(`/products/${productOfStorage.slug}`);
                          } else {
                            switchStorage(storage);
                          }
                        }}
                        className={`relative rounded-xl border px-4 py-2.5 text-sm font-bold transition-all ${
                          isActive
                            ? 'border-red-500 bg-red-50 text-red-600 shadow-sm'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <span className="block text-base">{storage}</span>
                        {storagePrice != null && (
                          <span className={`block text-xs font-normal ${isActive ? 'text-red-400' : 'text-gray-400'}`}>
                            {Number(storagePrice).toLocaleString('vi-VN')}₫
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ===== Color Buttons ===== */}
            {availableColors.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-bold uppercase text-gray-500">
                  Màu sắc
                  {selectedColor && (
                    <span className="ml-2 font-normal normal-case text-gray-600">— {selectedColor.name}</span>
                  )}
                </p>
                <div className="flex flex-wrap gap-3">
                  {availableColors.map((color) => {
                    const isActive = selectedColor?.name?.toLowerCase() === color.name.toLowerCase();
                    return (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(color)}
                        title={color.name}
                        className={`h-11 w-11 rounded-full border-2 transition-all ${
                          isActive ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-900' : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: color.hex || '#6b7280' }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* ===== Storage note when only one storage ===== */}
            {!hasMultipleStorages && selectedStorage && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Phiên bản {selectedStorage}</span>
                {activeVariant?.ramGb && <span className="text-gray-400">| {activeVariant.ramGb}GB RAM</span>}
              </div>
            )}

            {/* ===== Add to Cart ===== */}
            <div className="flex items-center gap-3">
              <div className="flex items-center overflow-hidden rounded-xl border border-gray-200">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="h-11 w-11 text-lg font-black text-gray-500 hover:text-red-600"
                >
                  −
                </button>
                <span className="w-14 text-center font-bold text-lg">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                  className="h-11 w-11 text-lg font-black text-gray-500 hover:text-red-600"
                >
                  +
                </button>
              </div>

              <button
                onClick={addToCart}
                disabled={maxQuantity <= 0}
                className="flex-1 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300 transition-all"
              >
                {maxQuantity > 0 ? 'Thêm vào giỏ hàng' : 'Hết hàng'}
              </button>
            </div>

            {/* Flash Sale badge */}
            {product.isFlashSale && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                🔥 Đang diễn ra Flash Sale — Giảm đến {product.sale}%
              </div>
            )}
          </section>
        </div>
      </div>

      <ReviewSection productId={product.id} currentUserId={state.user?.id || null} />

      {/* Related Products (other variants in same product line) */}
      {(product.relatedProducts?.length || 0) > 0 && (
        <div className="mx-auto max-w-6xl px-4 pt-8">
          <h2 className="mb-4 text-lg font-black text-gray-900">Các phiên bản khác</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {product.relatedProducts.map((related) => {
              const variant = related.variants?.[0] || related.variantItems?.[0];
              const thumb = related.thumbnailUrl || (related.images?.[0]) || '';
              const relatedPrice = related.price || variant?.price || 0;
              const isCurrentVariant = variant?.storageLabel === selectedStorage;
              return (
                <button
                  key={related.id}
                  onClick={() => navigate(`/products/${related.slug}`)}
                  className={`rounded-2xl border bg-white p-3 text-left transition-all hover:border-red-300 hover:shadow-md ${
                    isCurrentVariant ? 'opacity-40 cursor-default' : ''
                  }`}
                  disabled={isCurrentVariant}
                >
                  <div className="aspect-square mb-2 flex items-center justify-center overflow-hidden rounded-xl bg-gray-50">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={related.name}
                        className="h-full w-full object-contain"
                        onError={(e) => { e.target.src = 'https://picsum.photos/seed/rel/200/200'; }}
                      />
                    ) : (
                      <div className="text-gray-300 text-xs">No image</div>
                    )}
                  </div>
                  <p className="mb-1 text-xs font-medium text-gray-700 line-clamp-2">{related.name}</p>
                  <p className="text-sm font-bold text-red-600">{Number(relatedPrice).toLocaleString('vi-VN')}₫</p>
                  {variant?.storageLabel && (
                    <p className="mt-0.5 text-[10px] text-gray-400">{variant.storageLabel}</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
};
