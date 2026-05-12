package com.tmdt.phone_store_backend.service;

import com.tmdt.phone_store_backend.domain.entity.Order;
import com.tmdt.phone_store_backend.domain.entity.OrderItem;
import com.tmdt.phone_store_backend.domain.entity.OrderStatusHistory;
import com.tmdt.phone_store_backend.domain.entity.User;
import com.tmdt.phone_store_backend.domain.enums.OrderStatus;
import com.tmdt.phone_store_backend.dto.AdminOrderDetailDto;
import com.tmdt.phone_store_backend.dto.AdminOrderDto;
import com.tmdt.phone_store_backend.dto.AdminOrderItemDto;
import com.tmdt.phone_store_backend.dto.AdminOrderStatusUpdateDto;
import com.tmdt.phone_store_backend.exception.ResourceNotFoundException;
import com.tmdt.phone_store_backend.repository.OrderItemRepository;
import com.tmdt.phone_store_backend.repository.OrderRepository;
import lombok.AllArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@AllArgsConstructor
public class AdminOrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private static final DateTimeFormatter DTF = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    public List<AdminOrderDto> getAllOrders() {
        return orderRepository.findAllOrderByCreatedAtDesc().stream()
                .map(this::toDto)
                .toList();
    }

    public AdminOrderDetailDto getOrderById(Long id) {
        Order order = orderRepository.findByIdWithUser(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));
        AdminOrderDetailDto dto = (AdminOrderDetailDto) toDto(order);
        dto.setItems(orderItemRepository.findByOrderId(id).stream()
                .map(this::toItemDto)
                .toList());
        return dto;
    }

    @Transactional
    public AdminOrderDto updateOrderStatus(Long id, AdminOrderStatusUpdateDto updateDto) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));

        OrderStatus oldStatus = order.getOrderStatus();
        OrderStatus newStatus;
        try {
            newStatus = OrderStatus.valueOf(updateDto.getOrderStatus());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ: " + updateDto.getOrderStatus());
        }

        order.setOrderStatus(newStatus);
        order.setUpdatedAt(java.time.LocalDateTime.now());
        orderRepository.save(order);

        // Ghi lịch sử trạng thái
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String adminEmail = auth != null ? auth.getName() : "system";

        OrderStatusHistory history = new OrderStatusHistory();
        history.setOrder(order);
        history.setOldStatus(oldStatus);
        history.setNewStatus(newStatus);
        history.setNote(updateDto.getNote());
        history.setChangedAt(java.time.LocalDateTime.now());

        return toDto(order);
    }

    private AdminOrderDto toDto(Order o) {
        AdminOrderDetailDto dto = new AdminOrderDetailDto();
        dto.setId(o.getId());
        dto.setOrderCode(o.getOrderCode());
        dto.setReceiverName(o.getReceiverName());
        dto.setReceiverPhone(o.getReceiverPhone());
        dto.setShippingAddress(o.getShippingAddressText());
        dto.setNote(o.getNote());
        dto.setSubtotalAmount(o.getSubtotalAmount().longValue());
        dto.setDiscountAmount(o.getDiscountAmount().longValue());
        dto.setShippingFee(o.getShippingFee().longValue());
        dto.setTotalAmount(o.getTotalAmount().longValue());
        dto.setPaymentMethod(o.getPaymentMethod().name());
        dto.setPaymentStatus(o.getPaymentStatus().name());
        dto.setOrderStatus(o.getOrderStatus().name());
        dto.setPlacedAt(o.getPlacedAt() != null ? o.getPlacedAt().format(DTF) : null);
        dto.setCreatedAt(o.getCreatedAt() != null ? o.getCreatedAt().format(DTF) : null);
        if (o.getUser() != null) {
            dto.setUserId(o.getUser().getId());
            dto.setUserEmail(o.getUser().getEmail());
            dto.setUserFullName(o.getUser().getFullName());
        }
        return dto;
    }

    private AdminOrderItemDto toItemDto(OrderItem item) {
        AdminOrderItemDto dto = new AdminOrderItemDto();
        dto.setId(item.getId());
        dto.setVariantId(item.getVariant() != null ? item.getVariant().getId() : null);
        dto.setProductName(item.getProductNameSnapshot());
        dto.setSku(item.getSkuSnapshot());
        dto.setColor(item.getColorSnapshot());
        dto.setRam(item.getRamSnapshot());
        dto.setStorage(item.getStorageSnapshot());
        dto.setUnitPrice(item.getUnitPrice().longValue());
        dto.setQuantity(item.getQuantity());
        dto.setLineTotal(item.getLineTotal().longValue());
        return dto;
    }
}
