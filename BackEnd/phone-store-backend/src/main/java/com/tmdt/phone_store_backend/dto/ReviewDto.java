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
public class ReviewDto {
    private Long id;
    private Long productId;
    private Long userId;
    private String userFullName;
    private String userAvatarUrl;
    private Integer rating;
    private String title;
    private String content;
    private Integer helpfulCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isVerifiedPurchase;
}
