package com.tmdt.phone_store_backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateReviewRequestDto {

    @Min(value = 1, message = "Số sao phải từ 1 đến 5")
    @Max(value = 5, message = "Số sao phải từ 1 đến 5")
    private Integer rating;

    @Size(max = 200, message = "Tiêu đề đánh giá không được vượt quá 200 ký tự")
    private String title;

    @Size(max = 2000, message = "Nội dung đánh giá không được vượt quá 2000 ký tự")
    private String content;
}
