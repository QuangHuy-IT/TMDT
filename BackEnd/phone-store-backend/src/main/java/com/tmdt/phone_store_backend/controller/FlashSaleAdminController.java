package com.tmdt.phone_store_backend.controller;

import com.tmdt.phone_store_backend.dto.*;
import com.tmdt.phone_store_backend.service.FlashSaleService;
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
@RequestMapping("/api/admin/flash-sales")
@RequiredArgsConstructor
public class FlashSaleAdminController {

    private final FlashSaleService flashSaleService;

    // ==================== CAMPAIGN ====================

    @GetMapping("/campaigns")
    public ResponseEntity<List<FlashSaleCampaignDto>> getAllCampaigns() {
        return ResponseEntity.ok(flashSaleService.getAllCampaigns());
    }

    @PostMapping("/campaigns")
    public ResponseEntity<FlashSaleCampaignDto> createCampaign(
            @Valid @RequestBody CreateCampaignRequestDto request) {
        log.info("POST /admin/flash-sales/campaigns - Creating campaign: {}", request.getTitle());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(flashSaleService.createCampaign(request));
    }

    @PutMapping("/campaigns/{id}")
    public ResponseEntity<FlashSaleCampaignDto> updateCampaign(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCampaignRequestDto request) {
        log.info("PUT /admin/flash-sales/campaigns/{} - Updating campaign", id);
        return ResponseEntity.ok(flashSaleService.updateCampaign(id, request));
    }

    @DeleteMapping("/campaigns/{id}")
    public ResponseEntity<?> deleteCampaign(@PathVariable Long id) {
        log.info("DELETE /admin/flash-sales/campaigns/{} - Deleting campaign", id);
        flashSaleService.deleteCampaign(id);
        return ResponseEntity.ok(Map.of("message", "Xóa campaign thành công"));
    }

    @PatchMapping("/campaigns/{id}/activate")
    public ResponseEntity<?> activateCampaign(@PathVariable Long id) {
        log.info("PATCH /admin/flash-sales/campaigns/{}/activate", id);
        flashSaleService.activateCampaign(id);
        return ResponseEntity.ok(Map.of("message", "Kích hoạt campaign thành công"));
    }

    @PatchMapping("/campaigns/{id}/deactivate")
    public ResponseEntity<?> deactivateCampaign(@PathVariable Long id) {
        log.info("PATCH /admin/flash-sales/campaigns/{}/deactivate", id);
        flashSaleService.deactivateCampaign(id);
        return ResponseEntity.ok(Map.of("message", "Vô hiệu hóa campaign thành công"));
    }

    // ==================== SESSION ====================

    @GetMapping("/sessions/campaign/{campaignId}")
    public ResponseEntity<List<FlashSaleSessionDto>> getSessionsByCampaign(@PathVariable Long campaignId) {
        return ResponseEntity.ok(flashSaleService.getSessionsByCampaign(campaignId));
    }

    @PostMapping("/sessions")
    public ResponseEntity<FlashSaleSessionDto> createSession(
            @Valid @RequestBody CreateSessionRequestDto request) {
        log.info("POST /admin/flash-sales/sessions - Creating session for campaign: {}", request.getCampaignId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(flashSaleService.createSession(request));
    }

    @PutMapping("/sessions/{id}")
    public ResponseEntity<FlashSaleSessionDto> updateSession(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSessionRequestDto request) {
        log.info("PUT /admin/flash-sales/sessions/{} - Updating session", id);
        return ResponseEntity.ok(flashSaleService.updateSession(id, request));
    }

    @DeleteMapping("/sessions/{id}")
    public ResponseEntity<?> deleteSession(@PathVariable Long id) {
        log.info("DELETE /admin/flash-sales/sessions/{} - Deleting session", id);
        flashSaleService.deleteSession(id);
        return ResponseEntity.ok(Map.of("message", "Xóa session thành công"));
    }

    @PostMapping("/sessions/update-statuses")
    public ResponseEntity<?> updateSessionStatuses() {
        log.info("POST /admin/flash-sales/sessions/update-statuses");
        flashSaleService.updateSessionStatuses();
        return ResponseEntity.ok(Map.of("message", "Cập nhật trạng thái session thành công"));
    }

    // ==================== FLASH SALE PRODUCTS ====================

    @GetMapping("/products/session/{sessionId}")
    public ResponseEntity<List<FlashSaleProductDto>> getProductsBySession(@PathVariable Long sessionId) {
        return ResponseEntity.ok(flashSaleService.getProductsBySession(sessionId));
    }

    @PostMapping("/products")
    public ResponseEntity<FlashSaleProductDto> addProductToSession(
            @Valid @RequestBody AddFlashSaleProductRequestDto request) {
        log.info("POST /admin/flash-sales/products - Adding product to session: {}", request.getSessionId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(flashSaleService.addProductToSession(request));
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<FlashSaleProductDto> updateFlashSaleProduct(
            @PathVariable Long id,
            @RequestBody UpdateFlashSaleProductRequestDto request) {
        log.info("PUT /admin/flash-sales/products/{} - Updating flash sale product", id);
        return ResponseEntity.ok(flashSaleService.updateFlashSaleProduct(id, request));
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<?> removeProduct(@PathVariable Long id) {
        log.info("DELETE /admin/flash-sales/products/{} - Removing product from session", id);
        flashSaleService.removeProductFromSession(id);
        return ResponseEntity.ok(Map.of("message", "Xóa sản phẩm khỏi flash sale thành công"));
    }

    @PatchMapping("/products/{id}/quantity")
    public ResponseEntity<?> updateQuantity(
            @PathVariable Long id,
            @RequestBody Map<String, Integer> body) {
        Integer quantity = body.get("quantity");
        flashSaleService.updateProductQuantity(id, quantity);
        return ResponseEntity.ok(Map.of("message", "Cập nhật số lượng thành công"));
    }

    @PatchMapping("/products/{id}/sold-quantity")
    public ResponseEntity<?> incrementSoldQuantity(
            @PathVariable Long id,
            @RequestBody Map<String, Integer> body) {
        Integer quantity = body.get("quantity");
        flashSaleService.incrementSoldQuantity(id, quantity);
        return ResponseEntity.ok(Map.of("message", "Cập nhật số lượng đã bán thành công"));
    }

    @PatchMapping("/products/{id}/hide")
    public ResponseEntity<?> hideProduct(@PathVariable Long id) {
        log.info("PATCH /admin/flash-sales/products/{}/hide", id);
        flashSaleService.hideProduct(id);
        return ResponseEntity.ok(Map.of("message", "Ẩn sản phẩm thành công"));
    }

    @PatchMapping("/products/{id}/show")
    public ResponseEntity<?> showProduct(@PathVariable Long id) {
        log.info("PATCH /admin/flash-sales/products/{}/show", id);
        flashSaleService.showProduct(id);
        return ResponseEntity.ok(Map.of("message", "Hiện sản phẩm thành công"));
    }
}
