package com.tmdt.phone_store_backend.service;

import com.tmdt.phone_store_backend.domain.entity.Order;
import com.tmdt.phone_store_backend.domain.entity.OrderItem;
import com.tmdt.phone_store_backend.domain.entity.ProductImage;
import com.tmdt.phone_store_backend.domain.enums.OrderStatus;
import com.tmdt.phone_store_backend.domain.enums.StockStatus;
import com.tmdt.phone_store_backend.dto.OrderDto;
import com.tmdt.phone_store_backend.dto.OrderItemDto;
import com.tmdt.phone_store_backend.exception.BadRequestException;
import com.tmdt.phone_store_backend.exception.ResourceNotFoundException;
import com.tmdt.phone_store_backend.repository.InventoryRepository;
import com.tmdt.phone_store_backend.repository.OrderRepository;
import com.tmdt.phone_store_backend.repository.ProductImageRepository;
import com.tmdt.phone_store_backend.service.OrderPlacementService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@AllArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class OrderService {

    private static final int RETURN_WINDOW_DAYS = 7;

    private final OrderRepository orderRepository;
    private final ProductImageRepository productImageRepository;
    private final InventoryRepository inventoryRepository;
    private final OrderPlacementService orderPlacementService;

    public List<OrderDto> getOrdersByUserId(Long userId) {
        List<Order> orders = orderRepository.findByUserIdWithItemsOrderByPlacedAtDesc(userId);
        return orders.stream().map(this::toDto).toList();
    }

    public List<OrderDto> getOrdersByUserIdAndStatus(Long userId, OrderStatus status) {
        List<Order> orders = orderRepository.findByUserIdAndOrderStatusWithItems(userId, status);
        return orders.stream().map(this::toDto).toList();
    }

    public OrderDto getOrderByOrderCode(String orderCode) {
        log.info("Looking up order with orderCode: {}", orderCode);
        Optional<Order> orderOpt = orderRepository.findByOrderCodeWithItems(orderCode);
        log.info("Query result: {}", orderOpt.isPresent() ? "FOUND" : "NOT FOUND");
        Order order = orderOpt
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng: " + orderCode));
        return toDto(order);
    }

    @Transactional
    public void deletePendingOrder(String orderCode, Long userId) {
        Order order = orderRepository.findByOrderCodeWithItems(orderCode)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng: " + orderCode));

        validateOrderOwnership(order, userId);

        if (order.getOrderStatus() != OrderStatus.PENDING) {
            throw new BadRequestException("Chỉ có thể xóa đơn hàng đang chờ thanh toán.");
        }

        List<OrderItem> orderItems = order.getOrderItems();
        orderRepository.delete(order);
        orderPlacementService.restoreStock(orderItems);
        log.info("Deleted pending order {} for user {}", orderCode, userId);
    }

    @Transactional
    public OrderDto cancelOrder(String orderCode, Long userId) {
        Order order = orderRepository.findByOrderCodeWithItems(orderCode)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng: " + orderCode));

        validateOrderOwnership(order, userId);

        if (order.getOrderStatus() != OrderStatus.PENDING) {
            throw new BadRequestException("Chỉ có thể hủy đơn hàng đang ở trạng thái Chờ xác nhận.");
        }

        List<OrderItem> orderItems = order.getOrderItems();
        order.setOrderStatus(OrderStatus.CANCELED);
        order.setUpdatedAt(LocalDateTime.now());
        Order saved = orderRepository.save(order);

        orderPlacementService.restoreStock(orderItems);
        return toDto(saved);
    }

    @Transactional
    public OrderDto returnOrder(String orderCode, Long userId) {
        Order order = orderRepository.findByOrderCodeWithItems(orderCode)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng: " + orderCode));

        validateOrderOwnership(order, userId);

        if (order.getOrderStatus() != OrderStatus.DELIVERED) {
            throw new BadRequestException("Chỉ có thể trả đơn hàng đã giao thành công.");
        }

        LocalDateTime deadline = order.getUpdatedAt().plusDays(RETURN_WINDOW_DAYS);
        if (LocalDateTime.now().isAfter(deadline)) {
            throw new BadRequestException(
                    "Đã hết thời hạn 7 ngày kể từ khi nhận hàng để yêu cầu trả hàng.");
        }

        order.setOrderStatus(OrderStatus.RETURNED);
        order.setUpdatedAt(LocalDateTime.now());
        Order saved = orderRepository.save(order);
        return toDto(saved);
    }

    public Map<Long, Boolean> checkReorderStock(String orderCode) {
        Order order = orderRepository.findByOrderCodeWithItems(orderCode)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng: " + orderCode));

        return order.getOrderItems().stream().collect(Collectors.toMap(
                item -> item.getVariant() != null ? item.getVariant().getId() : 0L,
                item -> {
                    if (item.getVariant() == null) return false;
                    return inventoryRepository.findByVariantId(item.getVariant().getId())
                            .map(inv -> inv.getStockStatus() == StockStatus.IN_STOCK
                                    && inv.getQuantityOnHand() >= item.getQuantity())
                            .orElse(false);
                }
        ));
    }

    private void validateOrderOwnership(Order order, Long userId) {
        if (order.getUser() == null || !order.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Không tìm thấy đơn hàng: " + order.getOrderCode());
        }
    }

    private OrderDto toDto(Order order) {
        List<OrderItemDto> itemDtos = order.getOrderItems() == null
                ? List.of()
                : order.getOrderItems().stream()
                        .map(this::toItemDto)
                        .toList();

        return OrderDto.builder()
                .id(order.getId())
                .userId(order.getUser() != null ? order.getUser().getId() : null)
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
        List<ProductImage> images = productImageRepository.findByProductIdOrderBySortOrderAscIdAsc(productId);
        Optional<ProductImage> primary = images.stream()
                .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                .findFirst();
        return primary.map(ProductImage::getImageUrl)
                .orElse(images.stream().findFirst().map(ProductImage::getImageUrl).orElse(null));
    }
}
