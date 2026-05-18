import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { ProductCard } from '../ui/ProductCard';
import ProductCardSkeleton from '../ui/ProductCardSkeleton';
import HomeSectionShell from './HomeSectionShell';
import brandService from '../../services/brandService';

const BrandSection = ({ brand }) => {
  const { data: products, isLoading } = useQuery({
    queryKey: ['brandProducts', brand.slug],
    queryFn: () => brandService.getBrandProducts(brand.slug),
    staleTime: 5 * 60 * 1000,
  });

  const productList = Array.isArray(products) ? products : [];

  // Chỉ hiển thị 8 sản phẩm (2 hàng × 4)
  const displayProducts = productList.slice(0, 8);

  if (!isLoading && productList.length === 0) return null;

  return (
    <HomeSectionShell>
      {/* Header */}
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">{brand.name}</p>
          <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-slate-950">
            {brand.name} Chính Hãng
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Sản phẩm chính hãng {brand.name} tại Việt Nam.
          </p>
        </div>
        <Link
          to={`/brands/${brand.slug}`}
          className="flex items-center gap-1.5 text-blue-600 font-bold hover:gap-2.5 hover:text-blue-700 transition-all whitespace-nowrap"
        >
          Xem tất cả <ChevronRight size={18} />
        </Link>
      </div>

      {/* Grid: 2 hàng × 4 sản phẩm */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, index) => <ProductCardSkeleton key={index} />)
          : displayProducts.map((product, index) => (
              <motion.div
                key={`${product.id}-${product.variantId}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.3, ease: 'easeOut' }}
              >
                <ProductCard key={`${product.id}-${product.variantId}`} product={product} />
              </motion.div>
            ))
        }
      </div>
    </HomeSectionShell>
  );
};

export default BrandSection;
