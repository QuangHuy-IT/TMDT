package com.tmdt.phone_store_backend.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlashSaleSessionDto {

    private Long id;
    private Long campaignId;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private String status;
    private LocalDateTime createdAt;

    // Countdown info
    private Long remainingSeconds;
    private boolean isUpcoming;
    private boolean isRunning;
    private boolean isEnded;

    // Nested products
    private List<FlashSaleProductDto> products;
}
