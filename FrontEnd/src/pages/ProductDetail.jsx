import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import ProductService from '../services/productService';
import ReviewSection from '../components/review/ReviewSection';
import QuestionSection from '../components/question/QuestionSection';
import { ProductSpecificationsTab } from '../components/product/ProductSpecificationsTab';

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

const formatVariantName = (productName, variant) => {
  const baseName = productName || 'Sản phẩm';
  if (!variant) return baseName;

  const parts = [];
  if (variant.ramGb != null && String(variant.ramGb).trim() !== '') {
    parts.push(`${variant.ramGb}GB`);
  }
  if (variant.storageLabel != null && String(variant.storageLabel).trim() !== '') {
    parts.push(String(variant.storageLabel).trim());
  }

  return parts.length > 0 ? `${baseName} ${parts.join('/')}` : baseName;
};

const formatVariantPrice = (price) => Number(price || 0).toLocaleString('vi-VN') + '₫';

const getVersionGroupKey = (variant) => {
  if (!variant) return 'default|default';
  const ramKey = variant.ramGb != null && String(variant.ramGb).trim() !== ''
    ? String(variant.ramGb).trim()
    : 'default';
  const storageKey = variant.storageLabel != null && String(variant.storageLabel).trim() !== ''
    ? String(variant.storageLabel).trim().toLowerCase()
    : 'default';
  return `${ramKey}|${storageKey}`;
};

const getVersionLabel = (variant) => {
  if (!variant) return 'Mặc định';
  const parts = [];
  if (variant.ramGb != null && String(variant.ramGb).trim() !== '') {
    parts.push(`${variant.ramGb}GB`);
  }
  if (variant.storageLabel != null && String(variant.storageLabel).trim() !== '') {
    parts.push(String(variant.storageLabel).trim());
  }
  return parts.length > 0 ? parts.join('/') : 'Mặc định';
};

/**
 * Normalize API response to unified structure.
 *
 * New backend response:
 *   {
 *     id, name, brand, brandSlug, description, images, thumbnailUrl, specifications,
 *     variantOptions: { storages: [...], colors: [...], basePrices: {...} },
 *     variants: [...all variants...],
 *     selectedVariant: {...current variant...},
 *     selectedVariant.slug = URL slug for this variant
 *   }
 */
const normalizeProduct = (raw) => {
  if (!raw || typeof raw !== 'object') return null;

  let images = [];
  if (Array.isArray(raw.images)) {
    images = raw.images.filter(Boolean);
  }
  if (images.length === 0 && raw.thumbnailUrl && raw.thumbnailUrl.trim()) {
    images = [raw.thumbnailUrl];
  }

  const allVariants = Array.isArray(raw.variants) ? raw.variants : [];
  const variantOptions = raw.variantOptions && typeof raw.variantOptions === 'object'
    ? raw.variantOptions : {};
  const selectedVariant = raw.selectedVariant && typeof raw.selectedVariant === 'object'
    ? raw.selectedVariant : null;

  const storages = Array.isArray(variantOptions.storages) ? variantOptions.storages : [];
  const basePrices = variantOptions.basePrices || {};

  // Build color images map: { colorName: imageUrl }
  const colorImages = {};
  if (Array.isArray(variantOptions.colors)) {
    variantOptions.colors.forEach(c => {
      if (c?.name && c?.imageUrl && c.imageUrl.trim()) {
        colorImages[c.name.toLowerCase()] = c.imageUrl;
      }
    });
  }

  const totalStock = allVariants.reduce((sum, v) => sum + Number(v?.stock || 0), 0);

  return {
    ...raw,
    id: raw.id,
    name: raw.name || 'Sản phẩm',
    images,
    stock: totalStock,
    specifications: raw.specifications && typeof raw.specifications === 'object'
      ? raw.specifications : {},
    groupedSpecifications: raw.groupedSpecifications && typeof raw.groupedSpecifications === 'object'
      ? raw.groupedSpecifications : {},
    allVariants,
    variantOptions,
    selectedVariant,
    storages,
    basePrices,
    colorImages,
  };
};

