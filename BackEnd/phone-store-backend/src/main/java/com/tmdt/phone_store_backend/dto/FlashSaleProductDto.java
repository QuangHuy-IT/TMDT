package com.tmdt.phone_store_backend.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlashSaleProductDto {

    private Long id;
    private Long sessionId;
    private Long variantId;
    private String sku;
    private String color;
    private Integer ramGb;
    private Integer storageGb;
    private BigDecimal price;
    private BigDecimal compareAtPrice;
    private BigDecimal flashPrice;
    private Integer quantity;
    private Integer soldQuantity;
    private Integer limitPerUser;
    private String status;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Nested product info
    private Long productId;
    private String productName;
    private String productSlug;
    private String thumbnail;

    // Computed
    private Integer discountPercent;
    private BigDecimal originalPrice;
    private Integer remainingQuantity;
    private Integer progressPercent;
}
