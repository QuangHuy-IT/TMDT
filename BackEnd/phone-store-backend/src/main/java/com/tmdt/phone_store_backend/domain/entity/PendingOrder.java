package com.tmdt.phone_store_backend.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "pending_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PendingOrder {

    @Id
    private String payosOrderCode;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "receiver_name", nullable = false)
    private String receiverName;

    @Column(name = "receiver_phone", nullable = false)
    private String receiverPhone;

    @Column(name = "shipping_address_text", nullable = false)
    private String shippingAddressText;

    private String note;

    @Column(nullable = false, precision = 15, scale = 2)
    private java.math.BigDecimal subtotalAmount;

    @Column(nullable = false, precision = 15, scale = 2)
    private java.math.BigDecimal discountAmount;

    @Column(nullable = false, precision = 15, scale = 2)
    private java.math.BigDecimal shippingFee;

    @Column(nullable = false, precision = 15, scale = 2)
    private java.math.BigDecimal totalAmount;

    @Column(name = "payment_method", nullable = false)
    private String paymentMethod;

    @Column(name = "items_json", nullable = false, columnDefinition = "TEXT")
    private String itemsJson;

    @Column(name = "voucher_id")
    private Long voucherId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
