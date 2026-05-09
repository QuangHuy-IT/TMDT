package com.tmdt.phone_store_backend.dto;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HomeBrandSectionDto {

    private BrandDto brand;
    private String bannerUrl;
    private String bannerLinkUrl;
    private List<AdminProductDto> products;
}
