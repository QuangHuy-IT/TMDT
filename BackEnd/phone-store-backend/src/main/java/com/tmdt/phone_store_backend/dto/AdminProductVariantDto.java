package com.tmdt.phone_store_backend.dto;

import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminProductVariantDto {

    private Long id;
    private String sku;
    private String color;
    private String storageLabel;
    private Integer ramGb;
    private Integer storageGb;
    private BigDecimal price;
    private Integer stock;
}