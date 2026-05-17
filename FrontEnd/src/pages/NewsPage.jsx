import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { newsService } from '../services/newsService';

const CATEGORIES = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'CONG_NGHE', label: 'Tin tức công nghệ' },
  { value: 'KHUYEN_MAI', label: 'Khuyến mãi' },
  { value: 'DANH_GIA', label: 'Đánh giá sản phẩm' },
  { value: 'HUONG_DAN', label: 'Hướng dẫn' },
  { value: 'SU_KIEN', label: 'Sự kiện' },
];

const BADGE_COLORS = {
  Hot: 'bg-red-600',
  'Khuyến mãi': 'bg-orange-500',
  'So sánh': 'bg-blue-500',
  'Hướng dẫn': 'bg-green-500',
  'Mới': 'bg-purple-500',
};

const formatDate = (str) => {
  if (!str) return '';
  try {
    return new Date(str).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return str; }
};

export const NewsPage = () => {
  const [featured, setFeatured] = useState(null);
  const [news, setNews] = useState([]);
  const [category, setCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    document.title = 'Tin tức | HHShop';
    window.scrollTo(0, 0);
    loadNews(0, true);
  }, [category]);

  const loadNews = async (pageNum, reset = false) => {
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      const res = category === 'ALL'
        ? await newsService.getPublishedNews(pageNum, 9)
        : await newsService.getNewsByCategory(category, pageNum, 9);
      const items = res.content || [];
      setTotalPages(res.totalPages);
      setHasMore(pageNum < res.totalPages - 1);

      if (reset || pageNum === 0) {
        const [first, ...rest] = items;
        setFeatured(first || null);
        setNews(rest);
      } else {
        setNews((prev) => [...prev, ...items]);
      }
      setPage(pageNum);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadNews(page + 1, false);
    }
  };

  const getBadgeColor = (badge) => BADGE_COLORS[badge] || 'bg-red-600';

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-slate-950 py-16">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-600 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600 rounded-full blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 text-center">
          <p className="text-xs font-black uppercase tracking-[0.4em] text-red-400 mb-3">HHShop News</p>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            Tin tức & Sự kiện
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-400">
            Cập nhật tin tức công nghệ mới nhất, đánh giá sản phẩm và khuyến mãi hấp dẫn từ HHShop.
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link to="/" className="transition-colors hover:text-red-600">Trang chủ</Link>
            <span>/</span>
            <span className="text-red-600">Tin tức</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 space-y-10">

        {/* Featured Article */}
        {loading ? (
          <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-sm animate-pulse">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="h-64 md:h-80 bg-slate-200" />
              <div className="flex flex-col justify-center p-8 md:p-10 space-y-3">
                <div className="h-3 w-24 bg-slate-200 rounded" />
                <div className="h-6 w-full bg-slate-200 rounded" />
                <div className="h-4 w-3/4 bg-slate-200 rounded" />
                <div className="h-4 w-full bg-slate-200 rounded" />
              </div>
            </div>
          </div>
        ) : featured ? (
          <Link
            to={`/tin-tuc/${featured.slug}`}
            className="group block relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-sm transition-all hover:shadow-lg"
          >
            <div className="grid md:grid-cols-2 gap-0">
              <div className="relative h-64 md:h-auto overflow-hidden bg-slate-100">
                <img
                  src={featured.imageUrl || `https://picsum.photos/seed/${featured.id}/800/500`}
                  alt={featured.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {featured.badge && (
                  <span className={`absolute top-4 left-4 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${getBadgeColor(featured.badge)}`}>
                    {featured.badge}
                  </span>
                )}
              </div>
              <div className="flex flex-col justify-center p-8 md:p-10">
                <p className="text-xs font-black uppercase tracking-widest text-red-600 mb-3">{featured.categoryLabel || featured.category}</p>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-snug mb-4 group-hover:text-red-600 transition-colors">
                  {featured.title}
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed mb-6">
                  {featured.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">{formatDate(featured.publishedAt)}</span>
                  <span className="rounded-xl bg-red-600 px-5 py-2.5 text-xs font-black text-white transition-all group-hover:bg-red-700">
                    Đọc tiếp
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ) : (
          <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-sm p-16 text-center">
            <p className="text-gray-400 font-bold">Chưa có bài viết nào</p>
          </div>
        )}

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`shrink-0 rounded-full px-5 py-2 text-xs font-black transition-all ${
                category === cat.value
                  ? 'bg-red-600 text-white shadow-lg shadow-red-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-red-200 hover:text-red-600'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* News Grid */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm animate-pulse">
                <div className="h-44 bg-slate-200" />
                <div className="p-5 space-y-3">
                  <div className="h-2 w-16 bg-slate-200 rounded" />
                  <div className="h-4 w-full bg-slate-200 rounded" />
                  <div className="h-4 w-2/3 bg-slate-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : news.length === 0 && !loading ? (
          <div className="py-16 text-center">
            <p className="text-gray-400 font-bold">Không có bài viết nào trong danh mục này</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((item) => (
              <Link
                key={item.id}
                to={`/tin-tuc/${item.slug}`}
                className="group block cursor-pointer overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative h-44 overflow-hidden bg-slate-100">
                  <img
                    src={item.imageUrl || `https://picsum.photos/seed/${item.id}/600/400`}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { e.target.src = `https://picsum.photos/seed/${item.id}/600/400`; }}
                  />
                  {item.badge && (
                    <span className={`absolute top-3 left-3 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${getBadgeColor(item.badge)}`}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{item.categoryLabel || item.category}</p>
                  <h3 className="font-black text-slate-900 text-sm leading-snug mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-3">
                    {item.excerpt}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-400">{formatDate(item.publishedAt)}</span>
                    <span className="text-xs font-black text-red-600 group-hover:text-red-700 transition-colors">
                      Đọc tiếp →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Load More */}
        {!loading && hasMore && (
          <div className="flex justify-center">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="rounded-2xl border-2 border-slate-200 bg-white px-10 py-3.5 text-sm font-black text-slate-600 transition-all hover:border-red-200 hover:text-red-600 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loadingMore ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-red-600 rounded-full animate-spin" />
                  Đang tải...
                </>
              ) : 'Xem thêm tin tức'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsPage;
