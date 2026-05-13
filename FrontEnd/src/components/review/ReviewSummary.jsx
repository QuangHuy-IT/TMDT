import React from 'react';
import StarRating from '../ui/StarRating';

const ReviewSummary = ({ summary, className = '' }) => {
  if (!summary) return null;

  const {
    averageRating = 0,
    totalReviews = 0,
    fiveStarCount = 0,
    fourStarCount = 0,
    threeStarCount = 0,
    twoStarCount = 0,
    oneStarCount = 0,
  } = summary;

  const getBarPercent = (count) => {
    if (totalReviews === 0) return 0;
    return Math.round((count / totalReviews) * 100);
  };

  const ratings = [
    { stars: 5, count: fiveStarCount },
    { stars: 4, count: fourStarCount },
    { stars: 3, count: threeStarCount },
    { stars: 2, count: twoStarCount },
    { stars: 1, count: oneStarCount },
  ];

  return (
    <div className={`flex flex-col items-center gap-6 rounded-xl border border-gray-100 bg-white p-5 sm:flex-row ${className}`}>
      {/* Average Rating Block */}
      <div className="flex flex-col items-center border-b border-gray-100 pb-5 sm:border-b-0 sm:border-r sm:border-gray-100 sm:pr-6">
        <div className="text-5xl font-black text-gray-900">{Number(averageRating).toFixed(1)}</div>
        <StarRating value={Math.round(averageRating)} readonly size="sm" />
        <div className="mt-1 text-xs text-gray-400">{Number(totalReviews).toLocaleString('vi-VN')} đánh giá</div>
      </div>

      {/* Distribution Bars */}
      <div className="flex-1 space-y-2">
        {ratings.map(({ stars, count }) => (
          <div key={stars} className="flex items-center gap-3">
            <span className="w-10 flex items-center gap-0.5 text-xs font-medium text-gray-600">
              {stars} <span className="text-yellow-400">★</span>
            </span>
            <div className="flex-1 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-yellow-400 transition-all duration-500"
                style={{ width: `${getBarPercent(count)}%` }}
              />
            </div>
            <span className="w-8 text-right text-xs text-gray-400">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewSummary;
