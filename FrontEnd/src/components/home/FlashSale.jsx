import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { priceToNumber, getProductThumbnail } from '../../utils/catalog';
import { getSafeProductSlug } from '../../utils/slug';
import HomeSectionShell from './HomeSectionShell';

const FlashSaleCard = ({ product }) => {
  const navigate = useNavigate();
  const productSlug = getSafeProductSlug(product.slug, product.productSlug);
  const price = priceToNumber(product.price);
  const sale = Number(product.sale || 0);
  const originalPrice = sale > 0 ? Math.round(price * 100 / (100 - sale)) : price;
  const stock = Number(product.stock || 0);
  const progress = Math.min(100, Math.max(8, stock));

  return (
    <button
      type="button"
      onClick={() => productSlug && navigate(`/products/${productSlug}`)}
      className="group h-full w-full rounded-[28px] border border-red-100 bg-white p-4 text-left shadow-[0_16px_38px_rgba(248,113,113,0.14)] transition-all hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(248,113,113,0.18)]"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          <span className="rounded-full bg-red-500 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-sm shadow-red-500/30">
            Flash
          </span>
          {sale > 0 && (
            <span className="rounded-full bg-orange-500 px-2 py-1 text-[11px] font-black tracking-wider text-white shadow-sm shadow-orange-500/30">
              -{sale}%
            </span>
          )}
        </div>
        <span className="text-[11px] font-black uppercase tracking-[0.18em] text-red-500">
          Còn {stock}
        </span>
      </div>

      <div className="rounded-[24px] bg-[radial-gradient(circle_at_top_left,_rgba(254,226,226,0.95),_rgba(255,255,255,1)_68%)] p-4">
        <img
          src={getProductThumbnail(product)}
          alt={product.name}
          loading="lazy"
          className="h-52 w-full object-contain transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <p className="mt-4 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{product.brand}</p>
      <h3 className="mt-2 line-clamp-2 text-lg font-black leading-tight text-slate-950">{product.name}</h3>

      <div className="mt-4 flex items-end gap-3">
        <span className="text-2xl font-black tracking-tight text-red-600">{price.toLocaleString('vi-VN')}đ</span>
        {sale > 0 && (
          <span className="pb-1 text-sm font-bold text-slate-400 line-through decoration-slate-300">{originalPrice.toLocaleString('vi-VN')}đ</span>
        )}
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
          <span>Số lượng còn lại</span>
          <span>{stock} sản phẩm</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-red-100">
          <div className="h-full rounded-full bg-gradient-to-r from-red-500 via-orange-400 to-amber-300" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </button>
  );
};

const FlashSale = ({ products = [], loading = false }) => {
  if (!loading && products.length === 0) {
    return null;
  }

  return (
    <HomeSectionShell innerClassName="overflow-hidden p-0">
      <div className="flex flex-col gap-3 border-b border-red-100 bg-[linear-gradient(120deg,#7f1d1d_0%,#dc2626_52%,#fb923c_100%)] px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-red-100">Flash Sale</p>
          <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-white">Deal đang chạy</h2>
        </div>
      </div>

      <div className="px-5 py-6 md:px-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-[420px] animate-pulse rounded-[28px] bg-slate-100" />
            ))}
          </div>
        ) : (
          <Swiper
            modules={[Autoplay, Navigation]}
            spaceBetween={16}
            navigation
            autoplay={{ delay: 3200, disableOnInteraction: false }}
            breakpoints={{
              0: { slidesPerView: 1.15 },
              640: { slidesPerView: 2.1 },
              1024: { slidesPerView: 3.1 },
              1280: { slidesPerView: 4 },
            }}
            className="flash-sale-swiper"
          >
            {products.map((product) => (
              <SwiperSlide key={product.id || product._id} className="h-auto">
                <FlashSaleCard product={product} />
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>
    </HomeSectionShell>
  );
};

export default FlashSale;
