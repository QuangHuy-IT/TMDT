import React, { useState, useContext, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { products } from '../data/products';
import { getReviewsByProductId } from '../data/reviews';

// ─── StarPicker ──────────────────────────────────────────────────────────────
const StarPicker = ({ value, onChange }) => (
  <div className="flex items-center gap-1">
    {[1,2,3,4,5].map((s) => (
      <button key={s} type="button" onClick={() => onChange(s)}
        className="transition-transform hover:scale-125 active:scale-95">
        <svg className={`w-7 h-7 transition-colors ${s <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-100 hover:text-yellow-200'}`} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      </button>
    ))}
    <span className="ml-2 text-sm font-bold text-gray-500">
      {['','Rất tệ','Tệ','Bình thường','Tốt','Xuất sắc'][value]}
    </span>
  </div>
);

// ─── RatingBar ───────────────────────────────────────────────────────────────
const RatingBar = ({ star, count, total }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-bold text-gray-500 w-3 text-right">{star}</span>
      <svg className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 flex-shrink-0" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
      </svg>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-yellow-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }}/>
      </div>
      <span className="text-xs text-gray-400 w-6 text-right">{count}</span>
    </div>
  );
};

// ─── ReviewCard ──────────────────────────────────────────────────────────────
const AVATAR_COLORS = ['bg-red-500','bg-blue-500','bg-green-500','bg-purple-500','bg-amber-500','bg-pink-500','bg-teal-500'];

const ReviewCard = ({ review }) => {
  const color = AVATAR_COLORS[review.userName.charCodeAt(0) % AVATAR_COLORS.length];
  const [liked, setLiked] = useState(false);
  const [helpCount, setHelpCount] = useState(review.helpful || 0);
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center font-black text-white text-sm flex-shrink-0 uppercase`}>
            {review.userName.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">{review.userName}</p>
            <p className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</p>
          </div>
        </div>
        <div className="flex gap-0.5 flex-shrink-0">
          {[1,2,3,4,5].map((s) => (
            <svg key={s} className={`w-4 h-4 ${s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          ))}
        </div>
      </div>
      {review.title && <p className="font-bold text-gray-800 text-sm mb-1">{review.title}</p>}
      <p className="text-gray-600 text-sm leading-relaxed mb-4">{review.comment}</p>
      <button onClick={() => { setLiked(v => !v); setHelpCount(c => liked ? c-1 : c+1); }}
        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${liked ? 'border-red-200 bg-red-50 text-red-500 font-bold' : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'}`}>
        <svg className="w-3.5 h-3.5" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
        </svg>
        Hữu ích ({helpCount})
      </button>
    </div>
  );
};

