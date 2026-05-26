package com.tmdt.phone_store_backend.dto;

import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminProductVariantDto {

    private Long id;
    private String sku;

    /** Slug cho URL: /products/iphone-17-pro-max-8gb-256gb-black */
    private String slug;

    private String color;

    /** VD: "128GB", "256GB", "1TB" */
    private String storageLabel;

    private Integer ramGb;
    private Integer storageGb;
    private BigDecimal price;
    private BigDecimal costPrice;
    private Integer stock;
    private BigDecimal compareAtPrice;
    private String colorImageUrl;

    /** Số tiền đã giảm (hiện tại: discountAmount = số tiền giảm trực tiếp) */
    private BigDecimal saleAmount;
}
