package com.tmdt.phone_store_backend.controller;

import com.tmdt.phone_store_backend.dto.FlashSaleDto;
import com.tmdt.phone_store_backend.service.FlashSaleService;
import java.util.List;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/flash-sales")
@AllArgsConstructor
public class FlashSaleController {

    private final FlashSaleService flashSaleService;

    @GetMapping("/active")
    public ResponseEntity<FlashSaleDto> getActiveFlashSale() {
        FlashSaleDto flashSale = flashSaleService.getActiveFlashSale();
        if (flashSale == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(flashSale);
    }

    @GetMapping("/all-active")
    public ResponseEntity<List<FlashSaleDto>> getAllActiveFlashSales() {
        List<FlashSaleDto> sales = flashSaleService.getAllActiveFlashSales();
        if (sales.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(sales);
    }
}
