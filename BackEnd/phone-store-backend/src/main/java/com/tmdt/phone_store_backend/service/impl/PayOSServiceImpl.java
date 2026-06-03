package com.tmdt.phone_store_backend.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tmdt.phone_store_backend.domain.entity.Inventory;
import com.tmdt.phone_store_backend.domain.entity.Order;
import com.tmdt.phone_store_backend.domain.entity.OrderItem;
import com.tmdt.phone_store_backend.domain.entity.PendingOrder;
import com.tmdt.phone_store_backend.domain.entity.ProductVariant;
import com.tmdt.phone_store_backend.domain.entity.User;
import com.tmdt.phone_store_backend.domain.entity.Voucher;
import com.tmdt.phone_store_backend.domain.enums.OrderStatus;
import com.tmdt.phone_store_backend.domain.enums.PaymentMethod;
import com.tmdt.phone_store_backend.domain.enums.PaymentStatus;
import com.tmdt.phone_store_backend.domain.enums.StockStatus;
import com.tmdt.phone_store_backend.domain.enums.VoucherDiscountType;
import com.tmdt.phone_store_backend.dto.CreateOrderRequestDto.OrderItemRequestDto;
import com.tmdt.phone_store_backend.dto.PayOSPaymentResponseDto;
import com.tmdt.phone_store_backend.exception.BadRequestException;
import com.tmdt.phone_store_backend.repository.InventoryRepository;
import com.tmdt.phone_store_backend.repository.OrderItemRepository;
import com.tmdt.phone_store_backend.repository.OrderRepository;
import com.tmdt.phone_store_backend.repository.PendingOrderRepository;
import com.tmdt.phone_store_backend.repository.ProductVariantRepository;
import com.tmdt.phone_store_backend.repository.UserRepository;
import com.tmdt.phone_store_backend.repository.VoucherRepository;
import com.tmdt.phone_store_backend.service.PayOSService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLinkItem;
import vn.payos.model.webhooks.WebhookData;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PayOSServiceImpl implements PayOSService {

    private final PayOS payOS;
    private final PendingOrderRepository pendingOrderRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final ProductVariantRepository productVariantRepository;
    private final VoucherRepository voucherRepository;
    private final InventoryRepository inventoryRepository;
    private final ObjectMapper objectMapper;

    @Value("${payos.client-id}")
    private String payosClientId;

    @Value("${payos.api-key}")
    private String payosApiKey;

    private static final String PAYOS_API_BASE = "https://api-merchant.payos.vn";

    @Override
    @Transactional
    public PayOSPaymentResponseDto createPaymentLink(
            String payosOrderCode,
            long amount,
            String description,
            String buyerName,
            String buyerPhone,
            String returnUrl,
            String cancelUrl
    ) {
        if (amount <= 0) {
            throw new BadRequestException("Số tiền thanh toán phải lớn hơn 0");
        }
        if (amount < 1000) {
            throw new BadRequestException("Số tiền thanh toán tối thiểu là 1,000 VND");
        }

        pendingOrderRepository.findById(payosOrderCode)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy pending order: " + payosOrderCode));

        String finalDescription = description.length() > 25
                ? description.substring(0, 22) + "..."
                : description;

        try {
            PaymentLinkItem item = PaymentLinkItem.builder()
                    .name("Thanh toan don hang " + payosOrderCode)
                    .quantity(1)
                    .price(amount)
                    .build();

            CreatePaymentLinkRequest request = CreatePaymentLinkRequest.builder()
                    .orderCode(Long.parseLong(payosOrderCode))
                    .amount((long) amount)
                    .description(finalDescription)
                    .buyerName(buyerName)
                    .buyerPhone(buyerPhone)
                    .returnUrl(returnUrl)
                    .cancelUrl(cancelUrl)
                    .item(item)
                    .build();

            CreatePaymentLinkResponse response = payOS.paymentRequests().create(request);

            log.info("Created PayOS payment link: payosOrderCode={}, paymentLinkId={}, checkoutUrl={}",
                    payosOrderCode, response.getPaymentLinkId(), response.getCheckoutUrl());

            return PayOSPaymentResponseDto.builder()
                    .orderCode(null)
                    .paymentLinkId(response.getPaymentLinkId())
                    .checkoutUrl(response.getCheckoutUrl())
                    .qrCode(response.getQrCode())
                    .amount(amount)
                    .status(response.getStatus() != null ? response.getStatus().name() : null)
                    .bin(response.getBin())
                    .accountNumber(response.getAccountNumber())
                    .accountName(response.getAccountName())
                    .description(response.getDescription())
                    .build();

        } catch (Exception e) {
            log.error("Failed to create PayOS payment link: {}", e.getMessage(), e);
            throw new BadRequestException("Không thể tạo liên kết thanh toán PayOS: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public void handleWebhook(Object webhookBody) {
        try {
            WebhookData data = payOS.webhooks().verify(webhookBody);
            log.info("Received PayOS webhook: orderCode={}, paymentLinkId={}, amount={}, code={}, desc={}",
                    data.getOrderCode(), data.getPaymentLinkId(), data.getAmount(), data.getCode(), data.getDesc());

            String payosOrderCode = String.valueOf(data.getOrderCode());

            // === SUCCESS ===
            if ("00".equals(data.getCode())) {
                log.info("PayOS payment SUCCESS for orderCode={}", payosOrderCode);
                PendingOrder pending = pendingOrderRepository.findById(payosOrderCode).orElse(null);
                if (pending == null) {
                    log.error("PendingOrder not found for payosOrderCode: {}. Order may already be processed.", payosOrderCode);
                    return;
                }
                if (orderRepository.existsByOrderCode("ORD" + payosOrderCode)) {
                    log.info("Order already created for payosOrderCode: {}. Skipping duplicate.", payosOrderCode);
                    pendingOrderRepository.delete(pending);
                    return;
                }
                Order order = createOrderFromPending(pending);
                deductWebhookStock(pending);
                pendingOrderRepository.delete(pending);
                log.info("Order {} created successfully via PayOS webhook", order.getOrderCode());
                return;
            }

            // === CANCELLATION ===
            if ("CANCELLED".equals(data.getCode()) || "01".equals(data.getCode()) || "PAYMENT_CANCELLED".equals(data.getCode())) {
                log.info("PayOS payment CANCELLED for orderCode={}", payosOrderCode);

                // If Order already exists (webhook arrived after success), update its status
                String orderCode = "ORD" + payosOrderCode;
                if (orderRepository.existsByOrderCode(orderCode)) {
                    orderRepository.findByOrderCode(orderCode).ifPresent(order -> {
                        order.setOrderStatus(OrderStatus.CANCELED);
                        order.setUpdatedAt(LocalDateTime.now());
                        orderRepository.save(order);
                        log.info("Order {} updated to CANCELLED via PayOS webhook", orderCode);
                    });
                    return;
                }

                // If only PendingOrder exists, just delete it
                PendingOrder pending = pendingOrderRepository.findById(payosOrderCode).orElse(null);
                if (pending != null) {
                    pendingOrderRepository.delete(pending);
                    log.info("PendingOrder {} deleted (no Order was created)", payosOrderCode);
                }
                return;
            }

            log.warn("PayOS webhook received unhandled code: {} - {}", data.getCode(), data.getDesc());

        } catch (Exception e) {
            log.error("Error processing PayOS webhook: {}", e.getMessage(), e);
            throw new RuntimeException("Loi xu ly webhook: " + e.getMessage());
        }
    }

    private Order createOrderFromPending(PendingOrder pending) throws JsonProcessingException {
        User user = userRepository.findById(pending.getUserId()).orElse(null);

        Voucher voucher = null;
        if (pending.getVoucherId() != null) {
            voucher = voucherRepository.findById(pending.getVoucherId()).orElse(null);
        }

        Order order = new Order();
        order.setOrderCode("ORD" + pending.getPayosOrderCode());
        order.setUser(user);
        order.setReceiverName(pending.getReceiverName());
        order.setReceiverPhone(pending.getReceiverPhone());
        order.setShippingAddressText(pending.getShippingAddressText());
        order.setNote(pending.getNote());
        order.setSubtotalAmount(pending.getSubtotalAmount());
        order.setDiscountAmount(pending.getDiscountAmount());
        order.setShippingFee(pending.getShippingFee());
        order.setTotalAmount(pending.getTotalAmount());
        order.setPaymentMethod(PaymentMethod.valueOf(pending.getPaymentMethod()));
        order.setPaymentStatus(PaymentStatus.PAID);
        order.setOrderStatus(OrderStatus.CONFIRMED);
        order.setVoucher(voucher);
        order.setPaidAt(LocalDateTime.now());
        order.setPlacedAt(LocalDateTime.now());
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
        order.setOrderItems(new ArrayList<>());

        Order savedOrder = orderRepository.save(order);

        List<OrderItemRequestDto> itemDtos = objectMapper.readValue(
                pending.getItemsJson(),
                objectMapper.getTypeFactory().constructCollectionType(List.class, OrderItemRequestDto.class)
        );

        for (OrderItemRequestDto itemDto : itemDtos) {
            ProductVariant variant = productVariantRepository.findById(itemDto.getVariantId()).orElse(null);
            BigDecimal lineTotal = itemDto.getUnitPrice().multiply(BigDecimal.valueOf(itemDto.getQuantity()));

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(savedOrder);
            orderItem.setVariant(variant);
            orderItem.setProductNameSnapshot(itemDto.getProductName());
            orderItem.setSkuSnapshot(itemDto.getSku());
            orderItem.setColorSnapshot(itemDto.getColor());
            orderItem.setRamSnapshot(itemDto.getRam());
            orderItem.setStorageSnapshot(itemDto.getStorage());
            orderItem.setUnitPrice(itemDto.getUnitPrice());
            orderItem.setQuantity(itemDto.getQuantity());
            orderItem.setLineTotal(lineTotal);
            orderItem.setCreatedAt(LocalDateTime.now());
            savedOrder.getOrderItems().add(orderItem);
        }

        orderItemRepository.saveAll(savedOrder.getOrderItems());
        return orderRepository.save(savedOrder);
    }

    @Override
    public void cancelPaymentLink(String payosOrderCode, String reason) {
        try {
            RestTemplate restTemplate = new RestTemplate();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-client-id", payosClientId);
            headers.set("x-api-key", payosApiKey);

            Map<String, String> body = Map.of("cancellationReason", reason);

            String url = PAYOS_API_BASE + "/v2/payment-requests/" + payosOrderCode + "/cancel";

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

            log.info("PayOS cancel response: status={}, body={}", response.getStatusCode(), response.getBody());

        } catch (Exception e) {
            log.error("Failed to cancel PayOS payment link {}: {}", payosOrderCode, e.getMessage());
        }

        // Update Order if it already exists (webhook arrived before cancel)
        String orderCode = "ORD" + payosOrderCode;
        orderRepository.findByOrderCode(orderCode).ifPresent(order -> {
                if (order.getOrderStatus() != OrderStatus.CANCELED) {
                    order.setOrderStatus(OrderStatus.CANCELED);
                order.setUpdatedAt(LocalDateTime.now());
                orderRepository.save(order);
                log.info("Order {} updated to CANCELLED after cancelPaymentLink", orderCode);
            }
        });

        // Delete PendingOrder if still present
        pendingOrderRepository.findById(payosOrderCode).ifPresent(pendingOrder -> {
            pendingOrderRepository.delete(pendingOrder);
            log.info("Deleted pending order: {}", payosOrderCode);
        });
    }

    private void deductWebhookStock(PendingOrder pending) {
        try {
            List<OrderItemRequestDto> itemDtos = objectMapper.readValue(
                    pending.getItemsJson(),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, OrderItemRequestDto.class)
            );

            for (OrderItemRequestDto item : itemDtos) {
                if (item.getVariantId() == null || item.getQuantity() == null) continue;

                Inventory inventory = inventoryRepository.findByVariantId(item.getVariantId()).orElse(null);
                if (inventory == null) {
                    log.warn("Webhook: Inventory not found for variant {}", item.getVariantId());
                    continue;
                }

                int currentStock = inventory.getQuantityOnHand();
                int requestedQty = item.getQuantity();
                int newStock = Math.max(0, currentStock - requestedQty);

                inventory.setQuantityOnHand(newStock);
                inventory.setUpdatedAt(java.time.LocalDateTime.now());

                if (newStock <= 0) {
                    inventory.setStockStatus(StockStatus.OUT_OF_STOCK);
                } else if (newStock <= 5) {
                    inventory.setStockStatus(StockStatus.LOW_STOCK);
                } else {
                    inventory.setStockStatus(StockStatus.IN_STOCK);
                }

                inventoryRepository.save(inventory);
                log.info("Webhook stock deducted for variant {}: {} -> {} (status={})",
                        item.getVariantId(), currentStock, newStock, inventory.getStockStatus());
            }
        } catch (JsonProcessingException e) {
            log.error("Failed to parse itemsJson for webhook stock deduction: {}", e.getMessage());
        }
    }

    @Override
    public void confirmWebhookUrl(String webhookUrl) {
        try {
            payOS.webhooks().confirm(webhookUrl);
            log.info("Webhook URL confirmed: {}", webhookUrl);
        } catch (Exception e) {
            log.error("Failed to confirm webhook URL: {}", e.getMessage(), e);
            throw new BadRequestException("Không thể xác nhận webhook URL: " + e.getMessage());
        }
    }
}
