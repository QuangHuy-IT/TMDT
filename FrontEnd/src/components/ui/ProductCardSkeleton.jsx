import React from 'react';

const ProductCardSkeleton = () => (
  <div className="bg-white border border-slate-100 rounded-[2rem] p-5 animate-pulse">
    <div className="bg-slate-100 rounded-2xl aspect-square mb-4" />
    <div className="space-y-2">
      <div className="h-2 bg-slate-100 rounded w-1/3" />
      <div className="h-4 bg-slate-100 rounded w-5/6" />
      <div className="h-3 bg-slate-100 rounded w-2/3" />
      <div className="h-3 bg-slate-100 rounded w-1/2" />
      <div className="flex justify-between items-end pt-4">
        <div className="space-y-1">
          <div className="h-5 bg-slate-100 rounded w-20" />
          <div className="h-3 bg-slate-100 rounded w-14" />
        </div>
        <div className="h-10 w-10 bg-slate-100 rounded-2xl" />
      </div>
    </div>
  </div>
);

export default ProductCardSkeleton;
