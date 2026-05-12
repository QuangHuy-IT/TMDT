import React, { useState, useEffect, useCallback } from 'react';
import ReviewService from '../../services/reviewService';
import ReviewSummary from './ReviewSummary';
import ReviewList from './ReviewList';
import ReviewForm from './ReviewForm';
import Pagination from '../ui/Pagination';

const ReviewSection = ({ productId, currentUserId }) => {
  const [summary, setSummary] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [paging, setPaging] = useState({ totalElements: 0, totalPages: 0, currentPage: 1, pageSize: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter & sort
  const [sortBy, setSortBy] = useState('newest');
  const [filterRating, setFilterRating] = useState(null);
  const [showFilter, setShowFilter] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [canReview, setCanReview] = useState(false);

  const fetchReviews = useCallback(async (page = 0, sort = sortBy, filter = filterRating) => {
    setLoading(true);
    setError('');
    try {
      const response = await ReviewService.getProductReviews(productId, {
        page,
        size: paging.pageSize,
        sortBy: sort,
        filterRating: filter,
      });
      const data = response.data;
      setReviews(data.reviews || []);
      setPaging({
        totalElements: data.totalElements || 0,
        totalPages: data.totalPages || 1,
        currentPage: (data.currentPage || 0) + 1,
        pageSize: data.pageSize || 10,
      });
    } catch (err) {
      setError('Không tải được đánh giá. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [productId, paging.pageSize, sortBy, filterRating]);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await ReviewService.getProductReviewSummary(productId);
      setSummary(response.data);
    } catch {
      // Non-critical, don't show error
    }
  }, [productId]);

  const checkUserReviewStatus = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const response = await ReviewService.canUserReview(productId, currentUserId);
      setCanReview(response.data.canReview);

      const userReviewsRes = await ReviewService.getUserReviews(currentUserId);
      const found = (userReviewsRes.data || []).find((r) => r.productId === productId);
      if (found) {
        setUserHasReviewed(true);
        setUserReview(found);
      } else {
        setUserHasReviewed(false);
        setUserReview(null);
      }
    } catch {
      setCanReview(false);
      setUserHasReviewed(false);
    }
  }, [productId, currentUserId]);

  useEffect(() => {
    fetchSummary();
    fetchReviews(0);
    checkUserReviewStatus();
  }, [fetchSummary, fetchReviews, checkUserReviewStatus]);

  const handlePageChange = (page) => {
    fetchReviews(page - 1);
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setFilterRating(null);
    fetchReviews(0, newSort, null);
  };

  const handleFilterChange = (rating) => {
    setFilterRating(rating === filterRating ? null : rating);
  };

  const handleMarkHelpful = async (reviewId) => {
    try {
      await ReviewService.markHelpful(reviewId);
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r
        )
      );
    } catch {
      // Silently fail
    }
  };

  const handleCreateReview = async (reviewData) => {
    await ReviewService.createReview(currentUserId, reviewData);
    setShowForm(false);
    setUserHasReviewed(true);
    await fetchSummary();
    await fetchReviews(0);
  };

  const handleUpdateReview = async (reviewData) => {
    await ReviewService.updateReview(userReview.id, currentUserId, reviewData);
    setEditingReview(null);
    setShowForm(false);
    await fetchSummary();
    await fetchReviews(0);
  };

  const handleDeleteReview = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) return;
    try {
      await ReviewService.deleteReview(userReview.id, currentUserId);
      setUserHasReviewed(false);
      setUserReview(null);
      setShowForm(false);
      await fetchSummary();
      await fetchReviews(0);
    } catch (err) {
      alert(err.response?.data?.message || 'Xóa thất bại.');
    }
  };

  const startEditing = () => {
    setEditingReview(userReview);
    setShowForm(true);
  };

  const filterButtons = [
    { label: 'Tất cả', value: null },
    { label: '5 sao', value: 5 },
    { label: '4 sao', value: 4 },
    { label: '3 sao', value: 3 },
    { label: '2 sao', value: 2 },
    { label: '1 sao', value: 1 },
  ];

  const sortButtons = [
    { label: 'Mới nhất', value: 'newest' },
    { label: 'Hữu ích nhất', value: 'helpful' },
  ];

  return (
    <section className="mt-10" id="reviews">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-black text-gray-900">Đánh giá sản phẩm</h2>
          {currentUserId && !userHasReviewed && (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700"
            >
              Viết đánh giá
            </button>
          )}
          {currentUserId && userHasReviewed && (
            <button
              onClick={startEditing}
              className="rounded-xl border border-red-300 px-4 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
            >
              Chỉnh sửa đánh giá của bạn
            </button>
          )}
        </div>

        {/* Review Form */}
        {showForm && (
          <div className="mb-6">
            <ReviewForm
              productId={productId}
              existingReview={editingReview}
              onSubmit={editingReview ? handleUpdateReview : handleCreateReview}
              onCancel={() => {
                setShowForm(false);
                setEditingReview(null);
              }}
            />
            {editingReview && (
              <div className="mt-2 flex justify-end">
                <button
                  onClick={handleDeleteReview}
                  className="text-xs text-gray-400 underline hover:text-red-500"
                >
                  Xóa đánh giá
                </button>
              </div>
            )}
          </div>
        )}

        {/* Summary */}
        {summary && <ReviewSummary summary={summary} className="mb-6" />}

        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Sắp xếp:</span>
            {sortButtons.map((btn) => (
              <button
                key={btn.value}
                onClick={() => handleSortChange(btn.value)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  sortBy === btn.value
                    ? 'border-red-500 bg-red-50 text-red-600'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Filter */}
          <div className="relative">
            <button
              onClick={() => setShowFilter((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Lọc {filterRating ? `${filterRating} sao` : ''}
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showFilter && (
              <div className="absolute right-0 top-full z-10 mt-1 flex flex-wrap gap-1.5 rounded-xl border border-gray-100 bg-white p-3 shadow-lg">
                {filterButtons.map((btn) => (
                  <button
                    key={btn.value ?? 'all'}
                    onClick={() => {
                      handleFilterChange(btn.value);
                      setShowFilter(false);
                    }}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      filterRating === btn.value
                        ? 'border-red-500 bg-red-50 text-red-600'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Review List */}
        {loading ? (
          <div className="py-12 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-red-600" />
            <p className="mt-3 text-sm text-gray-400">Đang tải đánh giá...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-sm text-red-500">{error}</p>
            <button
              onClick={() => fetchReviews(0)}
              className="mt-2 text-xs text-red-600 underline"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <>
            <ReviewList
              reviews={reviews}
              onMarkHelpful={handleMarkHelpful}
              currentUserId={currentUserId}
            />
            {paging.totalPages > 1 && (
              <Pagination
                currentPage={paging.currentPage}
                totalPages={paging.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default ReviewSection;
