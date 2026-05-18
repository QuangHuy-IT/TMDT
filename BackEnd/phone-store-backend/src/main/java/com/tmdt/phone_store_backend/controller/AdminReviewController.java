package com.tmdt.phone_store_backend.controller;

import com.tmdt.phone_store_backend.dto.PagedAdminReviewResponseDto;
import com.tmdt.phone_store_backend.dto.AdminReviewDto;
import com.tmdt.phone_store_backend.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/reviews")
@RequiredArgsConstructor
public class AdminReviewController {

    private final ReviewService reviewService;

    @GetMapping("/pending")
    public ResponseEntity<PagedAdminReviewResponseDto> getPendingReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(reviewService.getPendingReviews(page, size));
    }

    @GetMapping
    public ResponseEntity<PagedAdminReviewResponseDto> getAllReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Boolean approved) {
        return ResponseEntity.ok(reviewService.getAllReviews(page, size, productId, approved));
    }

    @PostMapping("/{reviewId}/approve")
    public ResponseEntity<AdminReviewDto> approveReview(@PathVariable Long reviewId) {
        return ResponseEntity.ok(reviewService.approveReview(reviewId));
    }

    @PostMapping("/{reviewId}/reject")
    public ResponseEntity<AdminReviewDto> rejectReview(@PathVariable Long reviewId) {
        return ResponseEntity.ok(reviewService.rejectReview(reviewId));
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<?> deleteReview(@PathVariable Long reviewId) {
        reviewService.deleteReviewAdmin(reviewId);
        return ResponseEntity.noContent().build();
    }
}
