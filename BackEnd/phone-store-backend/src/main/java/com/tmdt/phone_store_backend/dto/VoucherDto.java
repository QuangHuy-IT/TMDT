package com.tmdt.phone_store_backend.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoucherDto {

    private Long id;
    private String code;
    private String discountType;
    private BigDecimal discountValue;
    private BigDecimal maxDiscountAmount;
    private BigDecimal minOrderAmount;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private Integer usageLimit;
    private Integer usedCount;
    private Boolean isActive;
    private LocalDateTime createdAt;

    public boolean isExpired() {
        return endAt != null && LocalDateTime.now().isAfter(endAt);
    }

    public boolean isNotStarted() {
        return startAt != null && LocalDateTime.now().isBefore(startAt);
    }

    public boolean isAvailable() {
        if (Boolean.FALSE.equals(isActive)) return false;
        if (isExpired()) return false;
        if (isNotStarted()) return false;
        if (usageLimit != null && usedCount != null && usedCount >= usageLimit) return false;
        return true;
    }
}
