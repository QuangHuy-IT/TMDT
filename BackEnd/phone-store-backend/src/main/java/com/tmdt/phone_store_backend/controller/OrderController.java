package com.tmdt.phone_store_backend.controller;

import com.tmdt.phone_store_backend.domain.enums.OrderStatus;
import com.tmdt.phone_store_backend.dto.CreateOrderRequestDto;
import com.tmdt.phone_store_backend.dto.OrderDto;
import com.tmdt.phone_store_backend.service.OrderPlacementService;
import com.tmdt.phone_store_backend.service.OrderService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@AllArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final OrderPlacementService orderPlacementService;

    @PostMapping("/place")
    public ResponseEntity<OrderDto> placeOrder(@Valid @RequestBody CreateOrderRequestDto request) {
        OrderDto order = orderPlacementService.createOrder(request);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<OrderDto>> getOrdersByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(orderService.getOrdersByUserId(userId));
    }

    @GetMapping("/user/{userId}/status/{status}")
    public ResponseEntity<List<OrderDto>> getOrdersByUserAndStatus(
            @PathVariable Long userId,
            @PathVariable OrderStatus status) {
        return ResponseEntity.ok(orderService.getOrdersByUserIdAndStatus(userId, status));
    }

    @GetMapping("/{orderCode}")
    public ResponseEntity<OrderDto> getOrderByCode(@PathVariable String orderCode) {
        return ResponseEntity.ok(orderService.getOrderByOrderCode(orderCode));
    }

    @PatchMapping("/{orderCode}/cancel")
    public ResponseEntity<OrderDto> cancelOrder(
            @PathVariable String orderCode,
            @RequestParam Long userId) {
        return ResponseEntity.ok(orderService.cancelOrder(orderCode, userId));
    }

    @DeleteMapping("/{orderCode}")
    public ResponseEntity<Void> deletePendingOrder(
            @PathVariable String orderCode,
            @RequestParam Long userId) {
        orderService.deletePendingOrder(orderCode, userId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{orderCode}/return")
    public ResponseEntity<OrderDto> returnOrder(
            @PathVariable String orderCode,
            @RequestParam Long userId) {
        return ResponseEntity.ok(orderService.returnOrder(orderCode, userId));
    }

    @GetMapping("/{orderCode}/reorder-stock")
    public ResponseEntity<Map<Long, Boolean>> checkReorderStock(@PathVariable String orderCode) {
        return ResponseEntity.ok(orderService.checkReorderStock(orderCode));
    }
}
