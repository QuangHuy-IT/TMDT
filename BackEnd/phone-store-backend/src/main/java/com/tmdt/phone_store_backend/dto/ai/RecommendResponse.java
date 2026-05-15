package com.tmdt.phone_store_backend.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Response DTO cho recommendation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendResponse {
    private boolean success;
    private List<RecommendationDto> recommendations;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecommendationDto {
        private Long productId;
        private String productName;
        private String brandName;
        private String thumbnail;
        private BigDecimal minPrice;
        private BigDecimal maxPrice;
        private Double salePercent;
        private String slug;
        private double score;
        private String reason;
    }
}
