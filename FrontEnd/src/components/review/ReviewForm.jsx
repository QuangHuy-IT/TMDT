import React, { useState } from 'react';
import StarRating from '../ui/StarRating';

const ReviewForm = ({ productId, existingReview, onSubmit, onCancel }) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [title, setTitle] = useState(existingReview?.title || '');
  const [content, setContent] = useState(existingReview?.content || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  const isEditing = !!existingReview;
  const maxContentLength = 2000;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Vui lòng chọn số sao đánh giá.');
      return;
    }

    if (!title.trim() && !content.trim()) {
      setError('Vui lòng nhập tiêu đề hoặc nội dung đánh giá.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        productId,
        rating,
        title: title.trim() || null,
        content: content.trim() || null,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl border border-gray-100 bg-white p-5">
        <h3 className="mb-4 font-bold text-gray-800">
          {isEditing ? 'Chỉnh sửa đánh giá' : 'Viết đánh giá của bạn'}
        </h3>

        {/* Star Rating */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Đánh giá của bạn <span className="text-red-500">*</span>
          </label>
          <div
                onMouseLeave={() => setHoverRating(0)}
              className="flex items-center gap-1"
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                className="cursor-pointer transition-transform hover:scale-110"
              >
                <svg
                  className={`h-8 w-8 ${
                    star <= (hoverRating || rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm font-semibold text-gray-600">
                {rating === 5 && 'Tuyệt vời'}
                {rating === 4 && 'Rất tốt'}
                {rating === 3 && 'Bình thường'}
                {rating === 2 && 'Không hài lòng'}
                {rating === 1 && 'Rất tệ'}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-semibold text-gray-700" htmlFor="review-title">
            Tiêu đề
          </label>
          <input
            id="review-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tóm tắt cảm nhận của bạn (VD: Sản phẩm rất tốt, đáng mua)"
            maxLength={200}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm placeholder-gray-400 transition focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-300"
          />
        </div>

        {/* Content */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-semibold text-gray-700" htmlFor="review-content">
            Nội dung đánh giá
          </label>
          <textarea
            id="review-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Chia sẻ trải nghiệm sử dụng sản phẩm của bạn..."
            rows={5}
            maxLength={maxContentLength}
            className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm placeholder-gray-400 transition focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-300"
          />
          <div className="mt-1 flex justify-end">
            <span className={`text-[11px] ${content.length > maxContentLength * 0.9 ? 'text-orange-500' : 'text-gray-400'}`}>
              {content.length}/{maxContentLength}
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
            >
              Hủy
            </button>
          )}
          <button
            type="submit"
            disabled={loading || rating === 0}
            className="rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {loading ? 'Đang gửi...' : isEditing ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default ReviewForm;
