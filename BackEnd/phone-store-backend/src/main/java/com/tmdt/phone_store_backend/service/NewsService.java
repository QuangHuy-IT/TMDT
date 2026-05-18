package com.tmdt.phone_store_backend.service;

import com.tmdt.phone_store_backend.dto.NewsDto;
import com.tmdt.phone_store_backend.dto.NewsRequestDto;
import com.tmdt.phone_store_backend.exception.ResourceNotFoundException;
import com.tmdt.phone_store_backend.repository.NewsRepository;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@AllArgsConstructor
public class NewsService {

    private final NewsRepository newsRepository;
    private static final DateTimeFormatter DTF = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private NewsDto toDto(com.tmdt.phone_store_backend.domain.entity.News n) {
        NewsDto dto = new NewsDto();
        dto.setId(n.getId());
        dto.setTitle(n.getTitle());
        dto.setSlug(n.getSlug());
        dto.setExcerpt(n.getExcerpt());
        dto.setContent(n.getContent());
        dto.setImageUrl(n.getImageUrl());
        dto.setCategory(n.getCategory() != null ? n.getCategory().name() : null);
        dto.setCategoryLabel(n.getCategory() != null ? n.getCategory().getLabel() : null);
        dto.setBadge(n.getBadge());
        dto.setIsFeatured(n.getIsFeatured());
        dto.setIsPublished(n.getIsPublished());
        dto.setViewCount(n.getViewCount());
        dto.setAuthorName(n.getAuthorName());
        dto.setPublishedAt(n.getPublishedAt() != null ? n.getPublishedAt().toString() : null);
        dto.setCreatedAt(n.getCreatedAt() != null ? n.getCreatedAt().toString() : null);
        dto.setUpdatedAt(n.getUpdatedAt() != null ? n.getUpdatedAt().toString() : null);
        return dto;
    }

    // Tạo slug từ title
    private String generateSlug(String title) {
        if (title == null || title.isBlank()) return "";
        String slug = title.toLowerCase()
                .replaceAll("[àáạảãâầấậẩẫăằắặẳẫ]", "a")
                .replaceAll("[èéẹẻẽêềếệểễ]", "e")
                .replaceAll("[ìíịỉĩ]", "i")
                .replaceAll("[òóọỏõôồốộổỗơờớợởỡ]", "o")
                .replaceAll("[ùúụủũưừứựửữ]", "u")
                .replaceAll("[ỳýỵỷỹ]", "y")
                .replaceAll("đ", "d")
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .trim();
        return slug;
    }

    private com.tmdt.phone_store_backend.domain.entity.News toEntity(NewsRequestDto req) {
        com.tmdt.phone_store_backend.domain.entity.News n = new com.tmdt.phone_store_backend.domain.entity.News();
        n.setTitle(req.getTitle());
        n.setExcerpt(req.getExcerpt());
        n.setContent(req.getContent());
        n.setImageUrl(req.getImageUrl());
        if (req.getCategory() != null && !req.getCategory().isBlank()) {
            try {
                n.setCategory(com.tmdt.phone_store_backend.domain.entity.News.NewsCategory.valueOf(req.getCategory()));
            } catch (IllegalArgumentException ignored) {}
        }
        n.setBadge(req.getBadge());
        n.setIsFeatured(req.getIsFeatured() != null ? req.getIsFeatured() : false);
        n.setIsPublished(req.getIsPublished() != null ? req.getIsPublished() : true);
        n.setAuthorName(req.getAuthorName());
        if (req.getPublishedAt() != null && !req.getPublishedAt().isBlank()) {
            n.setPublishedAt(LocalDateTime.parse(req.getPublishedAt(), DTF));
        }
        return n;
    }

    // ── Public API ─────────────────────────────────────────────────────────────

    public Page<NewsDto> getPublishedNews(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return newsRepository.findByIsPublishedTrueOrderByPublishedAtDesc(pageable)
                .map(this::toDto);
    }

    public Page<NewsDto> getPublishedNewsByCategory(String category, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        com.tmdt.phone_store_backend.domain.entity.News.NewsCategory cat;
        try {
            cat = com.tmdt.phone_store_backend.domain.entity.News.NewsCategory.valueOf(category);
        } catch (IllegalArgumentException e) {
            return Page.empty();
        }
        return newsRepository.findByCategoryAndIsPublishedTrueOrderByPublishedAtDesc(cat, pageable)
                .map(this::toDto);
    }

    public Page<NewsDto> searchNews(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return newsRepository.searchByKeyword(keyword, pageable).map(this::toDto);
    }

    public NewsDto getNewsById(Long id) {
        com.tmdt.phone_store_backend.domain.entity.News n = newsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tin tức không tìm thấy với id: " + id));
        return toDto(n);
    }

