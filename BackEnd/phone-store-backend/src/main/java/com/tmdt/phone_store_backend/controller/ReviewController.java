package com.tmdt.phone_store_backend.controller;

import com.tmdt.phone_store_backend.dto.PagedReviewResponseDto;
import com.tmdt.phone_store_backend.dto.ProductReviewSummaryDto;
import com.tmdt.phone_store_backend.dto.ReviewDto;
import com.tmdt.phone_store_backend.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/{productId}/reviews")
    public ResponseEntity<PagedReviewResponseDto> getProductReviews(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "newest") String sortBy,
            @RequestParam(required = false) Integer filterRating) {

        return ResponseEntity.ok(reviewService.getProductReviews(productId, page, size, sortBy, filterRating));
    }

    @GetMapping("/{productId}/reviews/summary")
    public ResponseEntity<ProductReviewSummaryDto> getProductReviewSummary(@PathVariable Long productId) {
        return ResponseEntity.ok(reviewService.getProductReviewSummary(productId));
    }

    @GetMapping("/{productId}/reviews/can-review")
    public ResponseEntity<?> canReview(
            @PathVariable Long productId,
            @RequestParam Long userId) {
        boolean canReview = reviewService.canUserReviewProduct(userId, productId);
        return ResponseEntity.ok(java.util.Map.of("canReview", canReview));
    }
}
