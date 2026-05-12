package com.tmdt.phone_store_backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BrandDto {

    private Long id;
    private String name;
    private String slug;
    private String logoUrl;
}
