package com.tmdt.phone_store_backend.controller;

import com.tmdt.phone_store_backend.dto.*;
import com.tmdt.phone_store_backend.service.ProductDiscountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/admin/discounts")
@RequiredArgsConstructor
public class AdminDiscountController {

    private final ProductDiscountService discountService;

    @GetMapping
    public ResponseEntity<List<ProductDiscountDto>> getAllDiscounts() {
        return ResponseEntity.ok(discountService.getAllDiscounts());
    }

    @GetMapping("/active")
    public ResponseEntity<List<ProductDiscountDto>> getActiveDiscounts() {
        return ResponseEntity.ok(discountService.getActiveDiscounts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDiscountDto> getDiscountById(@PathVariable Long id) {
        return ResponseEntity.ok(discountService.getDiscountById(id));
    }

    @PostMapping
    public ResponseEntity<ProductDiscountDto> createDiscount(
            @Valid @RequestBody CreateDiscountRequestDto request) {
        log.info("POST /admin/discounts - Creating discount for variant: {}", request.getVariantId());
        return ResponseEntity.ok(discountService.createDiscount(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductDiscountDto> updateDiscount(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDiscountRequestDto request) {
        log.info("PUT /admin/discounts/{} - Updating discount", id);
        return ResponseEntity.ok(discountService.updateDiscount(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDiscount(@PathVariable Long id) {
        log.info("DELETE /admin/discounts/{} - Deleting discount", id);
        discountService.deleteDiscount(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/toggle")
    public ResponseEntity<?> toggleDiscount(@PathVariable Long id) {
        log.info("POST /admin/discounts/{}/toggle - Toggling discount active state", id);
        discountService.toggleDiscount(id);
        return ResponseEntity.ok().build();
    }
}
