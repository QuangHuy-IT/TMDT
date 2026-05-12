package com.tmdt.phone_store_backend.controller;

import com.tmdt.phone_store_backend.domain.entity.Banner;
import com.tmdt.phone_store_backend.dto.BannerDto;
import com.tmdt.phone_store_backend.repository.BannerRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/banners")
@AllArgsConstructor
public class BannerController {

    private final BannerRepository bannerRepository;

    @GetMapping("/home")
    public ResponseEntity<List<BannerDto>> getHomeBanners(
            @RequestParam(defaultValue = "home_hero") String position) {
        List<BannerDto> banners = bannerRepository.findActiveBannersByPosition(position, LocalDateTime.now())
                .stream()
                .map(banner -> {
                    BannerDto dto = new BannerDto();
                    dto.setId(banner.getId());
                    dto.setTitle(banner.getTitle());
                    dto.setSubtitle(banner.getSubtitle());
                    dto.setImageUrl(banner.getImageUrl());
                    dto.setLinkUrl(banner.getLinkUrl());
                    dto.setButtonText(banner.getButtonText());
                    dto.setPosition(banner.getPosition());
                    dto.setSortOrder(banner.getSortOrder());
                    return dto;
                })
                .toList();

        return ResponseEntity.ok(banners);
    }

    @GetMapping("/grid")
    public ResponseEntity<List<BannerDto>> getGridBanners() {
        List<BannerDto> banners = bannerRepository.findActiveBannersByPosition("home_grid", LocalDateTime.now())
                .stream()
                .map(banner -> {
                    BannerDto dto = new BannerDto();
                    dto.setId(banner.getId());
                    dto.setTitle(banner.getTitle());
                    dto.setSubtitle(banner.getSubtitle());
                    dto.setImageUrl(banner.getImageUrl());
                    dto.setLinkUrl(banner.getLinkUrl());
                    dto.setButtonText(banner.getButtonText());
                    dto.setPosition(banner.getPosition());
                    dto.setSortOrder(banner.getSortOrder());
                    return dto;
                })
                .toList();

        return ResponseEntity.ok(banners);
    }

    @GetMapping("/sidebar")
    public ResponseEntity<List<BannerDto>> getSidebarBanners(
            @RequestParam(defaultValue = "SIDEBAR") String position) {
        List<BannerDto> banners = bannerRepository.findActiveBannersByPosition(position, LocalDateTime.now())
                .stream().map(this::toDto).toList();
        return ResponseEntity.ok(banners);
    }

    private BannerDto toDto(Banner banner) {
        BannerDto dto = new BannerDto();
        dto.setId(banner.getId());
        dto.setTitle(banner.getTitle());
        dto.setSubtitle(banner.getSubtitle());
        dto.setImageUrl(banner.getImageUrl());
        dto.setLinkUrl(banner.getLinkUrl());
        dto.setButtonText(banner.getButtonText());
        dto.setPosition(banner.getPosition());
        dto.setSortOrder(banner.getSortOrder());
        return dto;
    }
}
