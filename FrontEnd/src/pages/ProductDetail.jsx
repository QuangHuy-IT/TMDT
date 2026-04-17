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
          const name = item.name || item.color || 'Mac dinh';
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
        setError('Khong tai duoc thong tin san pham.');
        setProduct(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchDetail();

    return () => {
      mounted = false;
    };
  }, [id]);

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
        <p className="text-sm font-bold text-gray-500">Dang tai chi tiet san pham...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <h2 className="text-2xl font-black text-gray-800">Khong tim thay san pham</h2>
        <p className="text-sm text-gray-500 mt-2">{error || 'San pham khong ton tai hoac da bi xoa.'}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 px-6 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700"
        >
          Ve trang chu
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f8f6] pb-20">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <nav className="flex items-center gap-2 text-xs text-gray-400 mb-6">
          <button onClick={() => navigate('/')} className="hover:text-red-600">Trang chu</button>
          <span>/</span>
          <span className="text-gray-700">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="bg-white border border-gray-100 rounded-2xl p-4">
            <div className="aspect-square bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden">
              <img
                src={images[activeImage] || 'https://picsum.photos/seed/fallback/700/700'}
                alt={product.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.src = 'https://picsum.photos/seed/fallback/700/700';
                }}
              />
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    onClick={() => setActiveImage(index)}
                    className={`w-16 h-16 rounded-lg border overflow-hidden ${activeImage === index ? 'border-red-500' : 'border-gray-200'}`}
                  >
                    <img src={image} alt="thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-red-50 text-red-600 font-bold uppercase tracking-wide">
                {product.brand || 'Khac'}
              </span>
              <span className={`text-[11px] font-bold uppercase ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {product.stock > 0 ? `Con ${product.stock} san pham` : 'Het hang'}
              </span>
            </div>

            <h1 className="text-3xl font-black text-gray-900">{product.name}</h1>

            <p className="text-3xl font-black text-red-600">{Number(currentPrice || 0).toLocaleString('vi-VN')}₫</p>

            {product.variants?.storages?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Dung luong</p>
                <div className="flex gap-2 flex-wrap">
                  {product.variants.storages.map((storage) => (
                    <button
                      key={storage}
                      onClick={() => setSelectedStorage(storage)}
                      className={`px-3 py-2 rounded-lg border text-sm font-bold ${selectedStorage === storage ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-200 text-gray-700'}`}
                    >
                      {storage}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.variants?.colors?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Mau sac</p>
                <div className="flex gap-3 flex-wrap">
                  {product.variants.colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color)}
                      className={`w-9 h-9 rounded-full border-2 ${selectedColor?.name === color.name ? 'border-gray-900' : 'border-gray-300'}`}
                      style={{ backgroundColor: color.hex || '#6b7280' }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 text-lg font-black text-gray-500 hover:text-red-600"
                >
                  -
                </button>
                <span className="w-12 text-center font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                  className="w-10 h-10 text-lg font-black text-gray-500 hover:text-red-600"
                >
                  +
                </button>
              </div>

              <button
                onClick={addToCart}
                disabled={product.stock <= 0}
                className="px-6 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Them vao gio hang
              </button>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl p-4">
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide mb-2">Mo ta</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                {product.description || 'San pham dang duoc cap nhat mo ta.'}
              </p>
            </div>

            {Object.keys(product.specifications || {}).length > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide mb-3">Thong so ky thuat</h2>
                <div className="space-y-2">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-4 text-sm border-b border-gray-100 pb-2">
                      <span className="text-gray-500">{key}</span>
                      <span className="text-gray-800 font-medium text-right">{String(value || '')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
};
