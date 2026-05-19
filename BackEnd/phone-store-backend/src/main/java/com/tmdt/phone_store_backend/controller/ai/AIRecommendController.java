package com.tmdt.phone_store_backend.controller.ai;

import com.tmdt.phone_store_backend.ai.memory.MemoryService;
import com.tmdt.phone_store_backend.ai.rag.ProductContextBuilder;
import com.tmdt.phone_store_backend.domain.entity.Product;
import com.tmdt.phone_store_backend.domain.entity.ProductVariant;
import com.tmdt.phone_store_backend.domain.enums.ProductStatus;
import com.tmdt.phone_store_backend.dto.ai.RecommendRequest;
import com.tmdt.phone_store_backend.dto.ai.RecommendResponse;
import com.tmdt.phone_store_backend.repository.ProductRepository;
import com.tmdt.phone_store_backend.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Controller cho AI Recommendation API.
 */
@RestController
@RequestMapping("/api/ai/recommend")
@RequiredArgsConstructor
@Slf4j
public class AIRecommendController {

    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final ProductContextBuilder productContextBuilder;
    private final MemoryService memoryService;

    /**
     * Lấy recommendations.
     * POST /api/ai/recommend
     */
    @PostMapping
    public ResponseEntity<RecommendResponse> recommend(@RequestBody RecommendRequest request) {
        log.info("Recommend request: sessionId={}, query={}", 
            request.getSessionId(), request.getQuery());
        
        try {
            // Get products based on query or preferences
            List<Product> products = findProducts(request);
            
            // Build recommendations
            List<RecommendResponse.RecommendationDto> recommendations = products.stream()
                .limit(request.getLimit())
                .map(p -> buildRecommendationDto(p, request.getSessionId()))
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(RecommendResponse.builder()
                .success(true)
                .recommendations(recommendations)
                .build());
                
        } catch (Exception e) {
            log.error("Recommend error", e);
            return ResponseEntity.internalServerError()
                .body(RecommendResponse.builder()
                    .success(false)
                    .build());
        }
    }

    private List<Product> findProducts(RecommendRequest request) {
        // Get memory preferences
        String memoryContext = "";
        if (request.getSessionId() != null) {
            memoryContext = memoryService.getMemoryContext(request.getSessionId());
        }
        
        // Extract criteria from query or use request params
        ProductContextBuilder.SearchCriteria criteria;
        if (request.getQuery() != null && !request.getQuery().isEmpty()) {
            criteria = productContextBuilder.extractSearchCriteria(request.getQuery());
        } else {
            criteria = new ProductContextBuilder.SearchCriteria();
            criteria.setBrand(request.getBrand());
            criteria.setMinBudget(request.getMinPrice() != null
                    ? request.getMinPrice().multiply(BigDecimal.valueOf(1_000_000))
                    : null);
            criteria.setMaxBudget(request.getMaxPrice() != null
                    ? request.getMaxPrice().multiply(BigDecimal.valueOf(1_000_000))
                    : null);
            criteria.setMinRam(request.getMinRam());
            if (request.getUsagePurpose() != null) {
                criteria.setFeatures(List.of(request.getUsagePurpose()));
            }
        }
        
        // Query products
        List<Product> products = productRepository.findByDeletedAtIsNullOrderByCreatedAtDesc();
        
        return products.stream()
            .filter(p -> p.getStatus() == ProductStatus.ACTIVE)
            .filter(p -> criteria.getBrand() == null || 
                (p.getBrand() != null && p.getBrand().getName().toLowerCase()
                    .contains(criteria.getBrand().toLowerCase())))
            .limit(20)
            .collect(Collectors.toList());
    }

    private RecommendResponse.RecommendationDto buildRecommendationDto(Product product, String sessionId) {
        List<ProductVariant> variants = variantRepository
            .findByProductIdAndDeletedAtIsNullOrderByPriceAsc(product.getId());
        
        BigDecimal minPrice = null;
        BigDecimal maxPrice = null;
        
        if (!variants.isEmpty()) {
            minPrice = variants.stream()
                .map(ProductVariant::getPrice)
                .min(Comparator.naturalOrder())
                .orElse(null);
            maxPrice = variants.stream()
                .map(ProductVariant::getPrice)
                .max(Comparator.naturalOrder())
                .orElse(null);
        }
        
        // Calculate score based on memory preferences
        double score = 0.8;
        String reason = "Sản phẩm phù hợp với yêu cầu của bạn";
        
        if (sessionId != null) {
            var memory = memoryService.getMemory(sessionId);
            
            if (!memory.getPreferredBrands().isEmpty() && 
                memory.getPreferredBrands().contains(product.getBrand() != null ? product.getBrand().getName() : "")) {
                score = 0.95;
                reason = "Phù hợp với thương hiệu bạn yêu thích";
            }
        }
        
        return RecommendResponse.RecommendationDto.builder()
            .productId(product.getId())
            .productName(product.getName())
            .brandName(product.getBrand() != null ? product.getBrand().getName() : "")
            .thumbnail(product.getThumbnailUrl())
            .minPrice(minPrice)
            .maxPrice(maxPrice)
            .salePercent(product.getSale() != null ? product.getSale().doubleValue() : null)
            .slug(product.getSlug())
            .score(score)
            .reason(reason)
            .build();
    }

    /**
     * Lấy sản phẩm tương tự.
     * GET /api/ai/recommend/similar/{productId}
     */
    @GetMapping("/similar/{productId}")
    public ResponseEntity<RecommendResponse> getSimilarProducts(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "5") int limit) {
        
        Product sourceProduct = productRepository.findById(productId).orElse(null);
        if (sourceProduct == null) {
            return ResponseEntity.badRequest()
                .body(RecommendResponse.builder().success(false).build());
        }
        
        // Find similar products by brand
        List<Product> similarProducts = productRepository
            .findByDeletedAtIsNullOrderByCreatedAtDesc().stream()
            .filter(p -> p.getStatus() == ProductStatus.ACTIVE)
            .filter(p -> p.getBrand() != null && 
                p.getBrand().getId().equals(sourceProduct.getBrand().getId()))
            .filter(p -> !p.getId().equals(productId))
            .limit(limit)
            .collect(Collectors.toList());
        
        List<RecommendResponse.RecommendationDto> recommendations = similarProducts.stream()
            .map(p -> buildRecommendationDto(p, null))
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(RecommendResponse.builder()
            .success(true)
            .recommendations(recommendations)
            .build());
    }
}
