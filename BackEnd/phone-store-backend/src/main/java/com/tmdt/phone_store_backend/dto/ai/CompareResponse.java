package com.tmdt.phone_store_backend.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Response DTO cho compare.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompareResponse {
    private boolean success;
    private String errorMessage;
    private String summary;
    private Map<String, List<String>> specTable;
    private List<ProductDto> products;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductDto {
        private Long productId;
        private String productName;
        private String brand;
        private String thumbnail;
        private BigDecimal price;
        private int variantCount;
        private Map<String, String> specifications;
    }
}
