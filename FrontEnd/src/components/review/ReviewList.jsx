import React, { useState } from 'react';
import StarRating from '../ui/StarRating';

const ReviewList = ({ reviews = [], onMarkHelpful, currentUserId }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (reviews.length === 0) {
    return (
      <div className="py-12 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <p className="mt-3 text-sm text-gray-400">Chưa có đánh giá nào cho sản phẩm này.</p>
        <p className="mt-1 text-xs text-gray-400">Hãy là người đầu tiên đánh giá!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="rounded-xl border border-gray-100 bg-white p-4 transition-shadow hover:shadow-sm"
        >
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-400 text-sm font-bold text-white">
              {review.userAvatarUrl ? (
                <img
                  src={review.userAvatarUrl}
                  alt={review.userFullName}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                getInitials(review.userFullName)
              )}
            </div>

            <div className="min-w-0 flex-1">
              {/* Header */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-gray-800">{review.userFullName}</span>
                {review.isVerifiedPurchase && (
                  <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-600">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Đã mua hàng
                  </span>
                )}
              </div>

              {/* Stars + Date */}
              <div className="mt-1 flex items-center gap-3">
                <StarRating value={review.rating} readonly size="sm" />
                <span className="text-[11px] text-gray-400">{formatDate(review.createdAt)}</span>
              </div>

              {/* Title */}
              {review.title && (
                <p className="mt-2 font-semibold text-gray-800">{review.title}</p>
              )}

              {/* Content */}
              {review.content && (
                <p className="mt-1 text-sm leading-relaxed text-gray-600">{review.content}</p>
              )}

              {/* Helpful */}
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={() => onMarkHelpful && onMarkHelpful(review.id)}
                  disabled={review.userId === currentUserId}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-500 transition-colors hover:border-red-300 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                  Hữu ích
                  {review.helpfulCount > 0 && (
                    <span className="font-semibold">({review.helpfulCount})</span>
                  )}
                </button>

                {review.updatedAt && review.createdAt !== review.updatedAt && (
                  <span className="text-[11px] italic text-gray-400">
                    (đã chỉnh sửa {formatDate(review.updatedAt)})
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReviewList;
