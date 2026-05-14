package com.tmdt.phone_store_backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BannerDto {
    private Long id;
    private String title;
    private String subtitle;
    private String imageUrl;
    private String linkUrl;
    private String buttonText;
    private String position;
    private String startAt;
    private String endAt;
    private Boolean isActive;
    private Integer sortOrder;
}
