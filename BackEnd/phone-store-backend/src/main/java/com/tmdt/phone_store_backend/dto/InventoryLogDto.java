package com.tmdt.phone_store_backend.dto;

import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryLogDto {

    private Long id;
    private String logCode;
    private Integer totalAdjustments;
    private Integer totalProducts;
    private String note;
    private String createdByName;
    private LocalDateTime createdAt;
    private List<InventoryLogItemDto> items;
}
