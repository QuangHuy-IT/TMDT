package com.tmdt.phone_store_backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminInventoryAdjustItemResponseDto {

    private Long variantId;
    private String variantName;
    private Integer beforeStock;
    private Integer delta;
    private Integer afterStock;
}
