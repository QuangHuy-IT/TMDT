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
  return '#6b7280';
};

const normalizeProduct = (raw, fallbackId) => {
  if (!raw || typeof raw !== 'object') return null;

  const images = Array.isArray(raw.images)
    ? raw.images.filter(Boolean)
    : (raw.image ? [raw.image] : []);

  const variants = raw.variants && typeof raw.variants === 'object' ? raw.variants : {};
  const storages = Array.isArray(variants.storages) ? variants.storages.filter(Boolean) : [];
  const colors = Array.isArray(variants.colors)
    ? variants.colors
        .map((item) => {
          if (typeof item === 'string') {
            return { name: item, hex: inferColorHex(item) };
          }
          if (!item || typeof item !== 'object') return null;
          const name = item.name || item.color || 'Mặc định';
          return { name, hex: item.hex || inferColorHex(name) };
        })
        .filter(Boolean)
    : [];

  const basePrices = variants.basePrices && typeof variants.basePrices === 'object'
    ? variants.basePrices
    : {};

  const variantItems = Array.isArray(raw.variantItems) ? raw.variantItems : [];
  const fallbackStock = variantItems.reduce((sum, item) => sum + Number(item?.stock || 0), 0);
  const stock = Number(raw.stock ?? fallbackStock ?? 0);

  return {
    ...raw,
    id: raw.id || raw._id || fallbackId,
    images,
    price: Number(raw.price || 0),
    stock,
    variants: {
      storages,
      colors,
      basePrices,
    },
    specifications: raw.specifications && typeof raw.specifications === 'object' ? raw.specifications : {},
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
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedStorage, setSelectedStorage] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchDetail = async () => {
      setLoading(true);
      setError('');

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

    return () => {
      mounted = false;
    };
  }, [slug]);

  useEffect(() => {
    const storages = product?.variants?.storages || [];
    const colors = product?.variants?.colors || [];
    setSelectedStorage(storages.length > 0 ? storages[0] : null);
    setSelectedColor(colors.length > 0 ? colors[0] : null);
    setActiveImage(0);
    setQuantity(1);
  }, [product?.id]);

  const images = product?.images || [];
  const currentPrice = useMemo(() => {
    if (!product) return 0;
    // Ưu tiên giá flash sale
    if (product.isFlashSale && product.flashSalePrice != null) {
      return Number(product.flashSalePrice);
    }
    if (selectedStorage && product.variants?.basePrices?.[selectedStorage] != null) {
      return Number(product.variants.basePrices[selectedStorage]);
    }
    return Number(product.price || 0);
  }, [product, selectedStorage]);

  const maxQuantity = Math.max(1, Number(product?.stock || 0));

    const addToCart = () => {
    if (!product) return;

    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }

    if ((product.stock || 0) <= 0) return;

    // Tìm variantItem phù hợp với storage + color đã chọn
    const variantItems = product.variantItems || [];
    const selectedVariant = variantItems.find(
      (v) =>
        String(v.storageGb || '') === String(selectedStorage) &&
        (v.color || '').toLowerCase() === (selectedColor?.name || '').toLowerCase()
    );

    dispatch({
      type: 'ADD_TO_CART',
      payload: {
        ...product,
        variantId: selectedVariant?.id || null,
        id: String(product.id),
        quantity,
        price: currentPrice,
        ram: selectedVariant?.ramGb ? `${selectedVariant.ramGb}GB` : '',
        storage: selectedVariant?.storageGb ? `${selectedVariant.storageGb}GB` : String(selectedStorage || ''),
        color: selectedColor?.name || '',
        sku: selectedVariant?.sku || '',
        images: product.images,
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
        <button
          onClick={() => navigate('/')}
          className="mt-6 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-700"
        >
          Về trang chủ
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f8f6] pb-20">
      <div className="mx-auto max-w-6xl px-4 pt-8">
        <nav className="mb-6 flex items-center gap-2 text-xs text-gray-400">
          <button onClick={() => navigate('/')} className="hover:text-red-600">Trang chủ</button>
          <span>/</span>
          <button onClick={() => navigate(`/brands/${product.brandSlug || product.brand}`)} className="hover:text-red-600">{product.brand || 'Khác'}</button>
          <span>/</span>
          <span className="text-gray-700">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* ===== LEFT: Image Gallery ===== */}
          <section className="space-y-3">
            {/* Main Image */}
            <div className="relative rounded-2xl border border-gray-100 bg-white overflow-hidden">
              <div className="relative aspect-square flex items-center justify-center overflow-hidden bg-gray-50">
                <img
                  src={images[activeImage] || 'https://picsum.photos/seed/fallback/700/700'}
                  alt={product.name}
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = 'https://picsum.photos/seed/fallback/700/700';
                  }}
                />

                {/* Prev / Next Buttons */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImage((i) => (i - 1 + images.length) % images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-lg hover:bg-white disabled:opacity-30"
                      aria-label="Ảnh trước"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <button
                      onClick={() => setActiveImage((i) => (i + 1) % images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-lg hover:bg-white"
                      aria-label="Ảnh sau"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 12l4-4-4-4" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </>
                )}

                {/* Dots indicator */}
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

            {/* Thumbnail Strip */}
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

            {/* ===== Below images: Description + Specifications ===== */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4">
              <h2 className="mb-2 text-sm font-black uppercase tracking-wide text-gray-900">Mô tả</h2>
              <p className="text-sm leading-relaxed text-gray-600">
                {product.description || 'Sản phẩm đang được cập nhật mô tả.'}
              </p>
            </div>

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

          <section className="space-y-5">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-red-600">
                {product.brand || 'Khác'}
              </span>
              <span className={`text-[11px] font-bold uppercase ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {product.stock > 0 ? `Còn ${product.stock} sản phẩm` : 'Hết hàng'}
              </span>
            </div>

            <h1 className="text-3xl font-black text-gray-900">{product.name}</h1>

            <p className="text-3xl font-black text-red-600">{Number(currentPrice || 0).toLocaleString('vi-VN')}₫</p>

            {product.variants?.storages?.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase text-gray-500">Dung lượng</p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.storages.map((storage) => (
                    <button
                      key={storage}
                      onClick={() => setSelectedStorage(storage)}
                      className={`rounded-lg border px-3 py-2 text-sm font-bold ${selectedStorage === storage ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-200 text-gray-700'}`}
                    >
                      {storage}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.variants?.colors?.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase text-gray-500">Màu sắc</p>
                <div className="flex flex-wrap gap-3">
                  {product.variants.colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color)}
                      className={`h-9 w-9 rounded-full border-2 ${selectedColor?.name === color.name ? 'border-gray-900' : 'border-gray-300'}`}
                      style={{ backgroundColor: color.hex || '#6b7280' }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="flex items-center overflow-hidden rounded-xl border border-gray-200">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="h-10 w-10 text-lg font-black text-gray-500 hover:text-red-600"
                >
                  -
                </button>
                <span className="w-12 text-center font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                  className="h-10 w-10 text-lg font-black text-gray-500 hover:text-red-600"
                >
                  +
                </button>
              </div>

              <button
                onClick={addToCart}
                disabled={product.stock <= 0}
                className="rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                Thêm vào giỏ hàng
              </button>
            </div>
          </section>
        </div>
      </div>

      <ReviewSection productId={product.id} currentUserId={state.user?.id || null} />
    </main>
  );
};
