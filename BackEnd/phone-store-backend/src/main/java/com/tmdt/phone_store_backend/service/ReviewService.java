package com.tmdt.phone_store_backend.service;

import com.tmdt.phone_store_backend.dto.AdminReviewDto;
import com.tmdt.phone_store_backend.dto.CreateReviewRequestDto;
import com.tmdt.phone_store_backend.dto.PagedAdminReviewResponseDto;
import com.tmdt.phone_store_backend.dto.PagedReviewResponseDto;
import com.tmdt.phone_store_backend.dto.ProductReviewSummaryDto;
import com.tmdt.phone_store_backend.dto.ReviewDto;
import com.tmdt.phone_store_backend.dto.UpdateReviewRequestDto;
import java.util.List;

public interface ReviewService {

    PagedReviewResponseDto getProductReviews(Long productId, int page, int size, String sortBy, Integer filterRating);

    ProductReviewSummaryDto getProductReviewSummary(Long productId);

    ReviewDto createReview(Long userId, CreateReviewRequestDto requestDto);

    ReviewDto updateReview(Long userId, Long reviewId, UpdateReviewRequestDto requestDto);

    void deleteReview(Long userId, Long reviewId);

    void markReviewHelpful(Long reviewId);

    boolean canUserReviewProduct(Long userId, Long productId);

    boolean hasUserPurchasedProduct(Long userId, Long productId);

    boolean hasUserPendingReview(Long userId, Long productId);

    boolean existsReviewByUserAndProduct(Long userId, Long productId);

    List<ReviewDto> getUserReviews(Long userId);

    ReviewDto getReviewById(Long reviewId);

    // Admin methods
    PagedAdminReviewResponseDto getPendingReviews(int page, int size);

    PagedAdminReviewResponseDto getAllReviews(int page, int size, Long productId, Boolean approved);

    AdminReviewDto approveReview(Long reviewId);

    AdminReviewDto rejectReview(Long reviewId);

    void deleteReviewAdmin(Long reviewId);
}
