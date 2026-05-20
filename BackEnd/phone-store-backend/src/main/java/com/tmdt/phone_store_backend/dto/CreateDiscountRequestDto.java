package com.tmdt.phone_store_backend.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateDiscountRequestDto {

    @NotNull(message = "Variant ID không được để trống")
    private Long variantId;

    @Min(value = 1, message = "Phần trăm giảm giá phải từ 1%")
    @Max(value = 99, message = "Phần trăm giảm giá không được vượt quá 99%")
    private Integer discountPercent;

    private BigDecimal discountAmount;

    private String discountType; // PERCENT | FIXED

    @NotNull(message = "Thời gian bắt đầu không được để trống")
    private LocalDateTime startAt;

    @NotNull(message = "Thời gian kết thúc không được để trống")
    private LocalDateTime endAt;

    private Boolean isActive = true;

    @AssertTrue(message = "Phải có ít nhất một loại giảm giá (phần trăm hoặc số tiền cố định)")
    public boolean hasAtLeastOneDiscountType() {
        return (discountPercent != null && discountPercent > 0)
                || (discountAmount != null && discountAmount.compareTo(BigDecimal.ZERO) > 0);
    }
}
