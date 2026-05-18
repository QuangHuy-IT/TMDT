package com.tmdt.phone_store_backend.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnswerDto {
    private Long id;
    private Long questionId;
    private Long userId;
    private String userFullName;
    private String userAvatarUrl;
    private Boolean isAdminAnswer;
    private String content;
    private LocalDateTime createdAt;
}
