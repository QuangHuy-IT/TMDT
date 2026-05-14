package com.tmdt.phone_store_backend.controller;

import com.tmdt.phone_store_backend.domain.entity.Banner;
import com.tmdt.phone_store_backend.dto.BannerDto;
import com.tmdt.phone_store_backend.repository.BannerRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/banners")
@AllArgsConstructor
public class BannerController {

    private final BannerRepository bannerRepository;

    @GetMapping("/home")
    public ResponseEntity<List<BannerDto>> getHomeBanners(
            @RequestParam(defaultValue = "home_hero") String position) {
        log.info("GET /api/banners/home?position={}", position);
        List<BannerDto> banners = bannerRepository.findActiveBannersByPosition(position, LocalDateTime.now())
                .stream().map(this::mapToDto).toList();
        return ResponseEntity.ok(banners);
    }

    @GetMapping("/grid")
    public ResponseEntity<List<BannerDto>> getGridBanners() {
        log.info("GET /api/banners/grid");
        List<BannerDto> banners = bannerRepository.findActiveBannersByPosition("home_grid", LocalDateTime.now())
                .stream().map(this::mapToDto).toList();
        return ResponseEntity.ok(banners);
    }

    @GetMapping("/sidebar")
    public ResponseEntity<List<BannerDto>> getSidebarBanners(
            @RequestParam(defaultValue = "sidebar") String position) {
        log.info("GET /api/banners/sidebar?position={}", position);
        List<BannerDto> banners = bannerRepository.findActiveBannersByPosition(position, LocalDateTime.now())
                .stream().map(this::mapToDto).toList();
        return ResponseEntity.ok(banners);
    }

    private BannerDto mapToDto(Banner b) {
        BannerDto dto = new BannerDto();
        dto.setId(b.getId());
        dto.setTitle(b.getTitle());
        dto.setSubtitle(b.getSubtitle());
        dto.setImageUrl(b.getImageUrl());
        dto.setLinkUrl(b.getLinkUrl());
        dto.setButtonText(b.getButtonText());
        dto.setPosition(b.getPosition());
        dto.setIsActive(b.getIsActive());
        dto.setSortOrder(b.getSortOrder());
        dto.setStartAt(b.getStartAt() != null ? b.getStartAt().toString() : null);
        dto.setEndAt(b.getEndAt() != null ? b.getEndAt().toString() : null);
        return dto;
    }
}
