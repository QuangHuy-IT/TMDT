package com.tmdt.phone_store_backend.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductDiscountDto {
    private Long id;
    private Long variantId;
    private Long productId;
    private String productName;
    private String productSlug;
    private String variantSku;
    private String color;
    private String ramLabel;
    private String storageLabel;
    private BigDecimal originalPrice;
    private Integer discountPercent;
    private BigDecimal discountAmount;
    private BigDecimal discountPrice;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private Boolean isActive;
    private String status; // ACTIVE, UPCOMING, ENDED
}
