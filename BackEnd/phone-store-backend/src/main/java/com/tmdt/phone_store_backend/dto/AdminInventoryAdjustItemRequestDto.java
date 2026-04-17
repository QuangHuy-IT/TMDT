package com.tmdt.phone_store_backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminInventoryAdjustItemRequestDto {

    @NotNull(message = "Thiếu variantId")
    private Long variantId;

    @NotNull(message = "Thiếu delta")
    private Integer delta;
}
