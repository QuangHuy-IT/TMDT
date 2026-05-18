import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axiosInstance';
import Pagination from '../../components/ui/Pagination';

const ITEMS_PER_PAGE = 10;

const renderStars = (rating) => {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-3.5 h-3.5 ${star <= rating ? 'text-yellow-400' : 'text-gray-600'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  // Filter state
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'approved' | 'all'
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null); // reviewId of item being acted on

  const fetchReviews = async (page = 0, tab = activeTab) => {
    setLoading(true);
    setError('');
    try {
      let response;
      if (tab === 'pending') {
        response = await api.get('/admin/reviews/pending', { params: { page, size: ITEMS_PER_PAGE } });
      } else {
        const approved = tab === 'approved' ? true : tab === 'rejected' ? false : null;
        response = await api.get('/admin/reviews', { params: { page, size: ITEMS_PER_PAGE, approved } });
      }
      const data = response.data;
      setReviews(data.reviews || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
      setCurrentPage(page + 1);
    } catch (err) {
      setError('Không tải được danh sách đánh giá.');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCount = async () => {
    try {
      const response = await api.get('/admin/reviews/pending', { params: { page: 0, size: 1 } });
      setPendingCount(response.data.totalElements || 0);
    } catch {
      setPendingCount(0);
    }
  };

  useEffect(() => {
    fetchReviews(0, activeTab);
  }, [activeTab]);

  useEffect(() => {
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 15000);
    return () => clearInterval(interval);
  }, []);

  const handlePageChange = (page) => {
    fetchReviews(page - 1, activeTab);
  };

  const handleApprove = async (reviewId) => {
    setActionLoading(reviewId);
    try {
      await api.post(`/admin/reviews/${reviewId}/approve`);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setTotalElements((prev) => prev - 1);
      fetchPendingCount();
    } catch (err) {
      alert(err.response?.data?.message || 'Duyệt đánh giá thất bại.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (reviewId) => {
    if (!window.confirm('Bạn có chắc muốn từ chối đánh giá này?')) return;
    setActionLoading(reviewId);
    try {
      await api.post(`/admin/reviews/${reviewId}/reject`);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setTotalElements((prev) => prev - 1);
      fetchPendingCount();
    } catch (err) {
      alert(err.response?.data?.message || 'Từ chối đánh giá thất bại.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Bạn có chắc muốn xóa đánh giá này? Hành động không thể hoàn tác.')) return;
    setActionLoading(reviewId);
    try {
      await api.delete(`/admin/reviews/${reviewId}`);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setTotalElements((prev) => prev - 1);
      fetchPendingCount();
    } catch (err) {
      alert(err.response?.data?.message || 'Xóa đánh giá thất bại.');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredReviews = useMemo(() => {
    if (!search.trim()) return reviews;
    const q = search.toLowerCase();
    return reviews.filter(
      (r) =>
        (r.userFullName || '').toLowerCase().includes(q) ||
        (r.userEmail || '').toLowerCase().includes(q) ||
        (r.productName || '').toLowerCase().includes(q) ||
        (r.title || '').toLowerCase().includes(q) ||
        (r.content || '').toLowerCase().includes(q)
    );
  }, [reviews, search]);

  const tabs = [
    { key: 'pending', label: 'Chờ duyệt', badge: pendingCount },
    { key: 'approved', label: 'Đã duyệt', badge: null },
    { key: 'rejected', label: 'Từ chối', badge: null },
    { key: 'all', label: 'Tất cả', badge: null },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Đánh giá</h1>
        <p className="text-sm text-gray-500 mt-1">Kiểm soát đánh giá của người dùng</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === tab.key
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
            {tab.badge !== null && tab.badge > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-600 text-white font-black">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Tìm theo tên, email, sản phẩm, nội dung..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#13151e] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition-all"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#13151e] border border-white/5 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-white">{totalElements}</p>
          <p className="text-xs text-gray-500 mt-1">
            {activeTab === 'pending' ? 'Chờ duyệt' : activeTab === 'approved' ? 'Đã duyệt' : activeTab === 'rejected' ? 'Từ chối' : 'Tổng đánh giá'}
          </p>
        </div>
        <div className="bg-[#13151e] border border-white/5 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-emerald-400">{pendingCount}</p>
          <p className="text-xs text-gray-500 mt-1">Chờ duyệt</p>
        </div>
        <div className="bg-[#13151e] border border-white/5 rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-gray-400">
            {totalElements > 0 ? Math.round((totalElements - pendingCount) / Math.max(totalElements, 1) * 100) : 0}{'%'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Đã duyệt</p>
        </div>
      </div>

      {/* List */}
      <div className="bg-[#13151e] border border-white/5 rounded-2xl overflow-hidden">
        {loading && (
          <div className="px-6 py-4 text-sm text-gray-400 border-b border-white/5">Đang tải dữ liệu...</div>
        )}
        {error && (
          <div className="px-6 py-4 text-sm text-red-400 border-b border-white/5">
            {error}
            <button onClick={() => fetchReviews(0, activeTab)} className="ml-2 underline">
              Thử lại
            </button>
          </div>
        )}

        {!loading && !error && filteredReviews.length === 0 && (
          <div className="py-16 text-center text-gray-600 font-bold">
            Không có đánh giá nào
          </div>
        )}

        {!loading && !error && filteredReviews.length > 0 && (
          <div className="divide-y divide-white/[0.03]">
            {filteredReviews.map((review) => (
              <div key={review.id} className="p-5 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header row */}
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center text-xs font-black text-red-400">
                          {(review.userFullName || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{review.userFullName || 'Người dùng'}</p>
                          <p className="text-[11px] text-gray-500">{review.userEmail}</p>
                        </div>
                      </div>
                      {renderStars(review.rating)}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          review.isApproved
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {review.isApproved ? 'Đã duyệt' : 'Chờ duyệt'}
                      </span>
                      {review.isVerifiedPurchase && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/10 text-blue-400">
                          Đã mua hàng
                        </span>
                      )}
                    </div>

                    {/* Product */}
                    <p className="text-xs text-gray-500 mb-1">
                      Sản phẩm:{' '}
                      <span className="text-gray-300 font-medium">{review.productName}</span>
                    </p>

                    {/* Title & Content */}
                    {review.title && (
                      <p className="text-sm font-bold text-white mb-1">{review.title}</p>
                    )}
                    {review.content && (
                      <p className="text-sm text-gray-400 leading-relaxed">{review.content}</p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-600">
                      <span>{formatDate(review.createdAt)}</span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                        {review.helpfulCount || 0} hữu ích
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 items-end">
                    {activeTab === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(review.id)}
                          disabled={actionLoading === review.id}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-all disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {actionLoading === review.id ? (
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          Duyệt
                        </button>
                        <button
                          onClick={() => handleReject(review.id)}
                          disabled={actionLoading === review.id}
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold transition-all disabled:opacity-50"
                        >
                          Từ chối
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(review.id)}
                      disabled={actionLoading === review.id}
                      className="px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 text-xs font-bold transition-all disabled:opacity-50"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};
