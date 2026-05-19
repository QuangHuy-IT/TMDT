package com.tmdt.phone_store_backend.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Request DTO cho recommendation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendRequest {
    private String sessionId;
    private String query;
    private String brand;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private Integer minRam;
    private String usagePurpose;
    
    @Builder.Default
    private int limit = 5;
}
