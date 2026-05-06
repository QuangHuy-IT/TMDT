package com.tmdt.phone_store_backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminProductVariantRequestDto {

    private String color;

    private String storageLabel;

    @Min(value = 0, message = "RAM phải lớn hơn hoặc bằng 0")
    private Integer ramGb;

    @Min(value = 0, message = "Dung lượng phải lớn hơn hoặc bằng 0")
    private Integer storageGb;

    @DecimalMin(value = "0", message = "Giá biến thể phải lớn hơn hoặc bằng 0")
    private BigDecimal price;

    @Min(value = 0, message = "Tồn kho biến thể phải lớn hơn hoặc bằng 0")
    private Integer stock;

    private String colorImageUrl;
}