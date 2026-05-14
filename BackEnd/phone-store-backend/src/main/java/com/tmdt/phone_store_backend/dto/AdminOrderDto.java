package com.tmdt.phone_store_backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminOrderDto {
    private Long id;
    private String orderCode;
    private Long userId;
    private String userEmail;
    private String userFullName;
    private String receiverName;
    private String receiverPhone;
    private String shippingAddress;
    private String note;
    private Long subtotalAmount;
    private Long discountAmount;
    private Long shippingFee;
    private Long totalAmount;
    private String paymentMethod;
    private String paymentStatus;
    private String orderStatus;
    private String placedAt;
    private String createdAt;
}
