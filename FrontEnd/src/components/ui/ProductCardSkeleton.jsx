import React from 'react';
import { cn } from '../../utils/cn';

const ProductCardSkeleton = ({ variant = 'default', className }) => {
  const isFlashSale = variant === 'flash-sale';

  if (isFlashSale) {
    return (
      <div className={cn(
        "bg-white rounded-2xl overflow-hidden shadow-md",
        className
      )}>
        {/* Image area */}
        <div className="relative aspect-square overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/60 via-slate-50 to-orange-50/40">
            {/* Shimmer overlays */}
            <div className="shimmer-overlay" />
          </div>

          {/* Badge skeleton */}
          <div className="absolute top-2.5 left-2.5 z-10">
            <div className="w-12 h-4 bg-slate-200/70 rounded-lg animate-pulse" />
          </div>

          {/* Fav button skeleton */}
          <div className="absolute top-2.5 right-2.5 z-10">
            <div className="w-7 h-7 bg-slate-200/70 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Content area */}
        <div className="p-3.5 space-y-2.5">
          {/* Product name */}
          <div className="space-y-1.5">
            <div className="h-2.5 bg-slate-100 rounded-full w-3/4 animate-pulse" />
            <div className="h-2.5 bg-slate-100 rounded-full w-1/2 animate-pulse" />
          </div>

          {/* Price */}
          <div className="flex items-end gap-2 pt-1">
            <div className="h-4 bg-red-100 rounded-lg w-20 animate-pulse" />
          </div>

          {/* Progress bar skeleton */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <div className="h-1.5 bg-slate-100 rounded-full w-16 animate-pulse" />
              <div className="h-1.5 bg-slate-100 rounded-full w-8 animate-pulse" />
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full w-2/3 bg-slate-200 rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* Button skeleton */}
        <div className="px-3.5 pb-3.5">
          <div className="h-8 bg-red-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  // Default skeleton
  return (
    <div className={cn(
      "bg-white border border-slate-100 rounded-[2rem] p-5 animate-pulse",
      className
    )}>
      <div className="bg-slate-100 rounded-2xl aspect-square mb-4 overflow-hidden relative">
        <div className="absolute inset-0 shimmer-overlay" />
      </div>
      <div className="space-y-2">
        <div className="h-2 bg-slate-100 rounded w-1/3" />
        <div className="h-4 bg-slate-100 rounded w-5/6" />
        <div className="h-3 bg-slate-100 rounded w-2/3" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
        <div className="flex justify-end items-end pt-4">
          <div className="h-5 bg-slate-100 rounded w-24" />
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
