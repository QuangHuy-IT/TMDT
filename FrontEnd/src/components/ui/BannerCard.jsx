import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';

const BannerCard = ({ banner, className }) => {
  if (!banner) return null;

  return (
    <Link
      to={banner.linkUrl || '#'}
      className={cn(
        "group relative block overflow-hidden rounded-[2rem] bg-slate-100 shadow-sm transition-all duration-500 hover:shadow-xl h-full",
        className
      )}
    >
      <img
        src={banner.imageUrl}
        alt={banner.title}
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        loading="lazy"
      />
      {/* Overlay cố định hiển thị text */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-8">
        {banner.subtitle && (
          <span className="text-orange-400 text-xs md:text-sm font-black uppercase tracking-widest mb-2">
            {banner.subtitle}
          </span>
        )}
        <h3 className="text-white text-xl md:text-2xl font-black leading-tight">
          {banner.title}
        </h3>
      </div>
    </Link>
  );
};

export default BannerCard;
