package com.tmdt.phone_store_backend.controller;

import com.tmdt.phone_store_backend.dto.VoucherDto;
import com.tmdt.phone_store_backend.service.VoucherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/vouchers")
@RequiredArgsConstructor
public class VoucherController {

    private final VoucherService voucherService;

    @GetMapping
    public ResponseEntity<List<VoucherDto>> getAvailableVouchers() {
        log.info("GET /api/vouchers - Fetching available vouchers");
        return ResponseEntity.ok(voucherService.getAvailableVouchers());
    }

    @GetMapping("/validate")
    public ResponseEntity<?> validateVoucher(
            @RequestParam String code,
            @RequestParam(required = false) java.math.BigDecimal subtotal) {
        log.info("GET /api/vouchers/validate?code={}&subtotal={}", code, subtotal);
        try {
            VoucherDto voucher = voucherService.validateByCode(code, subtotal);
            return ResponseEntity.ok(voucher);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(java.util.Map.of("valid", false, "message", e.getMessage()));
        }
    }
}
