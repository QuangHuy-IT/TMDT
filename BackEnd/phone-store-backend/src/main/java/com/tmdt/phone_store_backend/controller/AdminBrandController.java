package com.tmdt.phone_store_backend.controller;

import com.tmdt.phone_store_backend.domain.entity.Brand;
import com.tmdt.phone_store_backend.dto.BrandDto;
import com.tmdt.phone_store_backend.dto.BrandRequestDto;
import com.tmdt.phone_store_backend.exception.ResourceAlreadyExistsException;
import com.tmdt.phone_store_backend.exception.ResourceNotFoundException;
import com.tmdt.phone_store_backend.repository.BrandRepository;
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
@RequestMapping("/api/admin/brands")
@AllArgsConstructor
public class AdminBrandController {

    private final BrandRepository brandRepository;

    @GetMapping
    public ResponseEntity<List<BrandDto>> getAllBrands() {
        List<BrandDto> brands = brandRepository.findAll().stream()
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(brands);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BrandDto> getBrand(@PathVariable Long id) {
        Brand b = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found with id: " + id));
        return ResponseEntity.ok(toDto(b));
    }

    @PostMapping
    public ResponseEntity<BrandDto> createBrand(@Valid @RequestBody BrandRequestDto req) {
        if (brandRepository.findByNameIgnoreCase(req.getName()).isPresent()) {
            throw new ResourceAlreadyExistsException("Thương hiệu '" + req.getName() + "' đã tồn tại");
        }

        Brand b = new Brand();
        b.setName(req.getName().trim());
        b.setSlug(toSlug(req.getName().trim()));
        b.setLogoUrl(req.getLogoUrl());
        b.setIsActive(req.getIsActive() != null ? req.getIsActive() : true);
        b.setCreatedAt(LocalDateTime.now());
        b.setUpdatedAt(LocalDateTime.now());

        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(brandRepository.save(b)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BrandDto> updateBrand(@PathVariable Long id,
                                                @Valid @RequestBody BrandRequestDto req) {
        Brand b = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found with id: " + id));

        brandRepository.findByNameIgnoreCase(req.getName()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new ResourceAlreadyExistsException("Thương hiệu '" + req.getName() + "' đã tồn tại");
            }
        });

        b.setName(req.getName().trim());
        b.setSlug(toSlug(req.getName().trim()));
        if (req.getLogoUrl() != null) b.setLogoUrl(req.getLogoUrl());
        if (req.getIsActive() != null) b.setIsActive(req.getIsActive());
        b.setUpdatedAt(LocalDateTime.now());

        return ResponseEntity.ok(toDto(brandRepository.save(b)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBrand(@PathVariable Long id) {
        if (!brandRepository.existsById(id)) {
            throw new ResourceNotFoundException("Brand not found with id: " + id);
        }
        brandRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private BrandDto toDto(Brand b) {
        BrandDto dto = new BrandDto();
        dto.setId(b.getId());
        dto.setName(b.getName());
        dto.setSlug(b.getSlug());
        dto.setLogoUrl(b.getLogoUrl());
        dto.setIsActive(b.getIsActive());
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
