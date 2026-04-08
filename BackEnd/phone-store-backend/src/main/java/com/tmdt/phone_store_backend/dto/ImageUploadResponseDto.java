package com.tmdt.phone_store_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class ImageUploadResponseDto {

    private String imageUrl;
    private String publicId;
}
