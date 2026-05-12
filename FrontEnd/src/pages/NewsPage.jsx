import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const NEWS_ITEMS = [
  {
    id: 1,
    category: 'Tin tức công nghệ',
    title: 'iPhone 17 Pro sẽ trang bị chip A19 Bionic thế hệ mới',
    excerpt: 'Apple được kỳ vọng sẽ ra mắt dòng iPhone 17 với chip A19 Bionic được sản xuất trên tiến trình 3nm thế hệ thứ hai, mang lại hiệu năng vượt trội và tiết kiệm năng lượng hơn.',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80',
    date: '10/05/2026',
    badge: 'Hot',
  },
  {
    id: 2,
    category: 'Khuyến mãi',
    title: 'HHShop tung chương trình Flash Sale tháng 5 - Giảm đến 50%',
    excerpt: 'Đón chào tháng 5, HHShop triển khai loạt khuyến mãi khủng với ưu đãi giảm đến 50% cho nhiều dòng sản phẩm smartphone từ các thương hiệu lớn như Samsung, Xiaomi, OPPO.',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&q=80',
    date: '08/05/2026',
    badge: 'Khuyến mãi',
  },
  {
    id: 3,
    category: 'Đánh giá sản phẩm',
    title: 'So sánh Samsung Galaxy S25 Ultra vs iPhone 16 Pro Max: Nên chọn máy nào?',
    excerpt: 'Hai flagship đình đám nhất 2025-2026: Galaxy S25 Ultra và iPhone 16 Pro Max. Cùng HHShop phân tích chi tiết từ thiết kế, camera, hiệu năng đến giá cả để bạn đưa ra quyết định phù hợp nhất.',
    image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&q=80',
    date: '05/05/2026',
    badge: 'So sánh',
  },
  {
    id: 4,
    category: 'Hướng dẫn',
    title: 'Cách chọn mua điện thoại phù hợp với nhu cầu và ngân sách',
    excerpt: 'Với vô số lựa chọn trên thị trường, việc chọn một chiếc điện thoại phù hợp không hề dễ dàng. HHShop sẽ hướng dẫn bạn những tiêu chí quan trọng nhất khi chọn mua smartphone.',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80',
    date: '01/05/2026',
    badge: 'Hướng dẫn',
  },
  {
    id: 5,
    category: 'Tin tức công nghệ',
    title: 'Xiaomi ra mắt dòng Xiaomi 15 với camera Leica 200MP',
    excerpt: 'Xiaomi vừa chính thức ra mắt dòng Xiaomi 15 series với hệ thống camera Leica đột phá lên đến 200MP, màn hình AMOLED 120Hz và vi xử lý Snapdragon 8 Gen 4 mạnh mẽ nhất.',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80',
    date: '28/04/2026',
    badge: null,
  },
  {
    id: 6,
    category: 'Sự kiện',
    title: 'HHShop khai trương 5 cửa hàng mới tại Hà Nội và TP.HCM',
    excerpt: 'Nhân dịp mở rộng hệ thống, HHShop chính thức khai trương 5 chi nhánh mới tại các vị trí chiến lược ở Hà Nội và TP.HCM, nâng tổng số cửa hàng toàn quốc lên con số ấn tượng.',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&q=80',
    date: '25/04/2026',
    badge: null,
  },
];

const CATEGORIES = ['Tất cả', 'Tin tức công nghệ', 'Khuyến mãi', 'Đánh giá sản phẩm', 'Hướng dẫn', 'Sự kiện'];

export const NewsPage = () => {
  useEffect(() => {
    document.title = 'Tin tức | HHShop';
    window.scrollTo(0, 0);
  }, []);

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
        <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="relative h-64 md:h-auto overflow-hidden bg-slate-100">
              <img
                src={NEWS_ITEMS[0].image}
                alt={NEWS_ITEMS[0].title}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                {NEWS_ITEMS[0].badge}
              </span>
            </div>
            <div className="flex flex-col justify-center p-8 md:p-10">
              <p className="text-xs font-black uppercase tracking-widest text-red-600 mb-3">{NEWS_ITEMS[0].category}</p>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 leading-snug mb-4">
                {NEWS_ITEMS[0].title}
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                {NEWS_ITEMS[0].excerpt}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">{NEWS_ITEMS[0].date}</span>
                <button className="rounded-xl bg-red-600 px-5 py-2.5 text-xs font-black text-white transition-all hover:bg-red-700 hover:-translate-y-0.5">
                  Đọc tiếp
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat, idx) => (
            <button
              key={cat}
              className={`shrink-0 rounded-full px-5 py-2 text-xs font-black transition-all ${
                idx === 0
                  ? 'bg-red-600 text-white shadow-lg shadow-red-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-red-200 hover:text-red-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* News Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {NEWS_ITEMS.slice(1).map((item) => (
            <article
              key={item.id}
              className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative h-44 overflow-hidden bg-slate-100">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {item.badge && (
                  <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {item.badge}
                  </span>
                )}
              </div>
              <div className="p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{item.category}</p>
                <h3 className="font-black text-slate-900 text-sm leading-snug mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-3">
                  {item.excerpt}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400">{item.date}</span>
                  <button className="text-xs font-black text-red-600 hover:text-red-700 transition-colors">
                    Đọc tiếp →
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Load More */}
        <div className="flex justify-center">
          <button className="rounded-2xl border-2 border-slate-200 bg-white px-10 py-3.5 text-sm font-black text-slate-600 transition-all hover:border-red-200 hover:text-red-600 hover:-translate-y-0.5">
            Xem thêm tin tức
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsPage;
