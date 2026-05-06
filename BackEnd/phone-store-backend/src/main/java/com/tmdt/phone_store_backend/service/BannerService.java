package com.tmdt.phone_store_backend.service;

import com.tmdt.phone_store_backend.domain.entity.Banner;
import com.tmdt.phone_store_backend.dto.BannerDto;
import com.tmdt.phone_store_backend.dto.BannerRequestDto;
import com.tmdt.phone_store_backend.exception.ResourceAlreadyExistsException;
import com.tmdt.phone_store_backend.exception.ResourceNotFoundException;
import com.tmdt.phone_store_backend.repository.BannerRepository;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@AllArgsConstructor
public class BannerService {

    private final BannerRepository bannerRepository;
    private static final DateTimeFormatter DTF = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private BannerDto toDto(Banner b) {
        BannerDto dto = new BannerDto();
        dto.setId(b.getId());
        dto.setTitle(b.getTitle());
        dto.setImageUrl(b.getImageUrl());
        dto.setLinkUrl(b.getLinkUrl());
        dto.setPosition(b.getPosition());
        dto.setStartAt(b.getStartAt() != null ? b.getStartAt().toString() : null);
        dto.setEndAt(b.getEndAt() != null ? b.getEndAt().toString() : null);
        dto.setIsActive(b.getIsActive());
        dto.setSortOrder(b.getSortOrder());
        return dto;
    }

    public List<BannerDto> getAllBanners() {
        return bannerRepository.findAllByOrderBySortOrderAsc().stream()
                .map(this::toDto).toList();
    }

    public BannerDto getBannerById(Long id) {
        Banner b = bannerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Banner not found with id: " + id));
        return toDto(b);
    }

    @Transactional
    public BannerDto createBanner(BannerRequestDto req) {
        Banner b = new Banner();
        b.setTitle(req.getTitle());
        b.setImageUrl(req.getImageUrl());
        b.setLinkUrl(req.getLinkUrl());
        b.setPosition(req.getPosition() != null ? req.getPosition() : "home");
        b.setIsActive(req.getIsActive() != null ? req.getIsActive() : true);
        b.setSortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0);

        if (req.getStartAt() != null && !req.getStartAt().isBlank()) {
            b.setStartAt(LocalDateTime.parse(req.getStartAt(), DTF));
        }
        if (req.getEndAt() != null && !req.getEndAt().isBlank()) {
            b.setEndAt(LocalDateTime.parse(req.getEndAt(), DTF));
        }

        b.setCreatedAt(LocalDateTime.now());
        b.setUpdatedAt(LocalDateTime.now());

        return toDto(bannerRepository.save(b));
    }

    @Transactional
    public BannerDto updateBanner(Long id, BannerRequestDto req) {
        Banner b = bannerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Banner not found with id: " + id));

        b.setTitle(req.getTitle());
        b.setImageUrl(req.getImageUrl());
        b.setLinkUrl(req.getLinkUrl());
        if (req.getPosition() != null) b.setPosition(req.getPosition());
        if (req.getIsActive() != null) b.setIsActive(req.getIsActive());
        if (req.getSortOrder() != null) b.setSortOrder(req.getSortOrder());

        if (req.getStartAt() != null && !req.getStartAt().isBlank()) {
            b.setStartAt(LocalDateTime.parse(req.getStartAt(), DTF));
        }
        if (req.getEndAt() != null && !req.getEndAt().isBlank()) {
            b.setEndAt(LocalDateTime.parse(req.getEndAt(), DTF));
        }

        b.setUpdatedAt(LocalDateTime.now());

        return toDto(bannerRepository.save(b));
    }

    @Transactional
    public void deleteBanner(Long id) {
        if (!bannerRepository.existsById(id)) {
            throw new ResourceNotFoundException("Banner not found with id: " + id);
        }
        bannerRepository.deleteById(id);
    }
}
