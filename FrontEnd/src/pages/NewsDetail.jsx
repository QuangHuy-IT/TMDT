import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { newsService } from '../services/newsService';

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
    return new Date(str).toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return str;
  }
};

export const NewsDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [news, setNews] = useState(null);
  const [relatedNews, setRelatedNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = 'Đang tải... | HHShop';
    window.scrollTo(0, 0);
    loadNews();
  }, [slug]);

  const loadNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await newsService.getNewsBySlug(slug);
      setNews(data);
      document.title = `${data.title} | HHShop`;

      // Load related news (same category, exclude current)
      if (data.category) {
        try {
          const related = await newsService.getNewsByCategory(data.category, 0, 4);
          const items = related.content || [];
          setRelatedNews(items.filter((n) => n.slug !== slug).slice(0, 3));
        } catch {
          setRelatedNews([]);
        }
      }
    } catch (e) {
      console.error(e);
      setError('Không tìm thấy bài viết này.');
    } finally {
      setLoading(false);
    }
  };

  const getBadgeColor = (badge) => BADGE_COLORS[badge] || 'bg-red-600';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-32 bg-slate-200 rounded" />
            <div className="h-12 w-full bg-slate-200 rounded" />
            <div className="h-96 bg-slate-200 rounded-2xl" />
            <div className="space-y-4">
              <div className="h-4 w-full bg-slate-200 rounded" />
              <div className="h-4 w-3/4 bg-slate-200 rounded" />
              <div className="h-4 w-full bg-slate-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-black text-slate-900">Không tìm thấy bài viết</h2>
          <p className="mt-2 text-sm text-slate-500">Bài viết có thể đã bị xóa hoặc không tồn tại.</p>
          <Link
            to="/tin-tuc"
            className="mt-6 inline-block rounded-xl bg-red-600 px-6 py-3 text-sm font-black text-white hover:bg-red-700 transition-colors"
          >
            ← Quay lại trang tin tức
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Hero Image */}
      <div className="relative h-72 md:h-96 overflow-hidden bg-slate-200">
        {news.imageUrl ? (
          <img src={news.imageUrl} alt={news.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100">
            <svg className="w-20 h-20 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        )}
        {news.badge && (
          <span className={`absolute top-4 left-4 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${getBadgeColor(news.badge)}`}>
            {news.badge}
          </span>
        )}
      </div>

      <div className="mx-auto max-w-4xl px-4 -mt-12 relative z-10">
        {/* Article Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          {/* Breadcrumb */}
          <div className="px-6 pt-6">
            <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Link to="/" className="transition-colors hover:text-red-600">Trang chủ</Link>
              <span>/</span>
              <Link to="/tin-tuc" className="transition-colors hover:text-red-600">Tin tức</Link>
              <span>/</span>
              <span className="text-slate-700 truncate max-w-[200px]">{news.categoryLabel || news.category}</span>
            </nav>
          </div>

          {/* Header */}
          <div className="px-6 pb-6">
            <p className="text-xs font-black uppercase tracking-widest text-red-600 mt-4 mb-3">
              {news.categoryLabel || news.category}
            </p>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight mb-4">
              {news.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pb-6 border-b border-slate-100">
              {news.authorName && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {news.authorName}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(news.publishedAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {news.viewCount || 0} lượt xem
              </span>
            </div>
          </div>

          {/* Excerpt */}
          {news.excerpt && (
            <div className="px-6 pb-6">
              <p className="text-base text-slate-600 italic border-l-4 border-red-500 pl-4 leading-relaxed">
                {news.excerpt}
              </p>
            </div>
          )}

          {/* Content */}
          <div className="px-6 pb-8">
            {news.content ? (
              <div
                className="prose prose-slate max-w-none prose-headings:font-black prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-red-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:shadow-md"
                dangerouslySetInnerHTML={{ __html: news.content }}
              />
            ) : (
              <p className="text-slate-500 text-center py-12">Nội dung đang được cập nhật...</p>
            )}
          </div>

          {/* Share */}
          <div className="px-6 py-6 border-t border-slate-100 bg-slate-50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700">Chia sẻ bài viết</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigator.share?.({ title: news.title, url: window.location.href })}
                  className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 transition-all"
                  title="Chia sẻ"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Đã copy link!');
                  }}
                  className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 transition-all"
                  title="Copy link"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Related News */}
        {relatedNews.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-black text-slate-900 mb-6">Bài viết liên quan</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedNews.map((item) => (
                <Link
                  key={item.id}
                  to={`/tin-tuc/${item.slug}`}
                  className="group block overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative h-40 overflow-hidden bg-slate-100">
                    <img
                      src={item.imageUrl || `https://picsum.photos/seed/${item.id}/600/400`}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => { e.target.src = `https://picsum.photos/seed/${item.id}/600/400`; }}
                    />
                    {item.badge && (
                      <span className={`absolute top-3 left-3 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${getBadgeColor(item.badge)}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                      {item.categoryLabel || item.category}
                    </p>
                    <h3 className="font-black text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-red-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                      {item.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Link
            to="/tin-tuc"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-600 transition-all hover:border-red-300 hover:text-red-600 hover:-translate-y-0.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lại trang tin tức
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NewsDetail;
