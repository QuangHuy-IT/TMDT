package com.tmdt.phone_store_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BannerRequestDto {
    @NotBlank(message = "Tiêu đề không được để trống")
    private String title;

    @NotBlank(message = "URL ảnh không được để trống")
    private String imageUrl;

    private String linkUrl;

    @NotBlank(message = "Vị trí không được để trống")
    private String position = "home";

    private String startAt;
    private String endAt;
    private Boolean isActive = true;
    private Integer sortOrder = 0;
}
