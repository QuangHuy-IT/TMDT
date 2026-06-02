package com.tmdt.phone_store_backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminProductRequestDto {

    /** Tên sản phẩm (chung cho tất cả variants) */
    @NotBlank(message = "Tên sản phẩm không được để trống")
    @Size(max = 255, message = "Tên sản phẩm tối đa 255 ký tự")
    private String name;

    /** Thương hiệu */
    @NotBlank(message = "Thương hiệu không được để trống")
    @Size(max = 120, message = "Thương hiệu tối đa 120 ký tự")
    private String brand;

    /** Series (nullable) */
    private Long seriesId;

    /** Giá sale % */
    private Integer sale = 0;

    /** Mô tả ngắn (chung cho tất cả variants) */
    private String shortDescription;

    /** Mô tả chi tiết (chung cho tất cả variants) */
    private String detailDescription;

    /** Ảnh thumbnail */
    private String thumbnailUrl;

    /** Ảnh gallery */
    private List<String> images;

    /** Thông số kỹ thuật (chung cho tất cả variants) */
    private Map<String, String> specifications;

    private List<ProductSpecificationDto> specificationRows;

    /**
     * Danh sách variants.
     * Mỗi variant có: color, storage, ram, price, stock, colorImageUrl.
     * REQUIRED: phải có ít nhất 1 variant.
     */
    @Valid
    private List<AdminProductVariantRequestDto> variants;
}
