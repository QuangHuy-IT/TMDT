import React from 'react';
import { Link } from 'react-router-dom';
import { ProductCard } from '../ui/ProductCard';
import ProductCardSkeleton from '../ui/ProductCardSkeleton';
import HomeSectionShell from './HomeSectionShell';

const FeaturedProductsSection = ({ products = [], loading = false }) => {
  // Ensure products is always an array
  const productList = Array.isArray(products) ? products : [];

  if (!loading && productList.length === 0) {
    return null;
  }

  return (
    <HomeSectionShell>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Hot Deal</p>
          <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-slate-950">Sản phẩm nổi bật</h2>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Những sản phẩm được đánh giá cao và nhận nhiều phản hồi tốt.
          </p>
        </div>
        <Link to="/products" className="text-xs font-black uppercase tracking-[0.2em] text-red-600 hover:text-red-700">
          Xem tất cả
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, index) => <ProductCardSkeleton key={index} />)
          : productList.map((product) => <ProductCard key={`${product.id}-${product.variantId}`} product={product} />)}
      </div>
    </HomeSectionShell>
  );
};

export default FeaturedProductsSection;