    public NewsDto getNewsBySlug(String slug) {
        com.tmdt.phone_store_backend.domain.entity.News n = newsRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Tin tức không tìm thấy với slug: " + slug));
        // Tăng view count
        n.setViewCount(n.getViewCount() + 1);
        newsRepository.save(n);
        return toDto(n);
    }

    public List<NewsDto> getFeaturedNews() {
        return newsRepository.findTop5ByIsPublishedTrueAndIsFeaturedTrueOrderByPublishedAtDesc()
                .stream().map(this::toDto).toList();
    }

    public List<NewsDto> getRecentNews(int limit) {
        return newsRepository.findTop6ByIsPublishedTrueAndIsFeaturedFalseOrderByPublishedAtDesc()
                .stream().map(this::toDto).toList();
    }

    @Transactional
    public void incrementViewCount(Long id) {
        newsRepository.findById(id).ifPresent(n -> {
            n.setViewCount(n.getViewCount() + 1);
            newsRepository.save(n);
        });
    }

    // ── Admin API ─────────────────────────────────────────────────────────────

    public Page<NewsDto> getAllNews(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return newsRepository.findAll(pageable).map(this::toDto);
    }

    public NewsDto getNewsForAdmin(Long id) {
        com.tmdt.phone_store_backend.domain.entity.News n = newsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tin tức không tìm thấy với id: " + id));
        return toDto(n);
    }

    @Transactional
    public NewsDto createNews(NewsRequestDto req) {
        com.tmdt.phone_store_backend.domain.entity.News n = toEntity(req);
        n.setViewCount(0);
        n.setSlug(generateUniqueSlug(generateSlug(req.getTitle()), null));
        n.setCreatedAt(LocalDateTime.now());
        n.setUpdatedAt(LocalDateTime.now());
        if (n.getPublishedAt() == null && Boolean.TRUE.equals(n.getIsPublished())) {
            n.setPublishedAt(LocalDateTime.now());
        }
        return toDto(newsRepository.save(n));
    }

    // Tạo slug unique, tránh trùng lặp
    private String generateUniqueSlug(String baseSlug, Long excludeId) {
        String slug = baseSlug;
        int counter = 1;
        while (true) {
            // Kiểm tra slug đã tồn tại chưa
            boolean exists = newsRepository.findBySlug(slug).map(existing -> {
                // Nếu đang cập nhật và tìm thấy chính nó thì OK
                return excludeId != null && existing.getId().equals(excludeId);
            }).orElse(false);

            if (!exists && !newsRepository.existsBySlug(slug)) {
                break;
            }
            slug = baseSlug + "-" + counter;
            counter++;
        }
        return slug;
    }

    @Transactional
    public NewsDto updateNews(Long id, NewsRequestDto req) {
        com.tmdt.phone_store_backend.domain.entity.News n = newsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tin tức không tìm thấy với id: " + id));
        n.setTitle(req.getTitle());
        n.setExcerpt(req.getExcerpt());
        n.setContent(req.getContent());
        n.setImageUrl(req.getImageUrl());
        // Cập nhật slug nếu title thay đổi
        n.setSlug(generateUniqueSlug(generateSlug(req.getTitle()), id));
        if (req.getCategory() != null && !req.getCategory().isBlank()) {
            try {
                n.setCategory(com.tmdt.phone_store_backend.domain.entity.News.NewsCategory.valueOf(req.getCategory()));
            } catch (IllegalArgumentException ignored) {}
        }
        n.setBadge(req.getBadge());
        if (req.getIsFeatured() != null) n.setIsFeatured(req.getIsFeatured());
        if (req.getIsPublished() != null) n.setIsPublished(req.getIsPublished());
        if (req.getAuthorName() != null) n.setAuthorName(req.getAuthorName());
        if (req.getPublishedAt() != null && !req.getPublishedAt().isBlank()) {
            n.setPublishedAt(LocalDateTime.parse(req.getPublishedAt(), DTF));
        }
        n.setUpdatedAt(LocalDateTime.now());
        return toDto(newsRepository.save(n));
    }

    @Transactional
    public void deleteNews(Long id) {
        if (!newsRepository.existsById(id)) {
            throw new ResourceNotFoundException("Tin tức không tìm thấy với id: " + id);
        }
        newsRepository.deleteById(id);
    }

    @Transactional
    public NewsDto togglePublished(Long id) {
        com.tmdt.phone_store_backend.domain.entity.News n = newsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tin tức không tìm thấy với id: " + id));
        n.setIsPublished(!n.getIsPublished());
        n.setUpdatedAt(LocalDateTime.now());
        if (n.getIsPublished() && n.getPublishedAt() == null) {
            n.setPublishedAt(LocalDateTime.now());
        }
        return toDto(newsRepository.save(n));
    }
}
