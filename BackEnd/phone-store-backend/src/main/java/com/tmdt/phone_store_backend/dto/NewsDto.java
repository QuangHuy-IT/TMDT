package com.tmdt.phone_store_backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NewsDto {
    private Long id;
    private String title;
    private String slug;
    private String excerpt;
    private String content;
    private String imageUrl;
    private String category;
    private String categoryLabel;
    private String badge;
    private Boolean isFeatured;
    private Boolean isPublished;
    private Integer viewCount;
    private String authorName;
    private String publishedAt;
    private String createdAt;
    private String updatedAt;
}
