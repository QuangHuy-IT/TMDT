package com.tmdt.phone_store_backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductSpecificationDto {

    private Long id;
    private String specCategory;
    private String specKey;
    private String specValue;
    private Integer sortOrder;
}
