package com.tmdt.phone_store_backend.controller;

import com.tmdt.phone_store_backend.domain.entity.User;
import com.tmdt.phone_store_backend.domain.enums.OrderStatus;
import com.tmdt.phone_store_backend.dto.CreateOrderRequestDto;
import com.tmdt.phone_store_backend.dto.OrderDto;
import com.tmdt.phone_store_backend.exception.UnauthorizedException;
import com.tmdt.phone_store_backend.repository.UserRepository;
import com.tmdt.phone_store_backend.service.OrderPlacementService;
import com.tmdt.phone_store_backend.service.OrderService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@AllArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final OrderPlacementService orderPlacementService;
    private final UserRepository userRepository;

    /**
     * Get current authenticated user ID from JWT token.
     * Throws UnauthorizedException if user is not authenticated.
     */
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new UnauthorizedException("Vui lòng đăng nhập để thực hiện thao tác này");
        }
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Không tìm thấy người dùng"));
        return user.getId();
    }

    @PostMapping("/place")
    public ResponseEntity<OrderDto> placeOrder(@Valid @RequestBody CreateOrderRequestDto request) {
        // Override userId with authenticated user from JWT token
        Long currentUserId = getCurrentUserId();
        request.setUserId(currentUserId);
        OrderDto order = orderPlacementService.createOrder(request);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/my")
    public ResponseEntity<List<OrderDto>> getMyOrders() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(orderService.getOrdersByUserId(userId));
    }

    @GetMapping("/my/status/{status}")
    public ResponseEntity<List<OrderDto>> getMyOrdersByStatus(
            @PathVariable OrderStatus status) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(orderService.getOrdersByUserIdAndStatus(userId, status));
    }

    @GetMapping("/{orderCode}")
    public ResponseEntity<OrderDto> getOrderByCode(@PathVariable String orderCode) {
        Long userId = getCurrentUserId();
        OrderDto order = orderService.getOrderByOrderCode(orderCode);
        // Verify the order belongs to the current user
        verifyOrderOwnership(order, userId);
        return ResponseEntity.ok(order);
    }

    @PatchMapping("/{orderCode}/cancel")
    public ResponseEntity<OrderDto> cancelOrder(@PathVariable String orderCode) {
        Long userId = getCurrentUserId();
        OrderDto order = orderService.cancelOrder(orderCode, userId);
        return ResponseEntity.ok(order);
    }

    @DeleteMapping("/{orderCode}")
    public ResponseEntity<Void> deletePendingOrder(@PathVariable String orderCode) {
        Long userId = getCurrentUserId();
        orderService.deletePendingOrder(orderCode, userId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{orderCode}/return")
    public ResponseEntity<OrderDto> returnOrder(@PathVariable String orderCode) {
        Long userId = getCurrentUserId();
        OrderDto order = orderService.returnOrder(orderCode, userId);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/{orderCode}/reorder-stock")
    public ResponseEntity<Map<Long, Boolean>> checkReorderStock(@PathVariable String orderCode) {
        Long userId = getCurrentUserId();
        // First verify the order belongs to the current user
        OrderDto order = orderService.getOrderByOrderCode(orderCode);
        verifyOrderOwnership(order, userId);
        return ResponseEntity.ok(orderService.checkReorderStock(orderCode));
    }

    /**
     * Verify that the order belongs to the specified user.
     * Throws UnauthorizedException if user doesn't own the order.
     */
    private void verifyOrderOwnership(OrderDto order, Long userId) {
        if (order == null || order.getUserId() == null) {
            throw new UnauthorizedException("Không có quyền truy cập đơn hàng này");
        }
        if (!order.getUserId().equals(userId)) {
            throw new UnauthorizedException("Bạn không có quyền truy cập đơn hàng này");
        }
    }
}
