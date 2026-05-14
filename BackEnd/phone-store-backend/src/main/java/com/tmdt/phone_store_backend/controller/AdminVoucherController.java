package com.tmdt.phone_store_backend.controller;

import com.tmdt.phone_store_backend.dto.VoucherDto;
import com.tmdt.phone_store_backend.dto.VoucherRequestDto;
import com.tmdt.phone_store_backend.service.VoucherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/admin/vouchers")
@RequiredArgsConstructor
public class AdminVoucherController {

    private final VoucherService voucherService;

    @GetMapping
    public ResponseEntity<List<VoucherDto>> getAllVouchers() {
        return ResponseEntity.ok(voucherService.getAllVouchers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VoucherDto> getVoucher(@PathVariable Long id) {
        return ResponseEntity.ok(voucherService.getVoucherById(id));
    }

    @PostMapping
    public ResponseEntity<VoucherDto> createVoucher(@Valid @RequestBody VoucherRequestDto request) {
        log.info("POST /admin/vouchers - Creating voucher: {}", request.getCode());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(voucherService.createVoucher(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VoucherDto> updateVoucher(
            @PathVariable Long id,
            @Valid @RequestBody VoucherRequestDto request) {
        log.info("PUT /admin/vouchers/{} - Updating voucher", id);
        return ResponseEntity.ok(voucherService.updateVoucher(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVoucher(@PathVariable Long id) {
        log.info("DELETE /admin/vouchers/{} - Deleting voucher", id);
        voucherService.deleteVoucher(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<?> toggleVoucherActive(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body) {
        Boolean isActive = body.get("isActive");
        log.info("PATCH /admin/vouchers/{}/toggle - isActive: {}", id, isActive);
        voucherService.toggleVoucherActive(id, isActive != null && isActive);
        return ResponseEntity.ok(Map.of("message", "Cập nhật trạng thái thành công"));
    }
}
