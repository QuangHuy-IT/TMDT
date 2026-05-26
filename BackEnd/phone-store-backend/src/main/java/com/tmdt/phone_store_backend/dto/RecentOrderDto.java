package com.tmdt.phone_store_backend.dto;

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
public class RecentOrderDto {
    private Long id;
    private String orderCode;
    private String customerName;
    private Long totalAmount;
    private String orderStatus;
    private String createdAt;
}
