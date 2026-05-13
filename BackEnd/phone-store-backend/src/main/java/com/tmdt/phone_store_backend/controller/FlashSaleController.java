package com.tmdt.phone_store_backend.controller;

import com.tmdt.phone_store_backend.dto.FlashSaleCampaignDto;
import com.tmdt.phone_store_backend.dto.FlashSaleResponseDto;
import com.tmdt.phone_store_backend.dto.FlashSaleSessionDto;
import com.tmdt.phone_store_backend.service.FlashSaleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/flash-sales")
@RequiredArgsConstructor
public class FlashSaleController {

    private final FlashSaleService flashSaleService;

    @GetMapping
    public ResponseEntity<FlashSaleResponseDto> getFlashSaleData() {
        log.info("GET /api/flash-sales - Fetching public flash sale data");
        return ResponseEntity.ok(flashSaleService.getPublicFlashSaleData());
    }

    @GetMapping("/campaigns")
    public ResponseEntity<List<FlashSaleCampaignDto>> getActiveCampaigns() {
        log.info("GET /api/flash-sales/campaigns - Fetching active campaigns");
        return ResponseEntity.ok(flashSaleService.getActiveCampaigns());
    }

    @GetMapping("/sessions/{sessionId}")
    public ResponseEntity<FlashSaleSessionDto> getSessionById(@PathVariable Long sessionId) {
        log.info("GET /api/flash-sales/sessions/{} - Fetching session details", sessionId);
        return ResponseEntity.ok(flashSaleService.getSessionById(sessionId));
    }
}
