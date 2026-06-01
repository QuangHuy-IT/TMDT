import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { newsService } from '../../services/newsService';
import HomeSectionShell from './HomeSectionShell';

const BADGE_COLORS = {
  Hot: 'bg-red-600',
  'Khuyến mãi': 'bg-orange-500',
  'So sánh': 'bg-blue-500',
  'Hướng dẫn': 'bg-green-500',
  'Mới': 'bg-purple-500',
};

const getBadgeColor = (badge) => BADGE_COLORS[badge] || 'bg-red-600';

const formatDate = (str) => {
  if (!str) return '';
  try {
    return new Date(str).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return str; }
};

const NewsSection = () => {
  const { data: newsItems, isLoading } = useQuery({
    queryKey: ['recentNews5'],
    queryFn: async () => {
      const res = await newsService.getRecentNews(5);
      return Array.isArray(res) ? res : (res?.content || []);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes cache
  });

  const newsList = (newsItems || []).slice(0, 5);

  if (!isLoading && newsList.length === 0) {
    return null;
  }

  return (
    <HomeSectionShell>
      {/* Header */}
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Tin tức mới nhất</p>
          <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-slate-950">Tin tức</h2>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Cập nhật xu hướng công nghệ, mẹo vặt và những tin tức khuyến mãi mới nhất.
          </p>
        </div>
        <Link to="/tin-tuc" className="text-xs font-black uppercase tracking-[0.2em] text-red-600 hover:text-red-700 whitespace-nowrap shrink-0">
          Xem tất cả
        </Link>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {isLoading
          ? Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm animate-pulse animate-duration-1000"
              >
                <div className="h-40 bg-slate-200" />
                <div className="p-4 space-y-3">
                  <div className="h-2 w-16 bg-slate-200 rounded" />
                  <div className="h-4 w-full bg-slate-200 rounded" />
                  <div className="h-3 w-5/6 bg-slate-200 rounded" />
                  <div className="h-2 w-1/2 bg-slate-200 rounded" />
                </div>
              </div>
            ))
          : newsList.map((item) => (
              <Link
                key={item.id}
                to={`/tin-tuc/${item.slug}`}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
              >
                <div>
                  {/* Image container */}
                  <div className="relative h-40 overflow-hidden bg-slate-100">
                    <img
                      src={item.imageUrl || `https://picsum.photos/seed/${item.id}/600/400`}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${item.id}/600/400`; }}
                    />
                    {item.badge && (
                      <span className={`absolute top-3 left-3 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${getBadgeColor(item.badge)}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                      {item.categoryLabel || item.category}
                    </p>
                    <h3 className="font-black text-slate-900 text-sm leading-snug mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {item.excerpt}
                    </p>
                  </div>
                </div>

                {/* Footer link */}
                <div className="px-4 pb-4 pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <span className="text-[10px] font-semibold text-slate-400">
                    {formatDate(item.publishedAt)}
                  </span>
                  <span className="text-[11px] font-black text-red-600 group-hover:text-red-700 transition-colors flex items-center gap-0.5">
                    Đọc tiếp <span className="transition-transform group-hover:translate-x-0.5">→</span>
                  </span>
                </div>
              </Link>
            ))}
      </div>
    </HomeSectionShell>
  );
};

export default NewsSection;
