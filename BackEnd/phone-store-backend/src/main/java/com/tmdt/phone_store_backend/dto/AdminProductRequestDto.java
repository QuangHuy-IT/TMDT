package com.tmdt.phone_store_backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminProductRequestDto {

    @NotBlank(message = "Tên sản phẩm không được để trống")
    @Size(max = 255, message = "Tên sản phẩm tối đa 255 ký tự")
    private String name;

    @NotBlank(message = "Thương hiệu không được để trống")
    @Size(max = 120, message = "Thương hiệu tối đa 120 ký tự")
    private String brand;

    @NotNull(message = "Giá không được để trống")
    @DecimalMin(value = "0", message = "Giá phải lớn hơn hoặc bằng 0")
    private BigDecimal price;

    @NotNull(message = "Tồn kho không được để trống")
    private Integer stock;

    private String description;

    private List<String> images;

    private String thumbnailUrl;

    private Map<String, String> specifications;

    @Valid
    private List<AdminProductVariantRequestDto> variants;
}
