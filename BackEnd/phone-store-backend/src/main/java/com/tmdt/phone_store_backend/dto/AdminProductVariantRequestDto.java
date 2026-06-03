package com.tmdt.phone_store_backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminProductVariantRequestDto {

    /** ID của variant đã tồn tại (null = variant mới) */
    private Long id;

    private String color;

    /** VD: "128GB", "256GB", "1TB" */
    private String storageLabel;

    @Min(value = 0, message = "RAM phải lớn hơn hoặc bằng 0")
    private Integer ramGb;

    @Min(value = 0, message = "Dung lượng phải lớn hơn hoặc bằng 0")
    private Integer storageGb;

    @DecimalMin(value = "0", message = "Giá biến thể phải lớn hơn hoặc bằng 0")
    private BigDecimal price;

    /** Giá nhập */
    @DecimalMin(value = "0", message = "Giá nhập phải lớn hơn hoặc bằng 0")
    private BigDecimal costPrice;

    @NotNull(message = "Tồn kho không được để trống")
    @Min(value = 0, message = "Tồn kho không được nhỏ hơn 0")
    private Integer stock;

    private String colorImageUrl;

    private List<String> images;
}
