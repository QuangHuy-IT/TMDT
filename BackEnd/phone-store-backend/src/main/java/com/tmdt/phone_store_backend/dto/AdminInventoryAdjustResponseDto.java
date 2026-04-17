package com.tmdt.phone_store_backend.dto;

import java.time.LocalDateTime;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminInventoryAdjustResponseDto {

    private Long productId;
    private String productName;
    private String note;
    private LocalDateTime appliedAt;
    private List<AdminInventoryAdjustItemResponseDto> changes;
}
