package com.tmdt.phone_store_backend.controller.ai;

import com.tmdt.phone_store_backend.ai.compare.PhoneCompareEngine;
import com.tmdt.phone_store_backend.dto.ai.CompareRequest;
import com.tmdt.phone_store_backend.dto.ai.CompareResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller cho AI Compare API.
 */
@RestController
@RequestMapping("/api/ai/compare")
@RequiredArgsConstructor
@Slf4j
public class AICompareController {

    private final PhoneCompareEngine compareEngine;

    /**
     * So sánh sản phẩm theo tên.
     * POST /api/ai/compare
     */
    @PostMapping
    public ResponseEntity<CompareResponse> compare(@RequestBody CompareRequest request) {
        log.info("Compare request: productNames={}, productIds={}", 
            request.getProductNames(), request.getProductIds());
        
        try {
            PhoneCompareEngine.CompareResult result;
            
            if (request.getProductIds() != null && !request.getProductIds().isEmpty()) {
                result = compareEngine.compareByIds(request.getProductIds());
            } else if (request.getProductNames() != null && !request.getProductNames().isEmpty()) {
                result = compareEngine.compare(request.getProductNames());
            } else {
                return ResponseEntity.badRequest()
                    .body(CompareResponse.builder()
                        .success(false)
                        .errorMessage("Cần cung cấp productNames hoặc productIds")
                        .build());
            }
            
            if (!result.isSuccess()) {
                return ResponseEntity.badRequest()
                    .body(CompareResponse.builder()
                        .success(false)
                        .errorMessage(result.getErrorMessage())
                        .build());
            }
            
            return ResponseEntity.ok(CompareResponse.builder()
                .success(true)
                .summary(result.getSummary())
                .specTable(result.getSpecTable())
                .products(result.getProducts().stream()
                    .map(p -> CompareResponse.ProductDto.builder()
                        .productId(p.getProductId())
                        .productName(p.getProductName())
                        .brand(p.getBrand())
                        .thumbnail(p.getThumbnail())
                        .price(p.getPrice())
                        .variantCount(p.getVariantCount())
                        .specifications(p.getSpecifications())
                        .build())
                    .toList())
                .build());
                
        } catch (Exception e) {
            log.error("Compare error", e);
            return ResponseEntity.internalServerError()
                .body(CompareResponse.builder()
                    .success(false)
                    .errorMessage("Đã xảy ra lỗi khi so sánh sản phẩm: " + e.getMessage())
                    .build());
        }
    }
}
