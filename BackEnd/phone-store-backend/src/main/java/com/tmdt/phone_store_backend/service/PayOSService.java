package com.tmdt.phone_store_backend.service;

import com.tmdt.phone_store_backend.dto.PayOSPaymentResponseDto;

public interface PayOSService {

    PayOSPaymentResponseDto createPaymentLink(
            String payosOrderCode,
            long amount,
            String description,
            String buyerName,
            String buyerPhone,
            String returnUrl,
            String cancelUrl
    );

    void handleWebhook(Object webhookBody);

    void cancelPaymentLink(String payosOrderCode, String reason);

    void confirmWebhookUrl(String webhookUrl);
}
