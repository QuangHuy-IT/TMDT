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
    private String slug;
    private String name;
    private String baseName;
    private String brand;
    private String brandSlug;
    private Long seriesId;
    private String seriesName;
    private String seriesSlug;
    private BigDecimal price;
    private Integer stock;
    private Integer sale;
    private String description;
    private List<String> images;
    private String thumbnailUrl;
    private Map<String, String> specifications;
    private List<AdminProductVariantDto> variants;
    private ProductVariantOptionDto variantOptions;
    private List<AdminProductVariantDto> variantItems;
    private List<AdminProductDto> relatedProducts;
    private Boolean isFeatured;
    private LocalDateTime createdAt;
    private LocalDateTime releaseDate;
    private BigDecimal flashSalePrice;
    private Long flashSaleId;
    private Boolean isFlashSale;
}
