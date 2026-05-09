import React from 'react';
import BannerCard from '../ui/BannerCard';
import { cn } from '../../utils/cn';

const GridAdsSection = ({ ads, isLoading }) => {
  if (isLoading) {
    return (
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 md:h-64 bg-slate-100 rounded-[2rem] animate-pulse"></div>
          ))}
        </div>
      </section>
    );
  }

  if (!ads || ads.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ads.map((ad, index) => (
          <BannerCard 
            key={ad.id} 
            banner={ad} 
            className={cn(
              "h-48 md:h-64 lg:h-72",
              index === 0 && ads.length > 2 ? "lg:col-span-1" : "",
              index === 1 && ads.length > 2 ? "lg:col-span-1" : ""
            )}
          />
        ))}
      </div>
    </section>
  );
};

export default GridAdsSection;
