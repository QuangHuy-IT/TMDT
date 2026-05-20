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
public class UpdateDiscountRequestDto {

    @Min(value = 1, message = "Phần trăm giảm giá phải từ 1%")
    @Max(value = 99, message = "Phần trăm giảm giá không được vượt quá 99%")
    private Integer discountPercent;

    private BigDecimal discountAmount;

    private String discountType; // PERCENT | FIXED

    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private Boolean isActive;
}
