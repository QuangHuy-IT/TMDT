package com.tmdt.phone_store_backend.dto;

import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionDto {
    private Long id;
    private Long productId;
    private String productName;
    private Long userId;
    private String userFullName;
    private String userAvatarUrl;
    private String content;
    private Boolean isAnswered;
    private Boolean isVisible;
    private List<AnswerDto> answers;
    private LocalDateTime createdAt;
}
