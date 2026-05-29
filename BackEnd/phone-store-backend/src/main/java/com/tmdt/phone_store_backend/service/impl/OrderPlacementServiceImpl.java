package com.tmdt.phone_store_backend.service.impl;

import com.tmdt.phone_store_backend.domain.entity.Order;
import com.tmdt.phone_store_backend.domain.entity.OrderItem;
import com.tmdt.phone_store_backend.domain.entity.ProductVariant;
import com.tmdt.phone_store_backend.domain.entity.User;
import com.tmdt.phone_store_backend.domain.entity.Voucher;
import com.tmdt.phone_store_backend.domain.enums.OrderStatus;
import com.tmdt.phone_store_backend.domain.enums.PaymentMethod;
import com.tmdt.phone_store_backend.domain.enums.PaymentStatus;
import com.tmdt.phone_store_backend.dto.CreateOrderRequestDto;
import com.tmdt.phone_store_backend.dto.OrderDto;
import com.tmdt.phone_store_backend.dto.OrderItemDto;
import com.tmdt.phone_store_backend.exception.BadRequestException;
import com.tmdt.phone_store_backend.exception.ResourceNotFoundException;
import com.tmdt.phone_store_backend.repository.OrderItemRepository;
import com.tmdt.phone_store_backend.repository.OrderRepository;
import com.tmdt.phone_store_backend.repository.ProductImageRepository;
import com.tmdt.phone_store_backend.repository.ProductVariantRepository;
import com.tmdt.phone_store_backend.repository.UserRepository;
import com.tmdt.phone_store_backend.repository.VoucherRepository;
import com.tmdt.phone_store_backend.service.OrderPlacementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderPlacementServiceImpl implements OrderPlacementService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductImageRepository productImageRepository;
    private final VoucherRepository voucherRepository;

    @Override
    @Transactional
    public OrderDto createOrder(CreateOrderRequestDto request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        String orderCode = request.getOrderCode() != null && !request.getOrderCode().isBlank()
                ? request.getOrderCode()
                : "ORD" + System.currentTimeMillis();

        Voucher voucher = null;
        if (request.getVoucherId() != null) {
            voucher = voucherRepository.findById(request.getVoucherId()).orElse(null);
        }

        Order order = new Order();
        order.setOrderCode(orderCode);
        order.setUser(user);
        order.setReceiverName(request.getReceiverName());
        order.setReceiverPhone(request.getReceiverPhone());
        order.setShippingAddressText(request.getShippingAddressText());
        order.setNote(request.getNote());
        order.setSubtotalAmount(request.getSubtotalAmount() != null ? request.getSubtotalAmount() : BigDecimal.ZERO);
        order.setDiscountAmount(request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO);
        order.setShippingFee(request.getShippingFee() != null ? request.getShippingFee() : BigDecimal.ZERO);
        order.setTotalAmount(request.getTotalAmount());
        order.setPaymentMethod(PaymentMethod.valueOf(request.getPaymentMethod()));
        order.setPaymentStatus(PaymentStatus.UNPAID);
        order.setOrderStatus(OrderStatus.PENDING);
        order.setVoucher(voucher);
        order.setPlacedAt(LocalDateTime.now());
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
        order.setOrderItems(new ArrayList<>());

        Order savedOrder = orderRepository.save(order);

        BigDecimal calculatedSubtotal = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (CreateOrderRequestDto.OrderItemRequestDto itemDto : request.getItems()) {
            ProductVariant variant = productVariantRepository.findById(itemDto.getVariantId())
                    .orElseThrow(() -> new BadRequestException(
                            "Không tìm thấy sản phẩm: " + itemDto.getProductName()));

            BigDecimal lineTotal = itemDto.getUnitPrice().multiply(BigDecimal.valueOf(itemDto.getQuantity()));
            calculatedSubtotal = calculatedSubtotal.add(lineTotal);

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(savedOrder);
            orderItem.setVariant(variant);
            orderItem.setProductNameSnapshot(itemDto.getProductName());
            orderItem.setSkuSnapshot(itemDto.getSku() != null ? itemDto.getSku() : variant.getSku());
            orderItem.setColorSnapshot(itemDto.getColor());
            orderItem.setRamSnapshot(itemDto.getRam());
            orderItem.setStorageSnapshot(itemDto.getStorage());
            orderItem.setUnitPrice(itemDto.getUnitPrice());
            orderItem.setQuantity(itemDto.getQuantity());
            orderItem.setLineTotal(lineTotal);
            orderItem.setCreatedAt(LocalDateTime.now());

            orderItems.add(orderItem);
        }

        orderItemRepository.saveAll(orderItems);
        savedOrder.setOrderItems(orderItems);

        if (request.getSubtotalAmount() == null || request.getSubtotalAmount().compareTo(BigDecimal.ZERO) == 0) {
            savedOrder.setSubtotalAmount(calculatedSubtotal);
        }

        Order finalOrder = orderRepository.save(savedOrder);
        log.info("Created and saved order with orderCode: {} (id={})", finalOrder.getOrderCode(), finalOrder.getId());

        return toDto(finalOrder);
    }

    @Override
    @Transactional
    public OrderDto createOrderAndReturnDto(CreateOrderRequestDto request) {
        return createOrder(request);
    }

    @Override
    @Transactional
    public void updatePaymentStatus(Long orderId, String paymentStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng: " + orderId));
        order.setPaymentStatus(PaymentStatus.valueOf(paymentStatus));
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);
    }

    private OrderDto toDto(Order order) {
        List<OrderItemDto> itemDtos = order.getOrderItems() == null
                ? List.of()
                : order.getOrderItems().stream()
                        .map(this::toItemDto)
                        .toList();

        return OrderDto.builder()
                .id(order.getId())
                .orderCode(order.getOrderCode())
                .paymentLinkId(order.getPaymentLinkId())
                .orderStatus(order.getOrderStatus().name())
                .paymentMethod(order.getPaymentMethod().name())
                .paymentStatus(order.getPaymentStatus().name())
                .receiverName(order.getReceiverName())
                .receiverPhone(order.getReceiverPhone())
                .shippingAddressText(order.getShippingAddressText())
                .note(order.getNote())
                .subtotalAmount(order.getSubtotalAmount())
                .discountAmount(order.getDiscountAmount())
                .shippingFee(order.getShippingFee())
                .totalAmount(order.getTotalAmount())
                .placedAt(order.getPlacedAt())
                .paidAt(order.getPaidAt())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .items(itemDtos)
                .build();
    }

    private OrderItemDto toItemDto(OrderItem item) {
        String imageUrl = resolveImageUrl(item);

        return OrderItemDto.builder()
                .id(item.getId())
                .variantId(item.getVariant() != null ? item.getVariant().getId() : null)
                .productNameSnapshot(item.getProductNameSnapshot())
                .skuSnapshot(item.getSkuSnapshot())
                .colorSnapshot(item.getColorSnapshot())
                .ramSnapshot(item.getRamSnapshot())
                .storageSnapshot(item.getStorageSnapshot())
                .unitPrice(item.getUnitPrice())
                .quantity(item.getQuantity())
                .lineTotal(item.getLineTotal())
                .imageUrl(imageUrl)
                .build();
    }

    private String resolveImageUrl(OrderItem item) {
        if (item.getVariant() == null || item.getVariant().getProduct() == null) {
            return null;
        }
        if (item.getVariant().getProduct().getThumbnailUrl() != null
                && !item.getVariant().getProduct().getThumbnailUrl().isBlank()) {
            return item.getVariant().getProduct().getThumbnailUrl();
        }
        Long productId = item.getVariant().getProduct().getId();
        var images = productImageRepository.findByProductIdOrderBySortOrderAscIdAsc(productId);
        if (images.isEmpty()) return null;
        var primary = images.stream().filter(img -> Boolean.TRUE.equals(img.getIsPrimary())).findFirst();
        return primary.map(img -> img.getImageUrl()).orElse(images.get(0).getImageUrl());
    }
}
