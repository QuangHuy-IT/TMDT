package com.tmdt.phone_store_backend.controller;

import com.tmdt.phone_store_backend.dto.AdminOrderDetailDto;
import com.tmdt.phone_store_backend.dto.AdminOrderDto;
import com.tmdt.phone_store_backend.dto.AdminOrderStatusUpdateDto;
import com.tmdt.phone_store_backend.service.AdminOrderService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/orders")
@AllArgsConstructor
public class AdminOrderController {

    private final AdminOrderService adminOrderService;

    @GetMapping
    public ResponseEntity<List<AdminOrderDto>> getAllOrders() {
        return ResponseEntity.ok(adminOrderService.getAllOrders());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminOrderDetailDto> getOrder(@PathVariable Long id) {
        return ResponseEntity.ok(adminOrderService.getOrderById(id));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<AdminOrderDto> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody AdminOrderStatusUpdateDto dto) {
        return ResponseEntity.ok(adminOrderService.updateOrderStatus(id, dto));
    }
}
