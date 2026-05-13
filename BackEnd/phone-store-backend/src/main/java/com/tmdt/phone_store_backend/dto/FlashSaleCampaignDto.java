package com.tmdt.phone_store_backend.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlashSaleCampaignDto {

    private Long id;
    private String title;
    private boolean isActive;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private LocalDateTime createdAt;

    // Computed
    private boolean isRunning;
    private boolean isEnded;
    private boolean isUpcoming;
    private Long remainingSeconds;

    // Nested
    private List<FlashSaleSessionDto> sessions;
}
