package com.tmdt.phone_store_backend.controller;

import com.tmdt.phone_store_backend.dto.BannerDto;
import com.tmdt.phone_store_backend.dto.BannerRequestDto;
import com.tmdt.phone_store_backend.service.BannerService;
import jakarta.validation.Valid;
import java.util.List;
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
@RequestMapping("/api/admin/banners")
@AllArgsConstructor
public class AdminBannerController {

    private final BannerService bannerService;

    @GetMapping
    public ResponseEntity<List<BannerDto>> getAllBanners() {
        return ResponseEntity.ok(bannerService.getAllBanners());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BannerDto> getBanner(@PathVariable Long id) {
        return ResponseEntity.ok(bannerService.getBannerById(id));
    }

    @PostMapping
    public ResponseEntity<BannerDto> createBanner(@Valid @RequestBody BannerRequestDto requestDto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bannerService.createBanner(requestDto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BannerDto> updateBanner(@PathVariable Long id,
                                                 @Valid @RequestBody BannerRequestDto requestDto) {
        return ResponseEntity.ok(bannerService.updateBanner(id, requestDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBanner(@PathVariable Long id) {
        bannerService.deleteBanner(id);
        return ResponseEntity.noContent().build();
    }
}
