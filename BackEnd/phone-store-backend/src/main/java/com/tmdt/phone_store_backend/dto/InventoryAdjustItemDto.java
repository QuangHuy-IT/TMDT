package com.tmdt.phone_store_backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InventoryAdjustItemDto {

    @NotNull(message = "variantId không được null")
    private Long variantId;

    @NotNull(message = "delta không được null")
    private Integer delta;
}
