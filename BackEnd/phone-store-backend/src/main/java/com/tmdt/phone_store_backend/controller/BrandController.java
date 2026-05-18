package com.tmdt.phone_store_backend.controller;

import com.tmdt.phone_store_backend.domain.entity.Brand;
import com.tmdt.phone_store_backend.domain.entity.ProductSeries;
import com.tmdt.phone_store_backend.dto.BrandDto;
import com.tmdt.phone_store_backend.dto.ProductSeriesDto;
import com.tmdt.phone_store_backend.repository.BrandRepository;
import com.tmdt.phone_store_backend.repository.ProductSeriesRepository;
import java.util.List;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/brands")
@AllArgsConstructor
public class BrandController {

    private final BrandRepository brandRepository;
    private final ProductSeriesRepository productSeriesRepository;

    @GetMapping
    public ResponseEntity<List<BrandDto>> getBrands() {
        List<BrandDto> brands = brandRepository.findAllByOrderBySortOrderAsc().stream()
                .filter(brand -> Boolean.TRUE.equals(brand.getIsActive()))
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(brands);
    }

    @GetMapping("/{slug}")
    public ResponseEntity<BrandDto> getBrandBySlug(@PathVariable String slug) {
        return brandRepository.findBySlugIgnoreCase(slug)
                .map(this::toDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{brandSlug}/series")
    public ResponseEntity<List<ProductSeriesDto>> getSeriesByBrandSlug(@PathVariable String brandSlug) {
        return brandRepository.findBySlugIgnoreCase(brandSlug)
                .map(brand -> {
                    List<ProductSeries> seriesList = productSeriesRepository
                            .findByBrandIdAndIsActiveTrueOrderBySortOrderAsc(brand.getId());
                    List<ProductSeriesDto> dtos = seriesList.stream()
                            .map(s -> {
                                ProductSeriesDto dto = new ProductSeriesDto();
                                dto.setId(s.getId());
                                dto.setName(s.getName());
                                dto.setSlug(s.getSlug());
                                dto.setDescription(s.getDescription());
                                dto.setBrandId(brand.getId());
                                dto.setBrandName(brand.getName());
                                dto.setIsActive(s.getIsActive());
                                dto.setSortOrder(s.getSortOrder());
                                return dto;
                            })
                            .toList();
                    return ResponseEntity.ok(dtos);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private BrandDto toDto(Brand brand) {
        BrandDto dto = new BrandDto();
        dto.setId(brand.getId());
        dto.setName(brand.getName());
        dto.setSlug(brand.getSlug());
        dto.setLogoUrl(brand.getLogoUrl());
        dto.setIsActive(brand.getIsActive());
        dto.setSortOrder(brand.getSortOrder());

        List<ProductSeries> series = productSeriesRepository
                .findByBrandIdAndIsActiveTrueOrderBySortOrderAsc(brand.getId());
        dto.setSeries(series.stream()
                .map(s -> {
                    BrandDto.SeriesInfo si = new BrandDto.SeriesInfo();
                    si.setId(s.getId());
                    si.setName(s.getName());
                    si.setSlug(s.getSlug());
                    si.setSortOrder(s.getSortOrder());
                    return si;
                })
                .toList());

        return dto;
    }
}
