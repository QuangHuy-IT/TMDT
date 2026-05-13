package com.tmdt.phone_store_backend.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddFlashSaleProductRequestDto {

    @NotNull(message = "Session ID không được để trống")
    private Long sessionId;

    @NotNull(message = "Variant ID không được để trống")
    private Long variantId;

    @NotNull(message = "Giá flash sale không được để trống")
    @DecimalMin(value = "1000", message = "Giá phải lớn hơn 1000")
    private BigDecimal flashPrice;

    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 1, message = "Số lượng phải lớn hơn 0")
    private Integer quantity;

    @Builder.Default
    @Min(value = 1, message = "Giới hạn mỗi user phải lớn hơn 0")
    private Integer limitPerUser = 1;

    @Builder.Default
    @Min(value = 0, message = "Sort order phải lớn hơn hoặc bằng 0")
    private Integer sortOrder = 0;
}
