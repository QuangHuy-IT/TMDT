import api from '../api/axiosInstance';

const ReviewService = {
  getProductReviews: (productId, params = {}) =>
    api.get(`/products/${productId}/reviews`, { params }),

  getProductReviewSummary: (productId) =>
    api.get(`/products/${productId}/reviews/summary`),

  canUserReview: (productId, userId) =>
    api.get(`/products/${productId}/reviews/can-review`, { params: { userId } }),

  createReview: (userId, reviewData) =>
    api.post('/reviews', reviewData, { params: { userId } }),

  updateReview: (reviewId, userId, reviewData) =>
    api.put(`/reviews/${reviewId}`, reviewData, { params: { userId } }),

  deleteReview: (reviewId, userId) =>
    api.delete(`/reviews/${reviewId}`, { params: { userId } }),

  markHelpful: (reviewId) =>
    api.post(`/reviews/${reviewId}/helpful`),

  getUserReviews: (userId) =>
    api.get(`/reviews/user/${userId}`),
};

export default ReviewService;
