package com.tmdt.phone_store_backend.controller;

import com.tmdt.phone_store_backend.dto.CreateReviewRequestDto;
import com.tmdt.phone_store_backend.dto.ReviewDto;
import com.tmdt.phone_store_backend.dto.UpdateReviewRequestDto;
import com.tmdt.phone_store_backend.service.ReviewService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class UserReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<ReviewDto> createReview(
            @RequestParam Long userId,
            @Valid @RequestBody CreateReviewRequestDto requestDto) {
        return ResponseEntity.ok(reviewService.createReview(userId, requestDto));
    }

    @PutMapping("/{reviewId}")
    public ResponseEntity<ReviewDto> updateReview(
            @PathVariable Long reviewId,
            @RequestParam Long userId,
            @Valid @RequestBody UpdateReviewRequestDto requestDto) {
        return ResponseEntity.ok(reviewService.updateReview(userId, reviewId, requestDto));
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<?> deleteReview(
            @PathVariable Long reviewId,
            @RequestParam Long userId) {
        reviewService.deleteReview(userId, reviewId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{reviewId}/helpful")
    public ResponseEntity<?> markHelpful(@PathVariable Long reviewId) {
        reviewService.markReviewHelpful(reviewId);
        return ResponseEntity.ok(java.util.Map.of("success", true));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ReviewDto>> getUserReviews(@PathVariable Long userId) {
        return ResponseEntity.ok(reviewService.getUserReviews(userId));
    }

    @GetMapping("/{reviewId}")
    public ResponseEntity<ReviewDto> getReviewById(@PathVariable Long reviewId) {
        return ResponseEntity.ok(reviewService.getReviewById(reviewId));
    }
}
