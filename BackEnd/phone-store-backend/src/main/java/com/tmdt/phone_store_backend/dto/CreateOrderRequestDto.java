package com.tmdt.phone_store_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateOrderRequestDto {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotBlank(message = "Receiver name is required")
    private String receiverName;

    @NotBlank(message = "Receiver phone is required")
    private String receiverPhone;

    @NotBlank(message = "Shipping address is required")
    private String shippingAddressText;

    private String note;

    @PositiveOrZero(message = "Subtotal must be zero or positive")
    private BigDecimal subtotalAmount;

    private BigDecimal discountAmount;

    @NotNull(message = "Shipping fee is required")
    private BigDecimal shippingFee;

    @PositiveOrZero(message = "Total amount must be zero or positive")
    private BigDecimal totalAmount;

    @NotBlank(message = "Payment method is required")
    private String paymentMethod; // "COD" or "PAYTOS"

    private Long voucherId;

    private String voucherCode;

    private String orderCode;

    @NotNull(message = "Items are required")
    private List<OrderItemRequestDto> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrderItemRequestDto {
        @NotNull
        private Long variantId;

        @NotBlank
        private String productName;

        private String sku;

        private String color;
        private String ram;
        private String storage;

        @NotNull
        @PositiveOrZero
        private BigDecimal unitPrice;

        @NotNull
        @Positive
        private Integer quantity;

        private String imageUrl;
    }
}
