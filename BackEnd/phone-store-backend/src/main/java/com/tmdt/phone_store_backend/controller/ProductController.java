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
            return ResponseEntity.ok(productAdminService.getPublicAllProducts());
        }
        return ResponseEntity.ok(productAdminService.getPublicProducts(brand, price, storage, sort, limit, series));
    }

    /**
     * Product detail via variant slug.
     * Example: /api/products/iphone-17-pro-max-8gb-256gb-black
     *
     * The variant slug uniquely identifies a product+storage+color combination.
     * Response includes: product info + selectedVariant + allVariants[]
     */
    @GetMapping("/{variantSlug}")
    public ResponseEntity<AdminProductDto> getPublicProductDetail(@PathVariable String variantSlug) {
        return ResponseEntity.ok(productAdminService.getPublicProductDetail(variantSlug));
    }

    @GetMapping("/featured")
    public ResponseEntity<List<AdminProductDto>> getFeaturedProducts(
            @RequestParam(defaultValue = "8") Integer limit) {
        return ResponseEntity.ok(productAdminService.getFeaturedProducts(limit));
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

    @GetMapping("/related/{baseName}")
    public ResponseEntity<List<AdminProductDto>> getRelatedProducts(@PathVariable String baseName) {
        return ResponseEntity.ok(productAdminService.getRelatedProducts(baseName));
    }
}
