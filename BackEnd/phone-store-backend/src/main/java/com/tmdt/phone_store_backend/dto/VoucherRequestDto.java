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
public class VoucherRequestDto {

    @NotBlank(message = "Mã voucher không được để trống")
    @Size(max = 60, message = "Mã voucher không được vượt quá 60 ký tự")
    private String code;

    @NotBlank(message = "Loại giảm giá không được để trống")
    private String discountType;

    @NotNull(message = "Giá trị giảm không được để trống")
    @DecimalMin(value = "0.01", message = "Giá trị giảm phải lớn hơn 0")
    private BigDecimal discountValue;

    @DecimalMin(value = "0", message = "Giảm giá tối đa không được âm")
    private BigDecimal maxDiscountAmount;

    @DecimalMin(value = "0", message = "Đơn hàng tối thiểu không được âm")
    private BigDecimal minOrderAmount;

    @NotNull(message = "Thời gian bắt đầu không được để trống")
    private LocalDateTime startAt;

    @NotNull(message = "Thời gian kết thúc không được để trống")
    private LocalDateTime endAt;

    @Min(value = 1, message = "Số lần sử dụng phải lớn hơn 0")
    private Integer usageLimit;

    private Boolean isActive = true;
}
