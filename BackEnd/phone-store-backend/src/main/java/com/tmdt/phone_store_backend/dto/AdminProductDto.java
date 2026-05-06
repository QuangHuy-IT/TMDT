package com.tmdt.phone_store_backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminProductDto {

    private Long id;
    private String name;
    private String brand;
    private BigDecimal price;
    private Integer stock;
    private String description;
    private List<String> images;
    private String thumbnailUrl;
    private Map<String, String> specifications;
    private ProductVariantOptionDto variants;
    private List<AdminProductVariantDto> variantItems;
    private Boolean isFeatured;
    private LocalDateTime createdAt;
}
