package com.tmdt.phone_store_backend.service.impl;

import com.tmdt.phone_store_backend.domain.entity.Order;
import com.tmdt.phone_store_backend.domain.entity.Product;
import com.tmdt.phone_store_backend.domain.entity.Review;
import com.tmdt.phone_store_backend.domain.entity.User;
import com.tmdt.phone_store_backend.domain.enums.OrderStatus;
import com.tmdt.phone_store_backend.dto.CreateReviewRequestDto;
import com.tmdt.phone_store_backend.dto.PagedAdminReviewResponseDto;
import com.tmdt.phone_store_backend.dto.AdminReviewDto;
import com.tmdt.phone_store_backend.dto.PagedReviewResponseDto;
import com.tmdt.phone_store_backend.dto.ProductReviewSummaryDto;
import com.tmdt.phone_store_backend.dto.ReviewDto;
import com.tmdt.phone_store_backend.dto.UpdateReviewRequestDto;
import com.tmdt.phone_store_backend.exception.BadRequestException;
import com.tmdt.phone_store_backend.exception.ResourceNotFoundException;
import com.tmdt.phone_store_backend.repository.ProductRepository;
import com.tmdt.phone_store_backend.repository.ReviewOrderRepository;
import com.tmdt.phone_store_backend.repository.ReviewRepository;
import com.tmdt.phone_store_backend.repository.UserRepository;
import com.tmdt.phone_store_backend.service.ReviewService;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ReviewOrderRepository reviewOrderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    @Override
    public PagedReviewResponseDto getProductReviews(
            Long productId,
            int page,
            int size,
            String sortBy,
            Integer filterRating) {

        Sort sort;
        if ("helpful".equalsIgnoreCase(sortBy)) {
            sort = Sort.by(Sort.Direction.DESC, "helpfulCount")
                    .and(Sort.by(Sort.Direction.DESC, "createdAt"));
        } else {
            sort = Sort.by(Sort.Direction.DESC, "createdAt");
        }

        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Review> reviewPage = reviewRepository
                .findByProductIdAndIsApprovedTrue(productId, pageable);

        List<Review> filtered = reviewPage.getContent();
        if (filterRating != null && filterRating >= 1 && filterRating <= 5) {
            filtered = filtered.stream()
                    .filter(r -> r.getRating() == filterRating)
                    .toList();
        }

        List<ReviewDto> reviewDtos = filtered.stream()
                .map(this::toDto)
                .toList();

        long totalFiltered = reviewPage.getTotalElements();
        if (filterRating != null && filterRating >= 1 && filterRating <= 5) {
            totalFiltered = reviewPage.getContent().stream()
                    .filter(r -> r.getRating() == filterRating)
                    .count();
        }

        return PagedReviewResponseDto.builder()
                .reviews(reviewDtos)
                .totalElements(totalFiltered)
                .totalPages(reviewPage.getTotalPages())
                .currentPage(page)
                .pageSize(size)
                .build();
    }

    @Override
    public ProductReviewSummaryDto getProductReviewSummary(Long productId) {
        Double avgRating = reviewRepository.getAverageRatingByProductId(productId);
        Long total = reviewRepository.countApprovedByProductId(productId);
        List<Object[]> distribution = reviewRepository.getRatingDistributionByProductId(productId);

        Map<Integer, Long> distMap = new HashMap<>();
        for (Object[] row : distribution) {
            distMap.put((Integer) row[0], (Long) row[1]);
        }

        return ProductReviewSummaryDto.builder()
                .productId(productId)
                .averageRating(avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0)
                .totalReviews(total != null ? total : 0L)
                .oneStarCount(distMap.getOrDefault(1, 0L))
                .twoStarCount(distMap.getOrDefault(2, 0L))
                .threeStarCount(distMap.getOrDefault(3, 0L))
                .fourStarCount(distMap.getOrDefault(4, 0L))
                .fiveStarCount(distMap.getOrDefault(5, 0L))
                .build();
    }

    @Override
    @Transactional
    public ReviewDto createReview(Long userId, CreateReviewRequestDto requestDto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng."));

        Product product = productRepository.findByIdAndDeletedAtIsNull(requestDto.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm."));

        Optional<Review> existing = reviewRepository.findByProductIdAndUserId(product.getId(), userId);
        if (existing.isPresent()) {
            throw new BadRequestException("Bạn đã đánh giá sản phẩm này rồi. Hãy cập nhật đánh giá của bạn.");
        }

        Review review = Review.builder()
                .product(product)
                .user(user)
                .rating(requestDto.getRating())
                .title(requestDto.getTitle())
                .content(requestDto.getContent())
                .isApproved(false)
                .helpfulCount(0)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Review saved = reviewRepository.save(review);
        return toDto(saved);
    }

    @Override
    @Transactional
    public ReviewDto updateReview(Long userId, Long reviewId, UpdateReviewRequestDto requestDto) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá."));

        if (!review.getUser().getId().equals(userId)) {
            throw new BadRequestException("Bạn không có quyền chỉnh sửa đánh giá này.");
        }

        if (requestDto.getRating() != null) {
            review.setRating(requestDto.getRating());
        }
        if (requestDto.getTitle() != null) {
            review.setTitle(requestDto.getTitle());
        }
        if (requestDto.getContent() != null) {
            review.setContent(requestDto.getContent());
        }
        review.setUpdatedAt(LocalDateTime.now());

        Review saved = reviewRepository.save(review);
        return toDto(saved);
    }

    @Override
    @Transactional
    public void deleteReview(Long userId, Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá."));

        if (!review.getUser().getId().equals(userId)) {
            throw new BadRequestException("Bạn không có quyền xóa đánh giá này.");
        }

        reviewRepository.delete(review);
    }

    @Override
    @Transactional
    public void markReviewHelpful(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá."));
        reviewRepository.incrementHelpfulCount(reviewId);
    }

    @Override
    public boolean canUserReviewProduct(Long userId, Long productId) {
        List<Order> deliveredOrders = reviewOrderRepository.findDeliveredOrdersWithProduct(
                userId, productId, OrderStatus.DELIVERED);
        if (deliveredOrders.isEmpty()) {
            return false;
        }
        return !reviewRepository.existsByProductIdAndUserId(productId, userId);
    }

    @Override
    public boolean hasUserPurchasedProduct(Long userId, Long productId) {
        List<Order> deliveredOrders = reviewOrderRepository.findDeliveredOrdersWithProduct(
                userId, productId, OrderStatus.DELIVERED);
        return !deliveredOrders.isEmpty();
    }

    @Override
    public boolean hasUserPendingReview(Long userId, Long productId) {
        return reviewRepository.findByProductIdAndUserId(productId, userId)
                .map(r -> !Boolean.TRUE.equals(r.getIsApproved()))
                .orElse(false);
    }

    @Override
    public boolean existsReviewByUserAndProduct(Long userId, Long productId) {
        return reviewRepository.existsByProductIdAndUserId(productId, userId);
    }

    @Override
    public List<ReviewDto> getUserReviews(Long userId) {
        return reviewRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    public ReviewDto getReviewById(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá."));
        return toDto(review);
    }

    private ReviewDto toDto(Review review) {
        Long productId = review.getProduct() != null ? review.getProduct().getId() : null;
        boolean verified = false;
        if (review.getUser() != null && productId != null) {
            try {
                verified = !reviewOrderRepository
                        .findDeliveredOrdersWithProduct(
                                review.getUser().getId(), productId, OrderStatus.DELIVERED)
                        .isEmpty();
            } catch (Exception e) {
                verified = false;
            }
        }

        return ReviewDto.builder()
                .id(review.getId())
                .productId(productId)
                .userId(review.getUser() != null ? review.getUser().getId() : null)
                .userFullName(review.getUser() != null ? review.getUser().getFullName() : null)
                .userAvatarUrl(review.getUser() != null ? review.getUser().getAvatarUrl() : null)
                .rating(review.getRating())
                .title(review.getTitle())
                .content(review.getContent())
                .helpfulCount(review.getHelpfulCount())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .isVerifiedPurchase(verified)
                .build();
    }

    // ══════════════════════════════════════════════════════════════
    //  ADMIN METHODS
    // ══════════════════════════════════════════════════════════════

    @Override
    @Transactional(readOnly = true)
    public PagedAdminReviewResponseDto getPendingReviews(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Review> reviewPage = reviewRepository.findAllByIsApprovedFalse(pageable);
        return buildPagedAdminResponse(reviewPage);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedAdminReviewResponseDto getAllReviews(int page, int size, Long productId, Boolean approved) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Review> reviewPage;
        if (productId != null) {
            reviewPage = reviewRepository.findByProductId(productId, pageable);
        } else if (approved != null) {
            reviewPage = approved
                    ? reviewRepository.findByIsApprovedTrue(pageable)
                    : reviewRepository.findAllByIsApprovedFalse(pageable);
        } else {
            reviewPage = reviewRepository.findAll(pageable);
        }
        return buildPagedAdminResponse(reviewPage);
    }

    private PagedAdminReviewResponseDto buildPagedAdminResponse(Page<Review> reviewPage) {
        List<AdminReviewDto> dtos = reviewPage.getContent().stream()
                .map(this::toAdminDto)
                .toList();
        return PagedAdminReviewResponseDto.builder()
                .reviews(dtos)
                .totalElements(reviewPage.getTotalElements())
                .totalPages(reviewPage.getTotalPages())
                .currentPage(reviewPage.getNumber())
                .pageSize(reviewPage.getSize())
                .build();
    }

    private AdminReviewDto toAdminDto(Review review) {
        Long productId = review.getProduct() != null ? review.getProduct().getId() : null;
        String productName = review.getProduct() != null ? review.getProduct().getName() : null;
        boolean verified = false;
        if (review.getUser() != null && productId != null) {
            try {
                verified = !reviewOrderRepository
                        .findDeliveredOrdersWithProduct(
                                review.getUser().getId(), productId, OrderStatus.DELIVERED)
                        .isEmpty();
            } catch (Exception e) {
                verified = false;
            }
        }
        return AdminReviewDto.builder()
                .id(review.getId())
                .productId(productId)
                .productName(productName)
                .userId(review.getUser() != null ? review.getUser().getId() : null)
                .userFullName(review.getUser() != null ? review.getUser().getFullName() : null)
                .userAvatarUrl(review.getUser() != null ? review.getUser().getAvatarUrl() : null)
                .userEmail(review.getUser() != null ? review.getUser().getEmail() : null)
                .rating(review.getRating())
                .title(review.getTitle())
                .content(review.getContent())
                .isApproved(review.getIsApproved())
                .helpfulCount(review.getHelpfulCount())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .isVerifiedPurchase(verified)
                .build();
    }

    @Override
    @Transactional
    public AdminReviewDto approveReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá."));
        review.setIsApproved(true);
        review.setUpdatedAt(LocalDateTime.now());
        Review saved = reviewRepository.save(review);
        return toAdminDto(saved);
    }

    @Override
    @Transactional
    public AdminReviewDto rejectReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá."));
        review.setIsApproved(false);
        review.setUpdatedAt(LocalDateTime.now());
        Review saved = reviewRepository.save(review);
        return toAdminDto(saved);
    }

    @Override
    @Transactional
    public void deleteReviewAdmin(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá."));
        reviewRepository.delete(review);
    }
}
