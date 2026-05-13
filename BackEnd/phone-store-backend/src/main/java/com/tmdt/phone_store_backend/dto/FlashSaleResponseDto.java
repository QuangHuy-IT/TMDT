package com.tmdt.phone_store_backend.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlashSaleResponseDto {

    private List<FlashSaleCampaignDto> campaigns;
    private FlashSaleSessionDto featuredSession;
    private Long totalActiveCampaigns;
    private Long totalActiveSessions;
}
