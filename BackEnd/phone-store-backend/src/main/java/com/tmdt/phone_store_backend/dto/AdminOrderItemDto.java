package com.tmdt.phone_store_backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminOrderItemDto {
    private Long id;
    private Long variantId;
    private String productName;
    private String sku;
    private String color;
    private String ram;
    private String storage;
    private Long unitPrice;
    private Integer quantity;
    private Long lineTotal;
}
