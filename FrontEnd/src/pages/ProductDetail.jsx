import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import ProductService from '../services/productService';

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
  if (normalized.includes('tim')) return '#7c3aed';
  if (normalized.includes('hong') || normalized.includes('pink')) return '#ec4899';
  if (normalized.includes('bac') || normalized.includes('silver')) return '#9ca3af';
  if (normalized.includes('nau') || normalized.includes('brown')) return '#92400e';
  return '#6b7280';
};

const normalizeProduct = (raw, fallbackId) => {
  if (!raw || typeof raw !== 'object') return null;

  // images = TẤT CẢ ảnh gallery mà admin upload (thumbnail + gallery)
  // KHÔNG chứa ảnh màu sắc — ảnh màu chỉ dùng làm swatch
  const galleryImages = Array.isArray(raw.images)
    ? raw.images.filter(Boolean)
    : (raw.image ? [raw.image] : []);

  // variants.colors chứa cả color image URL nhưng chỉ dùng làm swatch,
  // KHÔNG merge vào images array
  const variants = raw.variants && typeof raw.variants === 'object' ? raw.variants : {};
  const storages = Array.isArray(variants.storages) ? variants.storages.filter(Boolean) : [];
  const colors = Array.isArray(variants.colors)
    ? variants.colors
        .map((item) => {
          if (typeof item === 'string') {
            return { name: item, hex: inferColorHex(item), imageUrl: null };
          }
          if (!item || typeof item !== 'object') return null;
          const name = item.name || item.color || 'Mặc định';
          return { name, hex: item.hex || inferColorHex(name), imageUrl: item.imageUrl || null };
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
    thumbnailUrl: raw.thumbnailUrl || (galleryImages[0] || null),
    galleryImages,           // chỉ ảnh gallery, không chứa color image
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
  const { id } = useParams();
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
        const response = await ProductService.getProductDetail(id);
        if (!mounted) return;
        const normalized = normalizeProduct(response.data, id);
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
  }, [id]);

  // Reset selection khi product thay đổi
  useEffect(() => {
    if (!product) return;
    const storages = product.variants?.storages || [];
    const colors = product.variants?.colors || [];
    setSelectedStorage(storages.length > 0 ? storages[0] : null);
    setSelectedColor(colors.length > 0 ? colors[0] : null);
    setActiveImage(0);
    setQuantity(1);
  }, [product?.id]);

  // images = galleryImages (tách biệt với color swatches)
  const galleryImages = product?.galleryImages || [];

  // Ảnh hiển thị chính: ưu tiên gallery theo index
  const displayImage = useMemo(() => {
    return galleryImages[activeImage] || product?.thumbnailUrl || 'https://picsum.photos/seed/fallback/700/700';
  }, [galleryImages, activeImage, product?.thumbnailUrl]);

  // Giá theo storage đã chọn
  const currentPrice = useMemo(() => {
    if (!product) return 0;
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

    dispatch({
      type: 'ADD_TO_CART',
      payload: {
        ...product,
        id: selectedStorage ? `${product.id}-${selectedStorage}` : String(product.id),
        quantity,
        price: currentPrice,
        selectedStorage,
        selectedColor,
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-red-500 rounded-full animate-spin" />
          <p className="text-sm font-bold text-gray-500">Đang tải thông tin sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <span className="text-3xl">🔍</span>
        </div>
        <h2 className="text-2xl font-black text-gray-800">Không tìm thấy sản phẩm</h2>
        <p className="text-sm text-gray-500 mt-2">{error || 'Sản phẩm không tồn tại hoặc đã bị xóa.'}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 px-6 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-all"
        >
          Về trang chủ
        </button>
      </div>
    );
  }

  const { variants, specifications } = product;

  return (
    <main className="min-h-screen bg-[#f8f8f6] pb-20">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-400 mb-6">
          <button onClick={() => navigate('/')} className="hover:text-red-600 font-medium transition-colors">Trang chủ</button>
          <span>/</span>
          <span className="text-gray-600">{product.name}</span>
        </nav>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── LEFT: Gallery ─────────────────────────────────────────── */}
          <section className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            {/* Main image */}
            <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
              <img
                src={displayImage}
                alt={product.name}
                className="w-full h-full object-contain"
                onError={(e) => { e.currentTarget.src = 'https://picsum.photos/seed/fallback/700/700'; }}
              />
            </div>

            {/* Gallery thumbnails */}
            {galleryImages.length > 1 && (
              <div className="px-4 pb-4">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-2">
                  {galleryImages.length} ảnh
                </p>
                <div className="flex gap-2 flex-wrap">
                  {galleryImages.map((image, index) => (
                    <button
                      key={`gallery-${index}`}
                      onClick={() => setActiveImage(index)}
                      className={`w-16 h-16 rounded-xl border-2 overflow-hidden transition-all ${
                        activeImage === index ? 'border-red-500 shadow-md' : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Ảnh ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.src = 'https://picsum.photos/seed/fallback/80/80'; }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ── RIGHT: Product Info ──────────────────────────────────── */}
          <section className="space-y-5">

            {/* Brand + Stock badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-red-50 text-red-600 font-bold uppercase tracking-wide">
                {product.brand || 'Khác'}
              </span>
              <span className={`text-[11px] font-bold uppercase ${
                product.stock > 0 ? 'text-green-600' : 'text-red-500'
              }`}>
                {product.stock > 0 ? `Còn ${product.stock} sản phẩm` : 'Hết hàng'}
              </span>
            </div>

            {/* Name */}
            <h1 className="text-3xl font-black text-gray-900 leading-tight">{product.name}</h1>

            {/* Price */}
            <p className="text-3xl font-black text-red-600">
              {Number(currentPrice || 0).toLocaleString('vi-VN')}₫
            </p>

            {/* Storage selector */}
            {variants?.storages?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                  Dung lượng
                  {selectedStorage && (
                    <span className="font-medium text-gray-700 normal-case">{selectedStorage}</span>
                  )}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {variants.storages.map((storage) => (
                    <button
                      key={storage}
                      onClick={() => setSelectedStorage(storage)}
                      className={`px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                        selectedStorage === storage
                          ? 'border-red-500 bg-red-50 text-red-600 shadow-sm'
                          : 'border-gray-200 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {storage}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color selector */}
            {variants?.colors?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                  Màu sắc
                  {selectedColor && (
                    <span className="font-semibold text-gray-700 normal-case">{selectedColor.name}</span>
                  )}
                </p>
                <div className="flex gap-3 flex-wrap items-center">
                  {variants.colors.map((color) => (
                    <div key={color.name} className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => setSelectedColor(color)}
                        className={`rounded-xl overflow-hidden border-2 transition-all ${
                          selectedColor?.name === color.name
                            ? 'border-red-500 ring-2 ring-red-200 shadow-md'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                        title={color.name}
                      >
                        <div
                          className="w-12 h-12 flex items-center justify-center overflow-hidden"
                          style={{ backgroundColor: color.hex || '#6b7280' }}
                        >
                          {color.imageUrl ? (
                            <img
                              src={color.imageUrl}
                              alt={color.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <span className="text-[9px] text-white font-bold drop-shadow text-center leading-tight px-1"> </span>
                          )}
                        </div>
                      </button>
                      <span className="text-[10px] text-gray-500 font-medium">{color.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Add to cart */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 text-lg font-black text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  −
                </button>
                <span className="w-14 text-center font-bold text-lg">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                  className="w-10 h-10 text-lg font-black text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  +
                </button>
              </div>

              <button
                onClick={addToCart}
                disabled={product.stock <= 0}
                className="flex-1 py-3 px-6 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm hover:shadow-md"
              >
                {product.stock > 0 ? '🛒  Thêm vào giỏ hàng' : 'Hết hàng'}
              </button>
            </div>

            {/* Description */}
            {(product.description || specifications) && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
                {product.description && (
                  <div>
                    <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide mb-2 flex items-center gap-2">
                      <span className="w-1 h-4 bg-red-500 rounded-full inline-block" />
                      Mô tả sản phẩm
                    </h2>
                    {product.description.includes('<') ? (
                      <div
                        className="text-sm text-gray-600 leading-relaxed [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-red-600 [&_a]:underline"
                        dangerouslySetInnerHTML={{ __html: product.description }}
                      />
                    ) : (
                      <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
                    )}
                  </div>
                )}

                {Object.keys(specifications || {}).some((k) => specifications[k]) && (
                  <div>
                    <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <span className="w-1 h-4 bg-red-500 rounded-full inline-block" />
                      Thông số kỹ thuật
                    </h2>
                    <div className="space-y-2">
                      {Object.entries(specifications).filter(([, v]) => v).map(([key, value]) => (
                        <div key={key} className="flex justify-between gap-4 text-sm border-b border-gray-50 pb-2 last:border-0">
                          <span className="text-gray-500 font-medium capitalize">{key}</span>
                          <span className="text-gray-800 font-semibold text-right">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Policies */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: '🛡️', label: 'Bảo hành 12 tháng' },
                { icon: '🚀', label: 'Giao hàng 2h' },
                { icon: '💎', label: 'Đổi mới 30 ngày' },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-2.5 bg-white border border-gray-100 rounded-xl px-3 py-2.5">
                  <span className="text-lg">{icon}</span>
                  <span className="text-[11px] font-bold text-gray-600">{label}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};
