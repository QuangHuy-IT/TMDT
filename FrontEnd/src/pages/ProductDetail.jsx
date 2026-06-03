import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import ProductService from '../services/productService';
import ReviewSection from '../components/review/ReviewSection';
import QuestionSection from '../components/question/QuestionSection';
import { ProductSpecificationsTab } from '../components/product/ProductSpecificationsTab';
import { getSafeProductSlug } from '../utils/slug';
import { ProductCard } from '../components/ui/ProductCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

const KEY_SPECS_KEYS = [
  'Kích thước màn hình',
  'Công nghệ màn hình',
  'Độ phân giải',
  'Tần số quét',
  'Chip đồ hoạ',
  'Dung lượng (ROM)',
  'RAM',
  'Camera sau',
  'Camera trước',
  'Dung lượng pin',
  'Công nghệ Sạc nhanh'
];

const getSpecValue = (specifications, targetKey) => {
  if (!specifications || typeof specifications !== 'object') return null;
  if (specifications[targetKey]) return specifications[targetKey];
  const targetLower = targetKey.toLowerCase();
  const foundKey = Object.keys(specifications).find(
    k => k.toLowerCase() === targetLower
  );
  if (foundKey) return specifications[foundKey];
  if (targetLower.includes('sạc nhanh') || targetLower.includes('sạc')) {
    const sKey = Object.keys(specifications).find(
      k => k.toLowerCase().includes('sạc nhanh') || k.toLowerCase().includes('công nghệ sạc') || k.toLowerCase().includes('sạc')
    );
    if (sKey) return specifications[sKey];
  }
  if (targetLower.includes('dung lượng (rom)') || targetLower === 'rom' || targetLower.includes('dung lượng')) {
    const rKey = Object.keys(specifications).find(
      k => k.toLowerCase() === 'dung lượng' || k.toLowerCase() === 'bộ nhớ trong' || k.toLowerCase().includes('rom') || k.toLowerCase().includes('dung lượng (rom)')
    );
    if (rKey) return specifications[rKey];
  }
  if (targetLower === 'ram') {
    const ramKey = Object.keys(specifications).find(
      k => k.toLowerCase() === 'ram' || k.toLowerCase() === 'dung lượng ram'
    );
    if (ramKey) return specifications[ramKey];
  }
  if (targetLower.includes('pin')) {
    const pinKey = Object.keys(specifications).find(
      k => k.toLowerCase().includes('pin') || k.toLowerCase().includes('dung lượng pin')
    );
    if (pinKey) return specifications[pinKey];
  }
  if (targetLower.includes('màn hình')) {
    const screenKey = Object.keys(specifications).find(
      k => k.toLowerCase().includes('kích thước màn hình') || k.toLowerCase().includes('kích thước')
    );
    if (screenKey && targetLower.includes('kích thước')) return specifications[screenKey];
  }
  return null;
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

const normalizeImages = (images) => (
  Array.isArray(images)
    ? images
      .map((image) => (typeof image === 'string' ? image : image?.imageUrl))
      .filter((image) => typeof image === 'string' && image.trim())
    : []
);

const normalizeVariantImages = (variant) => {
  const images = normalizeImages(variant?.images);
  if (images.length > 0) return images;
  return variant?.colorImageUrl && variant.colorImageUrl.trim() ? [variant.colorImageUrl] : [];
};

const normalizeProduct = (raw) => {
  if (!raw || typeof raw !== 'object') return null;

  let images = normalizeImages(raw.images);
  if (images.length === 0 && raw.thumbnailUrl && raw.thumbnailUrl.trim()) {
    images = [raw.thumbnailUrl];
  }

  const allVariants = Array.isArray(raw.variants)
    ? raw.variants.map((variant) => ({
      ...variant,
      images: normalizeVariantImages(variant),
    }))
    : [];
  const variantOptions = raw.variantOptions && typeof raw.variantOptions === 'object'
    ? raw.variantOptions : {};
  const selectedVariant = raw.selectedVariant && typeof raw.selectedVariant === 'object'
    ? { ...raw.selectedVariant, images: normalizeVariantImages(raw.selectedVariant) } : null;

  const storages = Array.isArray(variantOptions.storages) ? variantOptions.storages : [];
  const basePrices = variantOptions.basePrices || {};

  const colorImages = {};
  if (Array.isArray(variantOptions.colors)) {
    variantOptions.colors.forEach(c => {
      if (c?.name && c?.imageUrl && c.imageUrl.trim()) {
        colorImages[c.name.toLowerCase()] = c.imageUrl;
      }
    });
  }

  const totalStock = allVariants.reduce((sum, v) => sum + Number(v?.stock || 0), 0);
  const specifications = raw.specifications && typeof raw.specifications === 'object'
    ? raw.specifications : {};
  const groupedSpecifications = raw.groupedSpecifications && typeof raw.groupedSpecifications === 'object'
    ? raw.groupedSpecifications : {};
  const specificationRows = Array.isArray(raw.specificationRows) ? raw.specificationRows : [];

  return {
    ...raw,
    id: raw.id,
    name: raw.name || 'Sản phẩm',
    images,
    stock: totalStock,
    specifications,
    specificationRows,
    groupedSpecifications,
    allVariants,
    variantOptions,
    selectedVariant,
    storages,
    basePrices,
    colorImages,
  };
};

export const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { state, dispatch } = useContext(ShopContext);
  const { isAuthenticated } = state;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showSpecsModal, setShowSpecsModal] = useState(false);

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const productIdParam = searchParams.get('product_id');
  const productIdParamRef = useRef(productIdParam);
  productIdParamRef.current = productIdParam;

  const variantScrollRef = useRef(null);
  const [showLeftVariantArrow, setShowLeftVariantArrow] = useState(false);
  const [showRightVariantArrow, setShowRightVariantArrow] = useState(true);

  const scrollVariants = (direction) => {
    if (!variantScrollRef.current) return;
    const scrollAmount = variantScrollRef.current.offsetWidth * 0.75;
    variantScrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleVariantScroll = () => {
    if (!variantScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = variantScrollRef.current;
    setShowLeftVariantArrow(scrollLeft > 10);
    setShowRightVariantArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    if (variantScrollRef.current) {
      variantScrollRef.current.scrollLeft = 0;
      setTimeout(handleVariantScroll, 100);
    }
  }, [product?.id]);

  useEffect(() => {
    let mounted = true;

    const fetchDetail = async () => {
      setLoading(true);
      setError('');
      setActiveImage(0);
      setQuantity(1);
      setIsDescriptionExpanded(false);

      try {
        const response = await ProductService.getProductDetail(slug);
        if (!mounted) return;
        const normalized = normalizeProduct(response.data);
        setProduct(normalized);

        const currentProductIdParam = productIdParamRef.current;
        const canonicalSlug = getSafeProductSlug(normalized?.selectedVariant?.slug, normalized?.slug);
        if (currentProductIdParam && normalized?.allVariants) {
          const targetVariant = normalized.allVariants.find(v => String(v.id) === currentProductIdParam);
          const targetSlug = getSafeProductSlug(targetVariant?.slug);
          if (targetSlug) {
            navigate(`/products/${targetSlug}`, { replace: true });
          } else if (canonicalSlug) {
            navigate(`/products/${canonicalSlug}`, { replace: true });
          }
        } else if (canonicalSlug && canonicalSlug !== slug) {
          navigate(`/products/${canonicalSlug}`, { replace: true });
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
  }, [slug, navigate]);

  const selectedVariant = product?.selectedVariant || null;

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

  const maxQuantity = useMemo(() => {
    if (selectedVariant?.stock != null) return Math.max(0, Number(selectedVariant.stock));
    if (product?.stock != null) return Math.max(0, Number(product.stock));
    return 0;
  }, [selectedVariant, product]);

  const handleQuantityChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (val === '') {
      setQuantity('');
      return;
    }
    const num = parseInt(val, 10);
    if (num > maxQuantity) {
      setQuantity(maxQuantity);
    } else {
      setQuantity(num);
    }
  };

  const handleQuantityBlur = () => {
    const num = Number(quantity);
    if (quantity === '' || num <= 0) {
      setQuantity(1);
    } else if (num > maxQuantity) {
      setQuantity(maxQuantity);
    }
  };

  useEffect(() => {
    setQuantity((q) => {
      if (q === '') return '';
      const num = Number(q);
      if (num > maxQuantity) return maxQuantity;
      return q;
    });
  }, [maxQuantity]);

  const originalPrice = useMemo(() => {
    if (selectedVariant?.compareAtPrice != null) return Number(selectedVariant.compareAtPrice);
    if (product?.originalPrice != null) return Number(product.originalPrice);
    if (selectedVariant?.price != null) return Number(selectedVariant.price);
    return 0;
  }, [product, selectedVariant]);

  const basicSpecs = useMemo(() => {
    if (!product?.specifications) return [];
    return KEY_SPECS_KEYS.map(key => {
      const val = getSpecValue(product.specifications, key);
      return val ? { key, val } : null;
    }).filter(Boolean);
  }, [product?.specifications]);

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
          slug: getSafeProductSlug(variant.slug),
          price: variant.price || 0,
          stock: variantStock,
          variants: [variant],
        });
        return;
      }

      existing.variants.push(variant);
      existing.stock += variantStock;
      if (!existing.slug) existing.slug = getSafeProductSlug(variant.slug);
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

  const selectedColor = useMemo(() => {
    if (!selectedVariant?.color) return null;
    const colorNameLower = selectedVariant.color.toLowerCase();
    const colorImage = product?.colorImages?.[colorNameLower] || selectedVariant.colorImageUrl || null;
    return { name: selectedVariant.color, hex: inferColorHex(selectedVariant.color), imageUrl: colorImage };
  }, [product?.colorImages, selectedVariant?.color, selectedVariant?.colorImageUrl]);

  const images = useMemo(() => {
    return normalizeImages(selectedVariant?.images);
  }, [selectedVariant?.images]);

  useEffect(() => {
    setActiveImage(0);
  }, [selectedVariant?.id]);

  const displayName = formatVariantName(product?.name, selectedVariant);

  const addToCart = () => {
    if (!product) return;
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }
    if (maxQuantity <= 0) return;

    const finalQuantity = Math.max(1, Math.min(maxQuantity, Number(quantity) || 1));

    dispatch({
      type: 'ADD_TO_CART',
      payload: {
        ...product,
        variantId: selectedVariant?.id || null,
        slug: getSafeProductSlug(selectedVariant?.slug, slug, product.slug, product.productSlug),
        variantSlug: getSafeProductSlug(selectedVariant?.slug),
        id: String(selectedVariant?.id || product.id),
        productId: String(product.id),
        cartKey: String(selectedVariant?.id || selectedVariant?.slug || selectedVariant?.storageLabel || selectedVariant?.color || product.id),
        name: displayName,
        quantity: finalQuantity,
        price: currentPrice,
        originalPrice,
        ram: selectedVariant?.ramGb ? `${selectedVariant.ramGb}GB` : '',
        storage: selectedVariant?.storageLabel || '',
        color: selectedColor?.name || selectedVariant?.color || '',
        sku: selectedVariant?.sku || '',
        thumbnailUrl: images[0] || '',
        images,
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
  const brandSlug = product.brandSlug || product.brand;
  const seriesSlug = product.seriesSlug || product.seriesName;
  const hasSeries = Boolean(seriesSlug);
  const richDescription = product.detailDescription || product.detail_description || product.description || '';
  const shouldClampDescription = String(richDescription).length > 1200;

  return (
    <main className="min-h-screen bg-[#f8f8f6] pb-20">
      <div className="mx-auto max-w-6xl px-4 pt-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-gray-400">
          <button onClick={() => navigate('/')} className="hover:text-red-600">Trang chủ</button>
          <span>/</span>
          <button onClick={() => navigate(`/brands/${product.brandSlug || product.brand}`)}
            className="hover:text-red-600">{product.brand || 'Khác'}</button>
          {hasSeries && (
            <>
              <span>/</span>
              <button onClick={() => navigate(`/brands/${brandSlug}/${seriesSlug}`)}
                className="hover:text-red-600">{product.seriesName || product.seriesSlug}</button>
            </>
          )}
          <span>/</span>
          <span className="text-gray-700">{displayName}</span>
        </nav>
        
        <div className="space-y-8">
          {/* Hàng 1: Hai cột trái phải */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
            {/* LEFT: Image Gallery */}
            <section className="space-y-3 lg:sticky lg:top-4">
              <div className="relative rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
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
                    <button key={`${selectedVariant?.id || 'thumb'}-${index}`} onClick={() => setActiveImage(index)}
                      className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${activeImage === index ? 'border-red-500' : 'border-gray-200'}`}>
                      <img src={image} alt={`Thumb ${index + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* RIGHT: TOÀN BỘ ĐÃ ĐƯỢC GOM GỌN TRONG KHUNG LỚN BG-WHITE */}
            <section className="space-y-5 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              {/* Brand + Stock badge */}
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-red-600">
                  {product.brand || 'Khác'}
                </span>
                <span className={`text-[11px] font-bold uppercase ${maxQuantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {maxQuantity > 0 ? `Còn ${maxQuantity} sản phẩm` : 'Hết hàng'}
                </span>
              </div>

              <h1 className="text-2xl font-black text-gray-900">{displayName}</h1>

              {/* Price Block */}
              <div>
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
                <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-wide text-gray-900">Phiên bản</p>
                    <span className="text-[11px] font-medium text-gray-500">Chọn RAM / dung lượng</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {versionOptions.map((version) => {
                      const isActive = version.key === activeVersionKey;
                      return (
                        <button
                          key={version.key}
                          onClick={() => {
                            if (!isActive && version.slug) {
                              setActiveImage(0);
                              navigate(`/products/${version.slug}`);
                            }
                          }}
                          className={`group relative overflow-hidden rounded-xl border bg-white p-3 text-left transition-all hover:shadow-sm ${
                            isActive ? 'border-red-500 ring-1 ring-red-100' : 'border-gray-200 hover:border-red-300'
                          }`}
                        >
                          {isActive && (
                            <span className="absolute right-2 top-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-white shadow-sm">
                              <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                          )}
                          <div className="flex flex-col gap-1 pr-4">
                            <span className={`text-sm font-black ${isActive ? 'text-red-600' : 'text-gray-900'}`}>
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
                <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-wide text-gray-900">Màu sắc</p>
                    {selectedColor && (
                      <span className="text-[11px] font-medium text-gray-500">Đang chọn: {selectedColor.name}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2.5">
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
                            const targetSlug = getSafeProductSlug(variantOfColor?.slug);
                            if (!isActive && targetSlug) {
                              setActiveImage(0);
                              navigate(`/products/${targetSlug}?product_id=${variantOfColor.id}`);
                            }
                          }}
                          title={color.name}
                          className={`group relative inline-flex min-w-[180px] max-w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-all hover:shadow-sm ${
                            isActive ? 'border-red-500 ring-1 ring-red-100' : 'border-gray-200 hover:border-red-300'
                          }`}
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                            {hasColorImage ? (
                              <img
                                src={color.imageUrl}
                                alt={color.name}
                                className="h-full w-full object-contain p-0.5"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement.style.backgroundColor = '#f3f4f6';
                                }}
                              />
                            ) : (
                              <span
                                className="h-4 w-4 rounded-full"
                                style={{ backgroundColor: color.hex || '#6b7280', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)' }}
                              />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className={`block whitespace-nowrap text-xs font-black ${isActive ? 'text-red-600' : 'text-gray-900'}`}>
                              {color.name}
                            </span>
                            <span className={`mt-0.5 block text-xs font-bold ${isActive ? 'text-red-500' : 'text-gray-600'}`}>
                              {formatVariantPrice(colorPrice)}
                            </span>
                          </div>
                          {isActive && (
                            <span className="absolute right-1.5 top-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-white shadow-sm">
                              <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
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

              {/* Quantity + Purchase CTA Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <button onClick={() => setQuantity((q) => Math.max(1, (Number(q) || 0) - 1))}
                    className="h-11 w-11 text-lg font-black text-gray-500 hover:text-red-600">−</button>
                  <input
                    type="text"
                    value={quantity}
                    onChange={handleQuantityChange}
                    onBlur={handleQuantityBlur}
                    className="w-14 text-center font-bold text-base border-none focus:outline-none focus:ring-0 p-0"
                  />
                  <button onClick={() => setQuantity((q) => Math.min(maxQuantity, (Number(q) || 0) + 1))}
                    className="h-11 w-11 text-lg font-black text-gray-500 hover:text-red-600">+</button>
                </div>
                <button onClick={addToCart} disabled={maxQuantity <= 0}
                  className="flex-1 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300 transition-all">
                  {maxQuantity > 0 ? 'Thêm vào giỏ hàng' : 'Hết hàng'}
                </button>
              </div>

              {product.isFlashSale && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-xs text-red-700">
                  🔥 Đang diễn ra Flash Sale — Giảm đến {product.sale}%
                </div>
              )}

              {/* Specs Summary (Gói gọn tinh tế bên trong khối trắng chung) */}
              {basicSpecs.length > 0 && (
                <div className="rounded-2xl border border-gray-100 bg-gray-50/40 p-4 pt-3 mt-4">
                  <h3 className="mb-2.5 text-xs font-black uppercase tracking-wide text-gray-900 border-b border-gray-100 pb-1.5">Thông số kỹ thuật nổi bật</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                    {basicSpecs.map((spec, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1 border-b border-gray-100/50 text-[11px]">
                        <span className="text-gray-500 font-medium">{spec.key}</span>
                        <span className="text-gray-900 font-bold text-right pl-3 truncate max-w-[60%]">{spec.val}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowSpecsModal(true)}
                    className="mt-3 w-full rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-black py-2 text-xs transition-colors flex items-center justify-center gap-1"
                  >
                    <span>Xem cấu hình chi tiết đầy đủ</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </div>
              )}
            </section>
          </div>

          {/* Hàng 2: Khối mô tả chi tiết trải rộng toàn bộ màn hình */}
          <div className="rounded-3xl border border-gray-100 bg-white overflow-hidden shadow-sm">
            <div className="w-full">
              <style>{`
                .product-desc-body { color: #374151; font-size: 13.5px; line-height: 1.75; }
                .product-desc-body h1,.product-desc-body h2,.product-desc-body h3,.product-desc-body h4 { font-weight: 700; color: #111827; margin: 14px 0 6px; line-height: 1.3; }
                .product-desc-body h1 { font-size: 18px; } .product-desc-body h2 { font-size: 16px; } .product-desc-body h3 { font-size: 14px; } .product-desc-body h4 { font-size: 13px; }
                .product-desc-body p { margin: 0 0 10px; }
                .product-desc-body ul,.product-desc-body ol { padding-left: 20px; margin: 0 0 10px; }
                .product-desc-body ul { list-style: disc; } .product-desc-body ol { list-style: decimal; }
                .product-desc-body li { margin-bottom: 4px; }
                .product-desc-body img { max-width: 100%; border-radius: 10px; display: block; margin: 10px auto; }
                .product-desc-body p a { color: #dc2626; text-decoration: underline; }
                .product-desc-body table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 12.5px; }
                .product-desc-body table th,.product-desc-body table td { border: 1px solid #e5e7eb; padding: 7px 10px; text-align: left; }
                .product-desc-body table th { background: #f9fafb; font-weight: 700; }
                .product-desc-body strong,.product-desc-body b { font-weight: 700; color: #111827; }
                .product-desc-body em,.product-desc-body i { font-style: italic; }
                .product-desc-body blockquote { border-left: 3px solid #dc2626; padding: 6px 12px; margin: 10px 0; background: #fff5f5; color: #6b7280; font-style: italic; border-radius: 0 8px 8px 0; }
                .product-desc-body hr { border: none; border-top: 1px solid #e5e7eb; margin: 14px 0; }
              `}</style>

              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/70">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-500 flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                  </svg>
                </div>
                <h2 className="text-sm font-black uppercase tracking-wide text-gray-900">Mô tả sản phẩm</h2>
              </div>

              {richDescription ? (
                <>
                  <div className="relative">
                    <div
                      className="product-desc-body px-5 pt-5 pb-3"
                      style={shouldClampDescription && !isDescriptionExpanded
                        ? { maxHeight: 580, overflow: 'hidden' }
                        : {}}
                      dangerouslySetInnerHTML={{ __html: richDescription }}
                    />
                    {shouldClampDescription && !isDescriptionExpanded && (
                      <div
                        className="pointer-events-none absolute inset-x-0 bottom-0"
                        style={{ height: 120, background: 'linear-gradient(to top, #ffffff 30%, transparent)' }}
                      />
                    )}
                  </div>
                  {shouldClampDescription && (
                    <button
                      type="button"
                      onClick={() => setIsDescriptionExpanded((v) => !v)}
                      className="flex items-center justify-center gap-2 w-full px-4 py-3.5 text-sm font-bold text-red-600 border-t border-gray-100 bg-white hover:bg-red-50/50 transition-colors"
                    >
                      <span>{isDescriptionExpanded ? 'Thu gọn mô tả nội dung' : 'Xem thêm toàn bộ mô tả sản phẩm'}</span>
                      <svg
                        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
                        style={{ transition: 'transform 0.3s ease', transform: isDescriptionExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                  )}
                </>
              ) : (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-gray-400">Sản phẩm đang được cập nhật nội dung mô tả.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <ReviewSection productId={product.id} currentUserId={state.user?.id || null} />

      {/* Q&A Section */}
      <QuestionSection productId={product.id} currentUserId={state.user?.id || null} />

      {/* Other variants list */}
      {(product.allVariants?.length || 0) > 1 && (
        <div className="mx-auto max-w-6xl px-4 pt-8">
          <h2 className="mb-4 text-lg font-black text-gray-900">Các phiên bản cấu hình khác</h2>
          <div className="relative group">
            {/* Scrollable list */}
            <div
              ref={variantScrollRef}
              onScroll={handleVariantScroll}
              className="flex gap-4 overflow-x-auto pb-4 scroll-smooth scrollbar-hide snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {product.allVariants.map((v) => {
                const isCurrent = v.id === selectedVariant?.id;
                const cardProduct = {
                  ...product,
                  selectedVariant: v,
                  variantName: `${v.storageLabel || ''}${v.color ? ` - ${v.color}` : ''}`,
                  price: v.price,
                  originalPrice: v.compareAtPrice || v.price,
                  thumbnailUrl: v.colorImageUrl || (v.images && v.images[0]) || product.thumbnailUrl,
                };

                return (
                  <div
                    key={v.id}
                    className={`flex-shrink-0 w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)] snap-start ${
                      isCurrent ? 'opacity-40 pointer-events-none' : ''
                    }`}
                  >
                    <ProductCard product={cardProduct} />
                  </div>
                );
              })}
            </div>

            {/* Left navigation arrow */}
            <button
              onClick={() => scrollVariants('left')}
              className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/95 text-red-600 shadow-xl shadow-black/15 transition-all duration-300 hover:bg-white hover:scale-110 active:scale-95 hover:shadow-2xl opacity-0 -translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 ${
                !showLeftVariantArrow ? 'pointer-events-none opacity-0' : ''
              }`}
              aria-label="Cuộn sang trái"
            >
              <ChevronLeft size={20} />
            </button>

            {/* Right navigation arrow */}
            <button
              onClick={() => scrollVariants('right')}
              className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/95 text-red-600 shadow-xl shadow-black/15 transition-all duration-300 hover:bg-white hover:scale-110 active:scale-95 hover:shadow-2xl opacity-0 translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 ${
                !showRightVariantArrow ? 'pointer-events-none opacity-0' : ''
              }`}
              aria-label="Cuộn sang phải"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Full Specifications Modal */}
      {showSpecsModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowSpecsModal(false)}
        >
          <div 
            className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xs font-black text-gray-900 uppercase tracking-wide">Thông số kỹ thuật chi tiết</h2>
              <button
                onClick={() => setShowSpecsModal(false)}
                className="p-2 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-700 transition-colors"
                aria-label="Đóng"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
              <ProductSpecificationsTab
                specificationRows={product.specificationRows}
                groupedSpecifications={product.groupedSpecifications}
                specifications={product.specifications}
                showAll={true}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
};