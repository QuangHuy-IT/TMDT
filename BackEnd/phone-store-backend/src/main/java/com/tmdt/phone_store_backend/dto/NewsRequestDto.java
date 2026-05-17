package com.tmdt.phone_store_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NewsRequestDto {

    @NotBlank(message = "Tiêu đề không được để trống")
    @Size(max = 200, message = "Tiêu đề không được vượt quá 200 ký tự")
    private String title;

    private String excerpt;

    private String content;

    private String imageUrl;

    private String category;

    @Size(max = 30, message = "Nhãn không được vượt quá 30 ký tự")
    private String badge;

    private Boolean isFeatured = false;

    private Boolean isPublished = true;

    @Size(max = 100, message = "Tên tác giả không được vượt quá 100 ký tự")
    private String authorName;

    private String publishedAt;

    // Danh mục tùy chỉnh (khi người dùng thêm danh mục mới)
    private String customCategory;

    // Nhãn tùy chỉnh (khi người dùng thêm nhãn mới)
    private String customBadge;
}
