package com.tmdt.phone_store_backend.controller;

import com.tmdt.phone_store_backend.dto.AdminInventoryAdjustRequestDto;
import com.tmdt.phone_store_backend.dto.AdminInventoryAdjustResponseDto;
import com.tmdt.phone_store_backend.dto.AdminProductDto;
import com.tmdt.phone_store_backend.service.InventoryAdminService;
import com.tmdt.phone_store_backend.service.ProductAdminService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/inventory")
@AllArgsConstructor
public class AdminInventoryController {

    private final ProductAdminService productAdminService;
    private final InventoryAdminService inventoryAdminService;

    @GetMapping("/products")
    public ResponseEntity<List<AdminProductDto>> getInventoryProducts() {
        return ResponseEntity.ok(productAdminService.getAllProducts());
    }

    @PutMapping("/{productId}/adjust")
    public ResponseEntity<AdminInventoryAdjustResponseDto> adjustInventory(
            @PathVariable Long productId,
            @Valid @RequestBody AdminInventoryAdjustRequestDto requestDto
    ) {
        return ResponseEntity.ok(inventoryAdminService.adjustInventory(productId, requestDto));
    }
}
