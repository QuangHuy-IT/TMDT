package com.tmdt.phone_store_backend.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateFlashSaleProductRequestDto {

    private BigDecimal flashPrice;

    private Integer quantity;

    private Integer soldQuantity;

    private Integer limitPerUser;

    private Integer sortOrder;

    private String status;
}