// ─── Main ────────────────────────────────────────────────────────────────────
export const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch } = useContext(ShopContext);
  const { isAuthenticated, user } = state;

  const [activeImg,    setActiveImg]    = useState(0);
  const [quantity,     setQuantity]     = useState(1);
  // Variants
  const [selStorage,   setSelStorage]   = useState(null);
  const [selColor,     setSelColor]     = useState(null);
  // Reviews
  const [localReviews, setLocalReviews] = useState(() => getReviewsByProductId(id));
  const [sortBy,       setSortBy]       = useState('newest');
  const [filterStar,   setFilterStar]   = useState(0);
  const [showAll,      setShowAll]      = useState(false);
  // Review form
  const [newRating,    setNewRating]    = useState(5);
  const [newTitle,     setNewTitle]     = useState('');
  const [newComment,   setNewComment]   = useState('');
  const [submitted,    setSubmitted]    = useState(false);
  const [formError,    setFormError]    = useState('');
  // Tab dưới: mô tả vs thông số
  const [activeTab,    setActiveTab]    = useState('desc');

  const REVIEWS_PER_PAGE = 4;

  const product = useMemo(() =>
    products.find((p) => p._id === id || p.id === Number(id)), [id]);

  // Init variants khi product load
  useMemo(() => {
    if (product?.variants) {
      setSelStorage(product.variants.storages[0]);
      setSelColor(product.variants.colors[0]);
    }
  }, [product?._id]);

  if (!product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gray-50">
        <div className="text-8xl mb-4">🔍</div>
        <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">Sản phẩm không tồn tại!</h2>
        <p className="text-gray-500 mb-6">Đường dẫn bị hỏng hoặc sản phẩm đã ngừng kinh doanh.</p>
        <button onClick={() => navigate('/')}
          className="px-10 py-3 bg-red-600 text-white font-black rounded-full hover:bg-red-700 transition-all">
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  const images   = product.images || (product.image ? [product.image] : []);
  const specs    = product.specifications;
  const variants = product.variants;

  // Giá theo storage đã chọn
  const currentPrice = selStorage && variants?.basePrices?.[selStorage]
    ? variants.basePrices[selStorage]
    : product.price;

  // Rating tổng hợp
  const avgRating = localReviews.length > 0
    ? (localReviews.reduce((s, r) => s + r.rating, 0) / localReviews.length).toFixed(1)
    : (product.rating || 5).toFixed(1);
  const ratingDist = [5,4,3,2,1].map(star => ({
    star, count: localReviews.filter(r => r.rating === star).length,
  }));

  const processedReviews = useMemo(() => {
    let list = filterStar > 0
      ? localReviews.filter(r => r.rating === filterStar)
      : [...localReviews];
    if (sortBy === 'newest')  list.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sortBy === 'highest') list.sort((a,b) => b.rating - a.rating);
    if (sortBy === 'lowest')  list.sort((a,b) => a.rating - b.rating);
    if (sortBy === 'helpful') list.sort((a,b) => (b.helpful||0) - (a.helpful||0));
    return list;
  }, [localReviews, sortBy, filterStar]);

  const displayedReviews = showAll ? processedReviews : processedReviews.slice(0, REVIEWS_PER_PAGE);

  const handleAddToCart = () => {
    if (!isAuthenticated) { navigate('/login', { state: { from: location } }); return; }
    if (product.stock === 0) return;
    dispatch({
      type: 'ADD_TO_CART',
      payload: {
        ...product,
        quantity,
        selectedStorage: selStorage,
        selectedColor: selColor,
        price: currentPrice,
      },
    });
    alert(`Đã thêm ${quantity}× ${product.name}${selStorage ? ` (${selStorage}` : ''}${selColor ? `, ${selColor.name})` : ''} vào giỏ hàng!`);
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    setFormError('');
    if (!isAuthenticated) { navigate('/login', { state: { from: location } }); return; }
    if (newComment.trim().length < 10) { setFormError('Bình luận phải có ít nhất 10 ký tự.'); return; }
    setLocalReviews(prev => [{
      _id: `local_${Date.now()}`,
      productId: id,
      userId: user?._id || 'local',
      userName: user?.name || 'Bạn',
      rating: newRating,
      title: newTitle.trim(),
      comment: newComment.trim(),
      helpful: 0,
      createdAt: new Date().toISOString(),
    }, ...prev]);
    setNewRating(5); setNewTitle(''); setNewComment('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  const StarRow = ({ rating, size = 5 }) => (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} className={`w-${size} h-${size} ${s <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );

  return (
    <main className="min-h-screen bg-[#f8f8f6] pb-20">
      <div className="max-w-7xl mx-auto px-4 pt-8">

        {/* Breadcrumb */}
        <nav className="flex items-center text-[10px] font-black uppercase tracking-widest text-gray-400 mb-8 gap-3">
          <span className="hover:text-red-600 cursor-pointer" onClick={() => navigate('/')}>Trang chủ</span>
          <span className="text-gray-300">/</span>
          <span className="hover:text-red-600 cursor-pointer" onClick={() => navigate('/tim-kiem')}>Cửa hàng</span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-700 font-black">{product.name}</span>
        </nav>

        {/* ══ PHẦN TRÊN: 2 cột ══════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          {/* CỘT TRÁI: Gallery */}
          <div className="sticky top-24">
            {/* Ảnh chính */}
            <div className="relative bg-white rounded-3xl aspect-square flex items-center justify-center
                            border border-gray-100 overflow-hidden shadow-lg mb-4 group">
              {product.stock === 0 && (
                <div className="absolute inset-0 bg-black/20 z-10 flex items-center justify-center rounded-3xl">
                  <span className="bg-white text-gray-800 font-black text-xs uppercase tracking-widest px-4 py-2 rounded-full shadow">
                    Hết hàng
                  </span>
                </div>
              )}
              {/* Màu được chọn overlay (nếu có) */}
              {selColor && (
                <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-sm
                                px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
                  <div className="w-3 h-3 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: selColor.hex }} />
                  <span className="text-[10px] font-bold text-gray-600">{selColor.name}</span>
                </div>
              )}
              <img
                src={images[activeImg] || 'https://picsum.photos/seed/fallback/400/400'}
                alt={product.name}
                className="w-4/5 h-4/5 object-contain group-hover:scale-105 transition-transform duration-500"
                onError={(e) => { e.target.src = 'https://picsum.photos/seed/fallback/400/400'; }}
              />
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2.5 justify-center">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all ${
                      activeImg === i ? 'border-red-500 shadow-md scale-105' : 'border-gray-200 opacity-60 hover:opacity-100'
                    }`}>
                    <img src={img} alt="" className="w-full h-full object-contain bg-gray-50 p-1"
                      onError={(e) => { e.target.src = 'https://picsum.photos/seed/fallback/80/80'; }}/>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CỘT PHẢI: Mua hàng */}
          <div className="flex flex-col gap-6 pt-2">

            {/* Brand + Stock */}
            <div className="flex items-center gap-3">
              <span className="bg-red-50 text-red-600 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-widest">
                {product.brand}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5
                ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${product.stock > 0 ? 'bg-green-500 animate-ping' : 'bg-red-400'}`}/>
                {product.stock > 0 ? `Còn ${product.stock} sản phẩm` : 'Hết hàng'}
              </span>
            </div>

            {/* Tên sản phẩm */}
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight tracking-tight">
              {product.name}
            </h1>

            {/* Rating tóm tắt */}
            <div className="flex items-center gap-3">
              <StarRow rating={avgRating} size={5} />
              <span className="text-base font-black text-gray-900">{avgRating}</span>
              <span className="text-sm text-gray-400">({localReviews.length} đánh giá)</span>
              <button
                onClick={() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm text-red-500 font-bold hover:underline">
                Xem →
              </button>
            </div>

            {/* ── GIÁ ── */}
            <div className="bg-gray-900 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-28 h-28 bg-red-600/15 blur-3xl rounded-full -mr-10 -mt-10"/>
              <div className="relative z-10">
                <p className="text-4xl font-black text-red-400 tracking-tight">
                  {currentPrice.toLocaleString('vi-VN')}₫
                </p>
                {selStorage && currentPrice !== product.price}
                <p className="text-[10px] text-gray-400 mt-3 uppercase tracking-[0.2em]">
                  Miễn phí vận chuyển · Bảo hành 12 tháng chính hãng
                </p>
              </div>
            </div>

            {/* ── CHỌN DUNG LƯỢNG ── */}
            {variants?.storages && variants.storages.length > 0 && (
              <div>
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">
                  Dung lượng
                  {selStorage && <span className="text-gray-900 ml-2 normal-case font-bold">· {selStorage}</span>}
                </p>
                <div className="flex flex-wrap gap-2">
                  {variants.storages.map((s) => {
                    const price = variants.basePrices?.[s];
                    const isActive = selStorage === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setSelStorage(s)}
                        className={`relative flex flex-col items-center px-4 py-2.5 rounded-xl border-2 text-sm
                                    font-bold transition-all duration-200 min-w-[72px] ${
                          isActive
                            ? 'border-red-500 bg-red-50 text-red-700 shadow-sm'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
                        }`}
                      >
                        <span>{s}</span>
                        {price && (
                          <span className={`text-[10px] font-bold mt-0.5 ${isActive ? 'text-red-500' : 'text-gray-400'}`}>
                            {(price / 1e6).toFixed(0)}tr
                          </span>
                        )}
                        {isActive && (
                          <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── CHỌN MÀU ── */}
            {variants?.colors && variants.colors.length > 0 && (
              <div>
                <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">
                  Màu sắc
                  {selColor && <span className="text-gray-900 ml-2 normal-case font-bold">· {selColor.name}</span>}
                </p>
                <div className="flex flex-wrap gap-3">
                  {variants.colors.map((c) => {
                    const isActive = selColor?.name === c.name;
                    return (
                      <button
                        key={c.name}
                        onClick={() => setSelColor(c)}
                        title={c.name}
                        className={`relative w-9 h-9 rounded-full border-2 transition-all duration-200 ${
                          isActive ? 'border-gray-900 scale-110 shadow-md' : 'border-gray-300 hover:border-gray-500 hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {isActive && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-full">
                            <svg className="w-4 h-4 drop-shadow" fill="none" stroke="white" strokeWidth={2.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                {/* Màu tên hàng ngang */}
                {/* <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {variants.colors.map((c) => (
                    <button key={c.name} onClick={() => setSelColor(c)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                        selColor?.name === c.name
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                      }`}>
                      {c.name}
                    </button>
                  ))}
                </div> */}
              </div>
            )}

            {/* ── SỐ LƯỢNG + NÚT THÊM GIỎ ── */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {/* Số lượng */}
              <div className="flex items-center bg-white border-2 border-gray-200 rounded-2xl overflow-hidden flex-shrink-0">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-11 h-12 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors text-lg font-black">
                  −
                </button>
                <span className="w-12 text-center font-black text-lg text-gray-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(product.stock || 99, q + 1))}
                  className="w-11 h-12 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors text-lg font-black">
                  +
                </button>
              </div>

              {/* Nút thêm giỏ */}
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 flex items-center justify-center gap-3 py-3.5 bg-red-600 hover:bg-red-700
                           disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-black text-sm
                           uppercase tracking-widest rounded-2xl transition-all active:scale-[0.98]
                           shadow-lg shadow-red-200 hover:shadow-red-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                {product.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ hàng'}
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {[
                { icon: '🛡️', t: '100% chính hãng',  s: 'Bảo hành 12 tháng' },
                { icon: '🚀', t: 'Giao hàng 2h',      s: 'Miễn phí từ 10 triệu' },
                { icon: '♻️', t: 'Đổi trả 30 ngày',   s: 'Lỗi là đổi ngay' },
                { icon: '💳', t: 'Thanh toán an toàn', s: 'Mã hóa SSL' },
              ].map(({ icon, t, s }) => (
                <div key={t} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-gray-100">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <p className="text-xs font-black text-gray-800">{t}</p>
                    <p className="text-[10px] text-gray-400">{s}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ PHẦN DƯỚI: Mô tả + Thông số + Đánh giá ══════════════ */}
        <div className="mt-16">

          {/* Tab navigation */}
          <div className="flex border-b border-gray-200 mb-8 gap-1">
            {[
              { key: 'desc',    label: 'Mô tả sản phẩm' },
              { key: 'specs',   label: 'Thông số kỹ thuật' },
              { key: 'reviews', label: `Đánh giá (${localReviews.length})` },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-6 py-3 text-sm font-bold transition-all relative ${
                  activeTab === key
                    ? 'text-red-600'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {label}
                {activeTab === key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-full"/>
                )}
              </button>
            ))}
          </div>

          {/* Tab: Mô tả */}
          {activeTab === 'desc' && (
            <div className="max-w-3xl">
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <p className="text-gray-600 leading-relaxed text-base border-l-4 border-red-600 pl-5 italic font-medium">
                  {product.description}
                </p>
                {product.isFeatured && (
                  <div className="mt-6 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-4 py-2.5 rounded-xl border border-amber-200">
                    <span>⭐</span>
                    <span className="font-bold">Sản phẩm nổi bật — được khách hàng tin tưởng</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Thông số */}
          {activeTab === 'specs' && specs && (
            <div className="max-w-3xl">
              <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
                {Object.entries(specs).map(([key, value], i) => {
                  const labels = {
                    screen: 'Màn hình', cpu: 'Vi xử lý', ram: 'RAM',
                    storage: 'Bộ nhớ', battery: 'Pin', camera: 'Camera',
                    os: 'Hệ điều hành', connectivity: 'Kết nối',
                  };
                  return (
                    <div key={key} className={`flex gap-4 px-6 py-4 text-sm ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/70'}`}>
                      <span className="text-gray-400 font-bold w-32 flex-shrink-0">{labels[key] || key}</span>
                      <span className="text-gray-800 font-medium">{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab: Đánh giá */}
          {activeTab === 'reviews' && (
            <div id="reviews-section">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                {/* Tổng quan rating */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm sticky top-24">
                    <div className="text-center mb-6">
                      <p className="text-6xl font-black text-gray-900 leading-none">{avgRating}</p>
                      <div className="flex justify-center my-3">
                        <StarRow rating={avgRating} size={6}/>
                      </div>
                      <p className="text-sm text-gray-400">{localReviews.length} đánh giá</p>
                    </div>
                    <div className="space-y-2 mb-6">
                      {ratingDist.map(({ star, count }) => (
                        <RatingBar key={star} star={star} count={count} total={localReviews.length}/>
                      ))}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Lọc theo sao</p>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => { setFilterStar(0); setShowAll(false); }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${filterStar === 0 ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}>
                          Tất cả
                        </button>
                        {[5,4,3,2,1].map(s => (
                          <button key={s} onClick={() => { setFilterStar(s); setShowAll(false); }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${filterStar === s ? 'bg-yellow-400 text-yellow-900 border-yellow-400' : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}>
                            {s} ★
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Danh sách + Form */}
                <div className="lg:col-span-2 space-y-6">

                  {/* Form */}
                  <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
                    <div className="bg-gray-900 px-6 py-4">
                      <h3 className="text-white font-black">
                        {isAuthenticated ? 'Viết đánh giá của bạn' : 'Đăng nhập để đánh giá'}
                      </h3>
                      {isAuthenticated && <p className="text-gray-400 text-xs mt-0.5">Với tư cách: <span className="text-white font-bold">{user?.name}</span></p>}
                    </div>
                    <div className="p-6">
                      {submitted && (
                        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 rounded-2xl px-4 py-3 mb-4 text-sm font-bold">
                          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          Cảm ơn! Đánh giá của bạn đã được đăng.
                        </div>
                      )}
                      {!isAuthenticated ? (
                        <div className="text-center py-6">
                          <p className="text-gray-500 text-sm mb-4">Bạn cần đăng nhập để viết đánh giá</p>
                          <button onClick={() => navigate('/login', { state: { from: location } })}
                            className="px-8 py-3 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all text-sm">
                            Đăng nhập ngay
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleSubmitReview} className="space-y-4">
                          <div>
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Đánh giá *</label>
                            <StarPicker value={newRating} onChange={setNewRating}/>
                          </div>
                          <div>
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Tiêu đề (tuỳ chọn)</label>
                            <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                              placeholder="Tóm tắt đánh giá..." maxLength={80}
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"/>
                          </div>
                          <div>
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">Nội dung *</label>
                            <textarea value={newComment} onChange={e => { setNewComment(e.target.value); setFormError(''); }}
                              placeholder="Chia sẻ trải nghiệm của bạn... (tối thiểu 10 ký tự)" rows={4} maxLength={1000}
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all resize-none"/>
                            <div className="flex justify-between mt-1">
                              {formError ? <p className="text-xs text-red-500 font-bold">{formError}</p> : <span/>}
                              <p className="text-xs text-gray-400 text-right">{newComment.length}/1000</p>
                            </div>
                          </div>
                          <button type="submit"
                            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition-all active:scale-[0.98] text-sm uppercase tracking-widest shadow-lg shadow-red-100">
                            Gửi đánh giá
                          </button>
                        </form>
                      )}
                    </div>
                  </div>

                  {/* Sort + list */}
                  {localReviews.length > 0 && (
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <p className="text-sm font-bold text-gray-500">
                        {filterStar > 0 ? `${processedReviews.length} đánh giá ${filterStar} sao` : `${localReviews.length} đánh giá`}
                      </p>
                      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                        {[{key:'newest',label:'Mới nhất'},{key:'helpful',label:'Hữu ích'},{key:'highest',label:'Sao cao'},{key:'lowest',label:'Sao thấp'}].map(({key,label}) => (
                          <button key={key} onClick={() => setSortBy(key)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sortBy === key ? 'bg-white shadow text-gray-900' : 'text-gray-400 hover:text-gray-700'}`}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {processedReviews.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
                      <p className="text-4xl mb-3">💬</p>
                      <p className="font-bold text-gray-700">{filterStar > 0 ? `Chưa có đánh giá ${filterStar} sao` : 'Chưa có đánh giá nào'}</p>
                      <p className="text-sm text-gray-400 mt-1">Hãy là người đầu tiên đánh giá!</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {displayedReviews.map(r => <ReviewCard key={r._id} review={r}/>)}
                      </div>
                      {processedReviews.length > REVIEWS_PER_PAGE && (
                        <div className="text-center">
                          <button onClick={() => setShowAll(v => !v)}
                            className="px-10 py-3 bg-white border-2 border-gray-900 text-gray-900 rounded-2xl font-black text-xs tracking-widest hover:bg-gray-900 hover:text-white transition-all active:scale-95">
                            {showAll ? 'Thu gọn' : `Xem thêm ${processedReviews.length - REVIEWS_PER_PAGE} đánh giá`}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </main>
  );
};