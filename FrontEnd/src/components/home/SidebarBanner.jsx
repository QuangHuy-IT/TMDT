import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

const SidebarBanner = ({ banners, isLoading }) => {
  const bannerList = Array.isArray(banners) ? banners : [];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-44 bg-slate-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (bannerList.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {bannerList.map((banner, index) => (
        <motion.div
          key={banner.id}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1, duration: 0.4 }}
        >
          <Link
            to={banner.linkUrl || '#'}
            className="group relative block overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg hover:shadow-xl transition-shadow"
          >
            {/* Image */}
            <div className="relative overflow-hidden">
              {banner.imageUrl ? (
                <img
                  src={banner.imageUrl}
                  alt={banner.title || 'Banner'}
                  className="w-full h-auto transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
                  <span className="text-white font-black text-sm">{banner.title}</span>
                </div>
              )}
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            </div>

            {/* Text overlay */}
            {(banner.title || banner.subtitle) && (
              <div className="absolute bottom-0 left-0 right-0 p-4">
                {banner.subtitle && (
                  <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-0.5">
                    {banner.subtitle}
                  </p>
                )}
                {banner.title && (
                  <h3 className="text-white font-black text-sm leading-tight line-clamp-2">
                    {banner.title}
                  </h3>
                )}
                {banner.buttonText && (
                  <div className="mt-2 flex items-center gap-1 text-yellow-300 text-xs font-bold">
                    <span>{banner.buttonText}</span>
                    <ChevronRight size={12} />
                  </div>
                )}
              </div>
            )}
          </Link>
        </motion.div>
      ))}
    </div>
  );
};

export default SidebarBanner;
