package com.tmdt.phone_store_backend.controller;

import com.tmdt.phone_store_backend.dto.BatchInventoryAdjustRequestDto;
import com.tmdt.phone_store_backend.dto.InventoryLogDto;
import com.tmdt.phone_store_backend.service.InventoryLogService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/inventory")
@AllArgsConstructor
public class AdminInventoryLogController {

    private final InventoryLogService inventoryLogService;

    @PostMapping("/adjust")
    public ResponseEntity<InventoryLogDto> batchAdjust(
            @Valid @RequestBody BatchInventoryAdjustRequestDto request
    ) {
        return ResponseEntity.ok(inventoryLogService.batchAdjust(request));
    }

    @GetMapping("/logs")
    public ResponseEntity<Page<InventoryLogDto>> getLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(inventoryLogService.getLogs(PageRequest.of(page, size)));
    }

    @GetMapping("/logs/{id}")
    public ResponseEntity<InventoryLogDto> getLog(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryLogService.getLog(id));
    }
}
