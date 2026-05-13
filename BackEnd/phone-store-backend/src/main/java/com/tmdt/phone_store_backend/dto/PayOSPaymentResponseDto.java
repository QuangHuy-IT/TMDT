package com.tmdt.phone_store_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayOSPaymentResponseDto {

    private String orderCode;
    private String paymentLinkId;
    private String checkoutUrl;
    private String qrCode;
    private Long amount;
    private String status;
    private String bin;
    private String accountNumber;
    private String accountName;
    private String description;
}
