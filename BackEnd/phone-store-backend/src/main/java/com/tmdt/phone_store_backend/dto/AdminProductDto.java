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

    /** ID của variant đại diện trong card này (dùng cho key duy nhất trong danh sách) */
    private Long variantId;

    /**
     * Slug của variant đại diện (dùng cho URL: /products/iphone-17-pro-max-8gb-256gb-black)
     * Tên hiển thị trong card = name + " " + variantName
     */
    private String slug;

    /** Tên sản phẩm (chung cho tất cả variants) */
    private String name;

    /**
     * Tên hiển thị của variant (ví dụ: "2GB 128GB" hoặc "8GB 256GB - Đen").
     * Card hiển thị: "{name} {variantName}".
     */
    private String variantName;

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
    private Double averageRating;
    private Long reviewCount;

    /** Thông tin chung */
    private String shortDescription;
    private String detailDescription;
    private List<String> images;
    private String thumbnailUrl;
    private Map<String, String> specifications;
    private List<ProductSpecificationDto> specificationRows;

    /**
     * Thông số kỹ thuật theo nhóm (CellphoneS-style).
     * Key = tên nhóm (Màn hình, Camera, CPU & RAM, ...), Value = Map<String, String>.
     */
    private Map<String, Map<String, String>> groupedSpecifications;

    /**
     * Tất cả variants của sản phẩm này.
     * Dùng cho trang chi tiết (hiển thị các phiên bản) và trang listing (filter theo storage).
     */
    private List<AdminProductVariantDto> variants;

    /**
     * Danh sách variant dùng cho trang Kho (AdminInventory).
     * Chứa đầy đủ thông tin tồn kho của từng phiên bản.
     */
    private List<AdminProductVariantDto> variantItems;

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
    private BigDecimal originalPrice;
}
