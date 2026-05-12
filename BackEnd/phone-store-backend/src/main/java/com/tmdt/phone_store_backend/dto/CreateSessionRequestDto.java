package com.tmdt.phone_store_backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateSessionRequestDto {

    @NotNull(message = "Campaign ID không được để trống")
    private Long campaignId;

    @NotNull(message = "Thời gian bắt đầu không được để trống")
    private LocalDateTime startAt;

    @NotNull(message = "Thời gian kết thúc không được để trống")
    private LocalDateTime endAt;
}