export const ProductDetail = () => {
  const { slug } = useParams();  // slug = variant slug, e.g., "iphone-17-pro-max-8gb-256gb-black"
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { state, dispatch } = useContext(ShopContext);
  const { isAuthenticated } = state;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // UI state
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedColorImageOverride, setSelectedColorImageOverride] = useState(null);
  const productIdParam = searchParams.get('product_id');

  useEffect(() => {
    let mounted = true;

    const fetchDetail = async () => {
      setLoading(true);
      setError('');
        setActiveImage(0);
        setQuantity(1);

      try {
        // slug here IS the variant slug
        const response = await ProductService.getProductDetail(slug);
        if (!mounted) return;
        const normalized = normalizeProduct(response.data);
        setProduct(normalized);

        // Read ?product_id from URL and switch color if present
        if (productIdParam && normalized?.allVariants) {
          const targetVariant = normalized.allVariants.find(v => String(v.id) === productIdParam);
          if (targetVariant?.slug && targetVariant.slug !== slug) {
            navigate(`/products/${targetVariant.slug}`, { replace: true });
          }
        }
      } catch {
        if (!mounted) return;
        setError('Không tải được thông tin sản phẩm.');
        setProduct(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDetail();
    return () => { mounted = false; };
  }, [slug, searchParams, productIdParam]);

  // Derived state
  const selectedVariant = product?.selectedVariant || null;

  // Current price from selected variant
  const currentPrice = useMemo(() => {
    if (!product) return 0;
    if (product.isFlashSale && product.flashSalePrice != null) {
      return Number(product.flashSalePrice);
    }
    if (selectedVariant?.price != null) {
      return Number(selectedVariant.price);
    }
    return Number(product.price || 0);
  }, [product, selectedVariant]);

  // Stock from selected variant
  const maxQuantity = useMemo(() => {
    if (selectedVariant?.stock != null) return Math.max(1, Number(selectedVariant.stock));
    if (product?.stock != null) return Math.max(1, Number(product.stock));
    return 1;
  }, [selectedVariant, product]);

  // Original price (before discount)
  const originalPrice = useMemo(() => {
    if (selectedVariant?.compareAtPrice != null) return Number(selectedVariant.compareAtPrice);
    if (product?.originalPrice != null) return Number(product.originalPrice);
    if (selectedVariant?.price != null) return Number(selectedVariant.price);
    return 0;
  }, [product, selectedVariant]);

  const versionOptions = useMemo(() => {
    if (!product?.allVariants?.length) return [];

    const groups = new Map();
    product.allVariants.forEach((variant) => {
      const key = getVersionGroupKey(variant);
      const existing = groups.get(key);
      const variantStock = Number(variant?.stock || 0);

      if (!existing) {
        groups.set(key, {
          key,
          label: getVersionLabel(variant),
          ramGb: variant.ramGb || null,
          storageLabel: variant.storageLabel || '',
          slug: variant.slug,
          price: variant.price || 0,
          stock: variantStock,
          variants: [variant],
        });
        return;
      }

      existing.variants.push(variant);
      existing.stock += variantStock;
      if (!existing.slug) existing.slug = variant.slug;
      if (!existing.price || Number(variant.price || 0) < Number(existing.price || 0)) {
        existing.price = variant.price || 0;
      }
    });

    return Array.from(groups.values()).sort((a, b) => {
      const aRam = Number(a.ramGb || 0);
      const bRam = Number(b.ramGb || 0);
      if (aRam !== bRam) return aRam - bRam;
      return String(a.storageLabel || '').localeCompare(String(b.storageLabel || ''), 'vi');
    });
  }, [product?.allVariants]);

  const activeVersionKey = useMemo(() => getVersionGroupKey(selectedVariant), [selectedVariant]);

  const activeVersion = useMemo(() => {
    if (!versionOptions.length) return null;
    return versionOptions.find((option) => option.key === activeVersionKey) || versionOptions[0];
  }, [versionOptions, activeVersionKey]);

  // Available colors for the selected version group
  const availableColors = useMemo(() => {
    if (!product?.allVariants || !activeVersion) return [];
    const versionKey = activeVersion.key;
    const seen = new Set();
    const colors = [];
    product.allVariants.forEach(v => {
      if (getVersionGroupKey(v) === versionKey && v.color && !seen.has(v.color.toLowerCase())) {
        seen.add(v.color.toLowerCase());
        const colorNameLower = v.color.toLowerCase();
        const colorImage = product.colorImages?.[colorNameLower] || v.colorImageUrl || null;
        colors.push({ name: v.color, hex: inferColorHex(v.color), imageUrl: colorImage });
      }
    });
    return colors;
  }, [product, activeVersion]);

  // Selected color state (synced with selectedVariant)
  const [selectedColor, setSelectedColor] = useState(null);
  useEffect(() => {
    if (selectedVariant?.color) {
      const colorNameLower = selectedVariant.color.toLowerCase();
      const colorImage = product?.colorImages?.[colorNameLower] || selectedVariant.colorImageUrl || null;
      setSelectedColor({ name: selectedVariant.color, hex: inferColorHex(selectedVariant.color), imageUrl: colorImage });
    }
  }, [product, selectedVariant?.id]);

  const selectedColorImage = useMemo(() => {
    if (selectedColorImageOverride) return selectedColorImageOverride;
    if (!product || !productIdParam || !product?.allVariants) return null;
    const targetVariant = product.allVariants.find(v => String(v.id) === productIdParam);
    if (!targetVariant?.color) return null;
    const colorNameLower = targetVariant.color.toLowerCase();
    return product.colorImages?.[colorNameLower] || targetVariant.colorImageUrl || null;
  }, [product, productIdParam, selectedColorImageOverride]);

  // When a color image is available, jump to it after the gallery images are ready
  useEffect(() => {
    if (!selectedColorImage || !product?.images) return;
    const allImages = product.images;
    const thumbnail = product.thumbnailUrl;
    let gallery = allImages;
    if (thumbnail && allImages.length > 0 && allImages[0] === thumbnail) {
      gallery = allImages.slice(1);
    }
    const filtered = gallery.filter(img => img !== selectedColorImage);
    const colorImageIndex = filtered.length; // color image is appended at the end
    setActiveImage(colorImageIndex);
  }, [selectedColorImage, product?.images, product?.thumbnailUrl]);

  // Dynamic gallery:
  // - Gallery images (product.images) — exclude thumbnail from front to avoid duplication
  // - When a variant has a color image, it's always appended to the end of the gallery
  // - Thumbnails strip uses this array; main display uses galleryImages[0]
  const galleryImages = useMemo(() => {
    const allImages = product?.images || [];
    const thumbnail = product?.thumbnailUrl;

    // Remove thumbnail from front of gallery to avoid showing it twice
    let gallery = allImages;
    if (thumbnail && allImages.length > 0 && allImages[0] === thumbnail) {
      gallery = allImages.slice(1);
    }

    // Append color image to the END when user actively selected a color with an image
    if (selectedColorImage) {
      // Avoid duplicate if somehow already in gallery
      const filtered = gallery.filter(img => img !== selectedColorImage);
      return [...filtered, selectedColorImage];
    }

    return gallery;
  }, [product?.images, product?.thumbnailUrl, selectedColorImage]);

  const images = galleryImages;

  // Derived display name for the selected variant - MUST be declared before addToCart
  const displayName = formatVariantName(product?.name, selectedVariant);

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
        variantId: selectedVariant?.id || null,
        slug: selectedVariant?.slug || slug || product.slug || product.productSlug || '',
        variantSlug: selectedVariant?.slug || '',
        id: String(selectedVariant?.id || product.id),
        productId: String(product.id),
        cartKey: String(selectedVariant?.id || selectedVariant?.slug || selectedVariant?.storageLabel || selectedVariant?.color || product.id),
        name: displayName,
        quantity,
        price: currentPrice,
        originalPrice,
        ram: selectedVariant?.ramGb ? `${selectedVariant.ramGb}GB` : '',
        storage: selectedVariant?.storageLabel || '',
        color: selectedColor?.name || selectedVariant?.color || '',
        sku: selectedVariant?.sku || '',
        thumbnailUrl: product.thumbnailUrl || '',
        images: product.images,
        brand: product.brand || '',
      },
    });
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
        <button onClick={() => navigate('/')}
          className="mt-6 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-700">
          Về trang chủ
        </button>
      </div>
    );
  }

  const hasMultipleVersions = (versionOptions?.length || 0) > 1;
  const selectedVersionLabel = activeVersion?.label || getVersionLabel(selectedVariant);

  return (
    <main className="min-h-screen bg-[#f8f8f6] pb-20">
      <div className="mx-auto max-w-6xl px-4 pt-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-gray-400">
          <button onClick={() => navigate('/')} className="hover:text-red-600">Trang chủ</button>
          <span>/</span>
          <button onClick={() => navigate(`/brands/${product.brandSlug || product.brand}`)}
            className="hover:text-red-600">{product.brand || 'Khác'}</button>
          <span>/</span>
          <span className="text-gray-700">{displayName}</span>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

          {/* LEFT: Image Gallery */}
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
                    <button onClick={() => setActiveImage((i) => (i - 1 + images.length) % images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-lg hover:bg-white"
                      aria-label="Ảnh trước">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M10 12L6 8l4-4" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button onClick={() => setActiveImage((i) => (i + 1) % images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-lg hover:bg-white"
                      aria-label="Ảnh sau">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M6 12l4-4-4-4" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </>
                )}

                {images.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, idx) => (
                      <button key={idx} onClick={() => setActiveImage(idx)}
                        className={`h-1.5 rounded-full transition-all ${activeImage === idx ? 'w-5 bg-red-500' : 'w-1.5 bg-white/60'}`}
                        aria-label={`Ảnh ${idx + 1}`} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {images.map((image, index) => (
                  <button key={`${image}-${index}`} onClick={() => setActiveImage(index)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${activeImage === index ? 'border-red-500' : 'border-gray-200'}`}>
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
          </section>

          {/* RIGHT: Product Info */}
          <section className="space-y-5">
            {/* Brand + Stock badge */}
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-red-600">
                {product.brand || 'Khác'}
              </span>
              <span className={`text-[11px] font-bold uppercase ${maxQuantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {maxQuantity > 0 ? `Còn ${maxQuantity} sản phẩm` : 'Hết hàng'}
              </span>
            </div>

            <h1 className="text-3xl font-black text-gray-900">{displayName}</h1>

            {/* Price */}
            <div>
              {/* Hiển thị giá gốc khi có giảm giá sản phẩm */}
              {product.sale > 0 && (
                <p className="text-sm text-gray-400 line-through mb-0.5">
                  {Number(selectedVariant?.compareAtPrice || product.originalPrice || 0).toLocaleString('vi-VN')}₫
                </p>
              )}
              <p className="text-3xl font-black text-red-600">
                {Number(currentPrice || 0).toLocaleString('vi-VN')}₫
              </p>
              {(product.sale > 0 || product.isFlashSale) && product.sale > 0 && (
                <span className="mt-1 inline-block rounded bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white">
                  -{product.sale}%
                </span>
              )}
            </div>

            {/* Version Variant Buttons */}
            {hasMultipleVersions && (
              <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-sm font-black uppercase tracking-wide text-gray-900">Phiên bản</p>
                  <span className="text-xs font-medium text-gray-500">Chọn RAM / dung lượng</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {versionOptions.map((version) => {
                    const isActive = version.key === activeVersionKey;

                    return (
                      <button
                        key={version.key}
                        onClick={() => {
                          if (!isActive && version.slug) {
                            setSelectedColorImageOverride(null);
                            setActiveImage(0);
                            navigate(`/products/${version.slug}`);
                          }
                        }}
                        className={`group relative overflow-hidden rounded-2xl border bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
                          isActive
                            ? 'border-red-500 ring-1 ring-red-100 shadow-[0_8px_24px_rgba(239,68,68,0.12)]'
                            : 'border-gray-200 hover:border-red-300'
                        }`}
                      >
                        {isActive && (
                          <span className="absolute right-3 top-3 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white shadow-sm">
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        )}
                        <div className="flex flex-col gap-1 pr-6">
                          <span className={`text-base font-black ${isActive ? 'text-red-600' : 'text-gray-900'}`}>
                            {version.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Color Buttons */}
            {availableColors.length > 0 && (
              <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-sm font-black uppercase tracking-wide text-gray-900">Màu sắc</p>
                  {selectedColor && (
                    <span className="text-xs font-medium text-gray-500">Đang chọn: {selectedColor.name}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  {availableColors.map((color) => {
                    const isActive = selectedVariant?.color?.toLowerCase() === color.name.toLowerCase();
                    const variantOfColor = product.allVariants.find(
                      v => getVersionGroupKey(v) === activeVersion?.key && v.color?.toLowerCase() === color.name.toLowerCase()
                    );
                    const hasColorImage = color.imageUrl && color.imageUrl.trim();
                    const colorPrice = variantOfColor?.price || selectedVariant?.price || currentPrice;
                    return (
                      <button
                        key={color.name}
                        onClick={() => {
                          if (!isActive && variantOfColor?.slug) {
                            setSelectedColorImageOverride(color.imageUrl || variantOfColor.colorImageUrl || null);
                            setActiveImage(0);
                            navigate(`/products/${variantOfColor.slug}?product_id=${variantOfColor.id}`);
                          } else {
                            setSelectedColorImageOverride(color.imageUrl || variantOfColor?.colorImageUrl || null);
                          }
                        }}
                        title={color.name}
                        className={`group relative inline-flex min-w-[220px] max-w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
                          isActive
                            ? 'border-red-500 ring-1 ring-red-100 shadow-[0_8px_24px_rgba(239,68,68,0.12)]'
                            : 'border-gray-200 hover:border-red-300'
                        }`}
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                          {hasColorImage ? (
                            <img
                              src={color.imageUrl}
                              alt={color.name}
                              className="h-full w-full object-contain p-1"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.currentTarget.parentElement.style.backgroundColor = '#f3f4f6';
                              }}
                            />
                          ) : (
                            <span
                              className="h-5 w-5 rounded-full"
                              style={{ backgroundColor: color.hex || '#6b7280', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)' }}
                            />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className={`block whitespace-nowrap text-sm font-black ${isActive ? 'text-red-600' : 'text-gray-900'}`}>
                            {color.name}
                          </span>
                          <span className={`mt-1 block text-sm font-bold ${isActive ? 'text-red-500' : 'text-gray-600'}`}>
                            {formatVariantPrice(colorPrice)}
                          </span>
                        </div>
                        {isActive && (
                          <span className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white shadow-sm">
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Current variant info */}
            {selectedVariant && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  Phiên bản {selectedVersionLabel}
                  {selectedVariant.color && <span className="text-gray-400"> | {selectedVariant.color}</span>}
                </span>
              </div>
            )}

            {/* Add to Cart */}
            <div className="flex items-center gap-3">
              <div className="flex items-center overflow-hidden rounded-xl border border-gray-200">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="h-11 w-11 text-lg font-black text-gray-500 hover:text-red-600">−</button>
                <span className="w-14 text-center font-bold text-lg">{quantity}</span>
                <button onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                  className="h-11 w-11 text-lg font-black text-gray-500 hover:text-red-600">+</button>
              </div>
              <button onClick={addToCart} disabled={maxQuantity <= 0}
                className="flex-1 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300 transition-all">
                {maxQuantity > 0 ? 'Thêm vào giỏ hàng' : 'Hết hàng'}
              </button>
            </div>

            {product.isFlashSale && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                🔥 Đang diễn ra Flash Sale — Giảm đến {product.sale}%
              </div>
            )}

            {/* Specifications — CellphoneS-style tabbed */}
            {(Object.keys(product.specifications || {}).length > 0 || Object.keys(product.groupedSpecifications || {}).length > 0) && (
              <ProductSpecificationsTab
                groupedSpecifications={product.groupedSpecifications}
                specifications={product.specifications}
              />
            )}
          </section>
        </div>
      </div>

      <ReviewSection productId={product.id} currentUserId={state.user?.id || null} />

      <QuestionSection productId={product.id} currentUserId={state.user?.id || null} />

      {/* Other variants of the same product */}
      {(product.allVariants?.length || 0) > 1 && (
        <div className="mx-auto max-w-6xl px-4 pt-8">
          <h2 className="mb-4 text-lg font-black text-gray-900">Các phiên bản khác</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {product.allVariants.map((v) => {
              const isCurrent = v.id === selectedVariant?.id;
              return (
                <button
                  key={v.id}
                  onClick={() => !isCurrent && navigate(`/products/${v.slug}`)}
                  disabled={isCurrent}
                  className={`rounded-2xl border bg-white p-3 text-left transition-all hover:border-red-300 hover:shadow-md ${
                    isCurrent ? 'opacity-40 cursor-default' : ''
                  }`}
                >
                  <div className="aspect-square mb-2 flex items-center justify-center overflow-hidden rounded-xl bg-gray-50">
                    {product.thumbnailUrl ? (
                      <img
                        src={product.thumbnailUrl}
                        alt={v.storageLabel}
                        className="h-full w-full object-contain"
                        onError={(e) => { e.target.src = 'https://picsum.photos/seed/rel/200/200'; }}
                      />
                    ) : (
                      <div className="text-gray-300 text-xs">No image</div>
                    )}
                  </div>
                  <p className="mb-1 text-xs font-medium text-gray-700 line-clamp-2">
                    {product.name}
                    {v.storageLabel && <span className="block text-gray-400 text-[10px]">{v.storageLabel}</span>}
                    {v.color && <span className="block text-gray-400 text-[10px]">{v.color}</span>}
                  </p>
                  <p className="text-sm font-bold text-red-600">
                    {Number(v.price || 0).toLocaleString('vi-VN')}₫
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
};
