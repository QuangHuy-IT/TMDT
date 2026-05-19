package com.tmdt.phone_store_backend.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tmdt.phone_store_backend.domain.entity.PendingOrder;
import com.tmdt.phone_store_backend.domain.entity.User;
import com.tmdt.phone_store_backend.domain.entity.Voucher;
import com.tmdt.phone_store_backend.dto.CreateOrderRequestDto;
import com.tmdt.phone_store_backend.dto.PayOSPaymentResponseDto;
import com.tmdt.phone_store_backend.exception.ResourceNotFoundException;
import com.tmdt.phone_store_backend.repository.PendingOrderRepository;
import com.tmdt.phone_store_backend.repository.UserRepository;
import com.tmdt.phone_store_backend.repository.VoucherRepository;
import com.tmdt.phone_store_backend.service.OrderPlacementService;
import com.tmdt.phone_store_backend.service.PayOSService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/payment/payos")
@RequiredArgsConstructor
@Slf4j
public class PayOSController {

    private final PayOSService payOSService;
    private final PendingOrderRepository pendingOrderRepository;
    private final UserRepository userRepository;
    private final VoucherRepository voucherRepository;
    private final OrderPlacementService orderPlacementService;
    private final ObjectMapper objectMapper;
    @Value("${app.frontend.url}")
    private String frontendUrl;

    @PostMapping("/place-and-pay")
    public ResponseEntity<PayOSPaymentResponseDto> placeOrderAndCreatePayment(
            @Valid @RequestBody CreateOrderRequestDto request
    ) {
        long payosOrderCode = System.currentTimeMillis();
        String internalOrderCode = "ORD" + payosOrderCode;

        // Resolve voucher: prefer voucherId, fallback to voucherCode lookup
        Long voucherId = request.getVoucherId();
        if (voucherId == null && request.getVoucherCode() != null && !request.getVoucherCode().isBlank()) {
            Voucher voucher = voucherRepository.findByCode(request.getVoucherCode().trim())
                    .filter(Voucher::getIsActive)
                    .orElse(null);
            if (voucher != null) {
                voucherId = voucher.getId();
            }
        }

        String returnUrl = frontendUrl + "/payment/success?orderCode=" + internalOrderCode;
        String cancelUrl = frontendUrl + "/payment/cancel?orderCode=" + internalOrderCode + "&payosOrderCode=" + payosOrderCode;

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        String buyerName = user.getFullName();
        String buyerPhone = user.getPhone();

        String itemsJson;
        try {
            itemsJson = objectMapper.writeValueAsString(request.getItems());
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Lỗi serialize items: " + e.getMessage());
        }

        PendingOrder pendingOrder = new PendingOrder();
        pendingOrder.setPayosOrderCode(String.valueOf(payosOrderCode));
        pendingOrder.setUserId(request.getUserId());
        pendingOrder.setReceiverName(request.getReceiverName());
        pendingOrder.setReceiverPhone(request.getReceiverPhone());
        pendingOrder.setShippingAddressText(request.getShippingAddressText());
        pendingOrder.setNote(request.getNote());
        pendingOrder.setSubtotalAmount(request.getSubtotalAmount() != null ? request.getSubtotalAmount() : java.math.BigDecimal.ZERO);
        pendingOrder.setDiscountAmount(request.getDiscountAmount() != null ? request.getDiscountAmount() : java.math.BigDecimal.ZERO);
        pendingOrder.setShippingFee(request.getShippingFee() != null ? request.getShippingFee() : java.math.BigDecimal.ZERO);
        pendingOrder.setTotalAmount(request.getTotalAmount());
        pendingOrder.setPaymentMethod(request.getPaymentMethod());
        pendingOrder.setItemsJson(itemsJson);
        pendingOrder.setVoucherId(voucherId);
        pendingOrder.setCreatedAt(LocalDateTime.now());
        pendingOrderRepository.save(pendingOrder);

        log.info("Created pending order {} for PayOS orderCode {}", internalOrderCode, payosOrderCode);

        // COD: create Order immediately — no webhook needed
        if ("COD".equalsIgnoreCase(request.getPaymentMethod())) {
            log.info("COD flow: creating order with internalOrderCode={}", internalOrderCode);
            OrderDtoWrapper codResult = createOrderFromRequest(request, internalOrderCode, voucherId);
            log.info("COD order created: {}", codResult.getDto().getOrderCode());
            pendingOrderRepository.delete(pendingOrder);
            log.info("COD order {} created immediately", internalOrderCode);
            return ResponseEntity.ok(PayOSPaymentResponseDto.builder()
                    .orderCode(internalOrderCode)
                    .amount(request.getTotalAmount().longValue())
                    .build());
        }

        // PayOS: create payment link and wait for webhook
        PayOSPaymentResponseDto payment = payOSService.createPaymentLink(
                String.valueOf(payosOrderCode),
                request.getTotalAmount().longValue(),
                "Thanh toan don hang " + internalOrderCode,
                buyerName,
                buyerPhone,
                returnUrl,
                cancelUrl
        );

        payment.setOrderCode(internalOrderCode);
        return ResponseEntity.ok(payment);
    }

    private OrderDtoWrapper createOrderFromRequest(CreateOrderRequestDto request, String orderCode, Long voucherId) {
        log.info("createOrderFromRequest called with orderCode={}, request.paymentMethod={}", orderCode, request.getPaymentMethod());
        CreateOrderRequestDto req = CreateOrderRequestDto.builder()
                .userId(request.getUserId())
                .receiverName(request.getReceiverName())
                .receiverPhone(request.getReceiverPhone())
                .shippingAddressText(request.getShippingAddressText())
                .note(request.getNote())
                .subtotalAmount(request.getSubtotalAmount())
                .discountAmount(request.getDiscountAmount())
                .shippingFee(request.getShippingFee())
                .totalAmount(request.getTotalAmount())
                .paymentMethod(request.getPaymentMethod())
                .voucherId(voucherId)
                .items(request.getItems())
                .orderCode(orderCode)
                .build();
        OrderDtoWrapper result = new OrderDtoWrapper(orderPlacementService.createOrder(req));
        log.info("createOrder returned orderCode={}", result.getDto().getOrderCode());
        return result;
    }

    private static class OrderDtoWrapper {
        private final com.tmdt.phone_store_backend.dto.OrderDto dto;
        OrderDtoWrapper(com.tmdt.phone_store_backend.dto.OrderDto dto) { this.dto = dto; }
        com.tmdt.phone_store_backend.dto.OrderDto getDto() { return dto; }
    }

    @PostMapping("/webhook")
    public ResponseEntity<Map<String, String>> handleWebhook(@RequestBody Object body) {
        try {
            payOSService.handleWebhook(body);
            return ResponseEntity.ok(Map.of("status", "received"));
        } catch (Exception e) {
            log.error("Webhook error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/cancel")
    public ResponseEntity<Void> cancelPayment(@RequestParam String payosOrderCode) {
        payOSService.cancelPaymentLink(payosOrderCode, "User cancelled");
        return ResponseEntity.ok().build();
    }

    @PostMapping("/confirm-webhook")
    public ResponseEntity<Map<String, String>> confirmWebhook(@RequestBody Map<String, String> body) {
        String webhookUrl = body.get("webhookUrl");
        payOSService.confirmWebhookUrl(webhookUrl);
        return ResponseEntity.ok(Map.of("status", "confirmed", "webhookUrl", webhookUrl));
    }
}
