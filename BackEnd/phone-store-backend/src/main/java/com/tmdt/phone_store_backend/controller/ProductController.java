package com.tmdt.phone_store_backend.controller;

import com.tmdt.phone_store_backend.dto.AdminProductDto;
import com.tmdt.phone_store_backend.service.ProductAdminService;
import java.util.List;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
@AllArgsConstructor
public class ProductController {

    private final ProductAdminService productAdminService;

    @GetMapping
    public ResponseEntity<List<AdminProductDto>> getPublicProducts() {
        return ResponseEntity.ok(productAdminService.getAllProducts());
    }

    @GetMapping("/{idOrSlug}")
    public ResponseEntity<AdminProductDto> getPublicProductDetail(@PathVariable String idOrSlug) {
        return ResponseEntity.ok(productAdminService.getPublicProductDetail(idOrSlug));
    }
}
