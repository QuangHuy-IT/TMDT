package com.tmdt.phone_store_backend.controller;

import com.tmdt.phone_store_backend.dto.BrandDto;
import com.tmdt.phone_store_backend.repository.BrandRepository;
import java.util.List;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/brands")
@AllArgsConstructor
public class BrandController {

    private final BrandRepository brandRepository;

    @GetMapping
    public ResponseEntity<List<BrandDto>> getBrands() {
        List<BrandDto> brands = brandRepository.findAllByOrderBySortOrderAsc().stream()
                .filter(brand -> Boolean.TRUE.equals(brand.getIsActive()))
                .map(brand -> {
                    BrandDto dto = new BrandDto();
                    dto.setId(brand.getId());
                    dto.setName(brand.getName());
                    dto.setSlug(brand.getSlug());
                    dto.setLogoUrl(brand.getLogoUrl());
                    return dto;
                })
                .toList();
        return ResponseEntity.ok(brands);
    }
}
