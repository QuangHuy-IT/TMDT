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

    /** Slug của variant đang được chọn (dùng cho URL: /products/iphone-17-pro-max-8gb-256gb-black) */
    private String slug;

    /** Tên sản phẩm (chung cho tất cả variants) */
    private String name;

    /** Thương hiệu */
    private String brand;
    private String brandSlug;

    /** Series */
    private Long seriesId;
    private String seriesName;
    private String seriesSlug;

    /** Giá: lấy từ selectedVariant, hoặc min price của tất cả variants */
    private BigDecimal price;
    private Integer stock;
    private Integer sale;

    /** Thông tin chung */
    private String description;
    private List<String> images;
    private String thumbnailUrl;
    private Map<String, String> specifications;

    /**
     * Tất cả variants của sản phẩm này.
     * Dùng cho trang chi tiết (hiển thị các phiên bản) và trang listing (filter theo storage).
     */
    private List<AdminProductVariantDto> variants;

    /**
     * Options gộp: tất cả storages + colors + prices.
     * Dùng cho frontend build variant switcher.
     */
    private ProductVariantOptionDto variantOptions;

    /**
     * Variant đang được chọn (theo URL slug).
     * Dùng để hiển thị đúng giá, tồn kho, màu của variant hiện tại.
     */
    private AdminProductVariantDto selectedVariant;

    private Boolean isFeatured;
    private LocalDateTime createdAt;
    private LocalDateTime releaseDate;

    /** Flash sale */
    private BigDecimal flashSalePrice;
    private Long flashSaleId;
    private Boolean isFlashSale;
}
