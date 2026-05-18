package com.tmdt.phone_store_backend.controller;

import com.tmdt.phone_store_backend.domain.entity.Brand;
import com.tmdt.phone_store_backend.domain.entity.ProductSeries;
import com.tmdt.phone_store_backend.dto.ProductSeriesDto;
import com.tmdt.phone_store_backend.repository.BrandRepository;
import com.tmdt.phone_store_backend.repository.ProductSeriesRepository;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/series")
@AllArgsConstructor
public class AdminSeriesController {

    private final ProductSeriesRepository seriesRepository;
    private final BrandRepository brandRepository;

    @GetMapping
    public ResponseEntity<List<ProductSeriesDto>> getAllSeries() {
        List<ProductSeriesDto> series = seriesRepository.findAll().stream()
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(series);
    }

    @GetMapping("/brand/{brandId}")
    public ResponseEntity<List<ProductSeriesDto>> getSeriesByBrand(@PathVariable Long brandId) {
        List<ProductSeriesDto> series = seriesRepository.findByBrandIdAndIsActiveTrueOrderBySortOrderAsc(brandId)
                .stream()
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(series);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductSeriesDto> getSeries(@PathVariable Long id) {
        ProductSeries s = seriesRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Series not found with id: " + id));
        return ResponseEntity.ok(toDto(s));
    }

    @PostMapping
    public ResponseEntity<ProductSeriesDto> createSeries(@Valid @RequestBody ProductSeriesDto dto) {
        Brand brand = brandRepository.findById(dto.getBrandId())
                .orElseThrow(() -> new RuntimeException("Brand not found with id: " + dto.getBrandId()));

        seriesRepository.findByNameIgnoreCaseAndBrandId(dto.getName().trim(), brand.getId())
                .ifPresent(existing -> {
                    throw new RuntimeException("Series '" + dto.getName() + "' đã tồn tại cho thương hiệu này");
                });

        LocalDateTime now = LocalDateTime.now();
        ProductSeries series = new ProductSeries();
        series.setName(dto.getName().trim());
        series.setSlug(toSlug(dto.getName().trim()));
        series.setDescription(dto.getDescription());
        series.setBrand(brand);
        series.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);
        series.setSortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : 0);
        series.setCreatedAt(now);
        series.setUpdatedAt(now);

        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(seriesRepository.save(series)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductSeriesDto> updateSeries(@PathVariable Long id,
                                                        @Valid @RequestBody ProductSeriesDto dto) {
        ProductSeries series = seriesRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Series not found with id: " + id));

        Brand brand = brandRepository.findById(dto.getBrandId())
                .orElseThrow(() -> new RuntimeException("Brand not found with id: " + dto.getBrandId()));

        series.setName(dto.getName().trim());
        series.setSlug(toSlug(dto.getName().trim()));
        series.setDescription(dto.getDescription());
        series.setBrand(brand);
        if (dto.getIsActive() != null) series.setIsActive(dto.getIsActive());
        if (dto.getSortOrder() != null) series.setSortOrder(dto.getSortOrder());
        series.setUpdatedAt(LocalDateTime.now());

        return ResponseEntity.ok(toDto(seriesRepository.save(series)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSeries(@PathVariable Long id) {
        if (!seriesRepository.existsById(id)) {
            throw new RuntimeException("Series not found with id: " + id);
        }
        seriesRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private ProductSeriesDto toDto(ProductSeries s) {
        ProductSeriesDto dto = new ProductSeriesDto();
        dto.setId(s.getId());
        dto.setName(s.getName());
        dto.setSlug(s.getSlug());
        dto.setDescription(s.getDescription());
        dto.setBrandId(s.getBrand().getId());
        dto.setBrandName(s.getBrand().getName());
        dto.setIsActive(s.getIsActive());
        dto.setSortOrder(s.getSortOrder());
        return dto;
    }

    private String toSlug(String input) {
        String slug = input.toLowerCase(Locale.ROOT)
                .trim()
                .replaceAll("[àáạảãâầấậẩẫăằắặẳẵ]", "a")
                .replaceAll("[èéẹẻẽêềếệểễ]", "e")
                .replaceAll("[ìíịỉĩ]", "i")
                .replaceAll("[òóọỏõôồốộổỗơờớợởỡ]", "o")
                .replaceAll("[ùúụủũưừứựửữ]", "u")
                .replaceAll("[ỳýỵỷỹ]", "y")
                .replaceAll("đ", "d")
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
        return slug;
    }
}
