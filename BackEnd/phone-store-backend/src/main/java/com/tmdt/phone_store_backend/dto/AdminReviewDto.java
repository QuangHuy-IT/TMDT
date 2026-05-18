package com.tmdt.phone_store_backend.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminReviewDto {
    private Long id;
    private Long productId;
    private String productName;
    private Long userId;
    private String userFullName;
    private String userAvatarUrl;
    private String userEmail;
    private Integer rating;
    private String title;
    private String content;
    private Boolean isApproved;
    private Integer helpfulCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isVerifiedPurchase;
}
