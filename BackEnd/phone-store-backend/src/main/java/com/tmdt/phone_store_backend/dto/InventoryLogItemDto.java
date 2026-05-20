package com.tmdt.phone_store_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryLogItemDto {

    private Long id;
    private Long productId;
    private String productName;
    private Long variantId;
    private String variantName;
    private String sku;
    private Integer beforeStock;
    private Integer afterStock;
    private Integer delta;
}
