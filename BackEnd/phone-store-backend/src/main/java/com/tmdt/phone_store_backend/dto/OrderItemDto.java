package com.tmdt.phone_store_backend.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItemDto {

    private Long id;
    private Long variantId;
    private String productNameSnapshot;
    private String skuSnapshot;
    private String colorSnapshot;
    private String ramSnapshot;
    private String storageSnapshot;
    private BigDecimal unitPrice;
    private Integer quantity;
    private BigDecimal lineTotal;
    private String imageUrl;
}
