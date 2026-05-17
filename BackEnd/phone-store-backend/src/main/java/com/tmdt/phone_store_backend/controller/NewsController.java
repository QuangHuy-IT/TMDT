package com.tmdt.phone_store_backend.controller;

import com.tmdt.phone_store_backend.dto.NewsDto;
import com.tmdt.phone_store_backend.service.NewsService;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/news")
@AllArgsConstructor
public class NewsController {

    private final NewsService newsService;

    @GetMapping
    public ResponseEntity<Page<NewsDto>> getPublishedNews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("GET /api/news?page={}&size={}", page, size);
        return ResponseEntity.ok(newsService.getPublishedNews(page, size));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<Page<NewsDto>> getNewsByCategory(
            @PathVariable String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("GET /api/news/category/{}", category);
        return ResponseEntity.ok(newsService.getPublishedNewsByCategory(category, page, size));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<NewsDto>> searchNews(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("GET /api/news/search?keyword={}", keyword);
        return ResponseEntity.ok(newsService.searchNews(keyword, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NewsDto> getNewsById(@PathVariable Long id) {
        log.info("GET /api/news/{}", id);
        return ResponseEntity.ok(newsService.getNewsById(id));
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<NewsDto> getNewsBySlug(@PathVariable String slug) {
        log.info("GET /api/news/slug/{}", slug);
        return ResponseEntity.ok(newsService.getNewsBySlug(slug));
    }

    @GetMapping("/featured")
    public ResponseEntity<List<NewsDto>> getFeaturedNews() {
        log.info("GET /api/news/featured");
        return ResponseEntity.ok(newsService.getFeaturedNews());
    }

    @GetMapping("/recent")
    public ResponseEntity<List<NewsDto>> getRecentNews(
            @RequestParam(defaultValue = "6") int limit) {
        log.info("GET /api/news/recent?limit={}", limit);
        return ResponseEntity.ok(newsService.getRecentNews(limit));
    }
}
