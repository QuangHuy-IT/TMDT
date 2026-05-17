package com.tmdt.phone_store_backend.controller;

import com.tmdt.phone_store_backend.dto.AdminProductDto;
import com.tmdt.phone_store_backend.dto.HomeBrandSectionDto;
import com.tmdt.phone_store_backend.service.ProductAdminService;
import java.util.List;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
@AllArgsConstructor
public class ProductController {

    private final ProductAdminService productAdminService;

    @GetMapping
    public ResponseEntity<List<AdminProductDto>> getPublicProducts(
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String price,
            @RequestParam(required = false) String storage,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String series) {
        if (brand == null && price == null && storage == null && sort == null && limit == null && series == null) {
            return ResponseEntity.ok(productAdminService.getAllProducts());
        }
        return ResponseEntity.ok(productAdminService.getPublicProducts(brand, price, storage, sort, limit, series));
    }

    @GetMapping("/related/{baseName}")
    public ResponseEntity<List<AdminProductDto>> getRelatedProducts(@PathVariable String baseName) {
        return ResponseEntity.ok(productAdminService.getRelatedProducts(baseName));
    }

    @GetMapping("/featured")
    public ResponseEntity<List<AdminProductDto>> getFeaturedProducts() {
        return ResponseEntity.ok(productAdminService.getFeaturedProducts());
    }

    @GetMapping("/featured/latest")
    public ResponseEntity<List<AdminProductDto>> getLatestFeaturedProducts(
            @RequestParam(defaultValue = "12") Integer limit) {
        return ResponseEntity.ok(productAdminService.getLatestProducts(limit));
    }

    @GetMapping("/flash-sale")
    public ResponseEntity<List<AdminProductDto>> getFlashSaleProducts(
            @RequestParam(defaultValue = "12") Integer limit) {
        return ResponseEntity.ok(productAdminService.getFlashSaleProducts(limit));
    }

    @GetMapping("/home/sections")
    public ResponseEntity<List<HomeBrandSectionDto>> getHomeBrandSections(
            @RequestParam(required = false) List<String> brands,
            @RequestParam(defaultValue = "8") Integer limitPerBrand) {
        return ResponseEntity.ok(productAdminService.getHomeBrandSections(brands, limitPerBrand));
    }

    @GetMapping("/{idOrSlug}")
    public ResponseEntity<AdminProductDto> getPublicProductDetail(@PathVariable String idOrSlug) {
        return ResponseEntity.ok(productAdminService.getPublicProductDetail(idOrSlug));
    }
}
