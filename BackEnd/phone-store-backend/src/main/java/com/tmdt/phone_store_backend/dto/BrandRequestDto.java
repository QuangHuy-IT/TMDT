package com.tmdt.phone_store_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BrandRequestDto {
    @NotBlank(message = "Tên thương hiệu không được để trống")
    private String name;

    private String logoUrl;

    private Boolean isActive = true;

    private Integer sortOrder;
}
