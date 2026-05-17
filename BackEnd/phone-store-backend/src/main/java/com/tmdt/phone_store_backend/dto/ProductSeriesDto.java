package com.tmdt.phone_store_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductSeriesDto {

    private Long id;
    private String name;
    private String slug;
    private String description;
    private Long brandId;
    private String brandName;
    private Boolean isActive;
    private Integer sortOrder;
}
