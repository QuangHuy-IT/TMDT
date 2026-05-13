package com.tmdt.phone_store_backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FlashSaleItemDto {

    private Long id;
    private String slug;
    private String name;
    private String brand;
    private String brandSlug;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private Integer sale;
    private Integer stock;
    private Integer soldQuantity;
    private Integer totalQuantity;
    private String thumbnail;
}
