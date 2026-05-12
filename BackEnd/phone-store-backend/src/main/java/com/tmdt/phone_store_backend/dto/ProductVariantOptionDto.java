package com.tmdt.phone_store_backend.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductVariantOptionDto {

    private List<String> storages;
    private List<ProductVariantColorDto> colors;
    private Map<String, BigDecimal> basePrices;
}