import React, { useState, useEffect, useCallback } from 'react';
import { Ticket, Search, RefreshCw, AlertCircle, ShoppingBag } from 'lucide-react';
import voucherService from '../services/voucherService';
import VoucherCard from '../components/ui/VoucherCard';
import { Link } from 'react-router-dom';

export const Vouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL, PERCENT, FIXED

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await voucherService.getAvailableVouchers();
      const list = Array.isArray(data) ? data : [];

      // Filter based on expiration date and remaining usage count
      const now = new Date();
      const validVouchers = list.filter((v) => {
        const isExpired = v.endAt && new Date(v.endAt) < now;
        const remainingUsage = v.usageLimit != null && v.usedCount != null
          ? v.usageLimit - v.usedCount
          : 1; // Default to valid if no usage limit is set
        return !isExpired && remainingUsage > 0;
      });

      setVouchers(validVouchers);
    } catch (e) {
      console.error(e);
      setError('Không thể tải danh sách voucher. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  // Filter vouchers by discount type
  const filteredVouchers = vouchers.filter((v) => {
    if (filterType === 'PERCENT') return v.discountType === 'PERCENT';
    if (filterType === 'FIXED') return v.discountType === 'FIXED';
    return true;
  });

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 pt-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-gray-200 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl border border-red-100">
              <Ticket className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Kho Voucher Của Tôi</h1>
              <p className="text-sm text-gray-500 mt-1">Lưu trữ và sử dụng các mã giảm giá đặc quyền dành riêng cho bạn</p>
            </div>
          </div>
          <button
            onClick={fetchVouchers}
            disabled={loading}
            className="flex items-center justify-center gap-2 self-start md:self-auto px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Tải lại
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {[
            { label: 'Tất cả mã', value: 'ALL' },
            { label: 'Giảm theo %', value: 'PERCENT' },
            { label: 'Giảm tiền mặt', value: 'FIXED' }
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilterType(tab.value)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                filterType === tab.value
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <span className="text-xs text-gray-400 font-medium ml-auto">
            Tìm thấy {filteredVouchers.length} voucher hợp lệ
          </span>
        </div>

        {/* Content Area */}
        {loading ? (
          /* Skeletons Loading */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-[140px] rounded-2xl bg-white border border-gray-150 animate-pulse flex">
                <div className="w-28 bg-gray-200 rounded-l-2xl"></div>
                <div className="flex-grow p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center max-w-xl mx-auto">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Đã xảy ra lỗi</h3>
            <p className="text-sm text-red-600 mb-6">{error}</p>
            <button
              onClick={fetchVouchers}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : filteredVouchers.length === 0 ? (
          /* Empty State */
          <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center max-w-xl mx-auto shadow-xl">
            <div className="w-24 h-24 bg-gray-50 border border-dashed border-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Ticket className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy voucher</h3>
            <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
              {vouchers.length === 0
                ? 'Hiện tại hệ thống không có mã giảm giá nào dành cho bạn. Hãy quay lại sau nhé!'
                : 'Không có mã giảm giá nào khớp với bộ lọc bạn chọn.'}
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg hover:shadow-red-200 transition-all active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              Mua sắm ngay
            </Link>
          </div>
        ) : (
          /* Grid of Vouchers */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVouchers.map((voucher) => (
              <VoucherCard
                key={voucher.id || voucher.code}
                voucher={voucher}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default Vouchers;
