package com.tmdt.phone_store_backend.controller;

import com.tmdt.phone_store_backend.dto.NewsDto;
import com.tmdt.phone_store_backend.dto.NewsRequestDto;
import com.tmdt.phone_store_backend.service.NewsService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/admin/news")
@AllArgsConstructor
public class AdminNewsController {

    private final NewsService newsService;

    @GetMapping
    public ResponseEntity<Page<NewsDto>> getAllNews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("GET /api/admin/news?page={}&size={}", page, size);
        return ResponseEntity.ok(newsService.getAllNews(page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NewsDto> getNews(@PathVariable Long id) {
        log.info("GET /api/admin/news/{}", id);
        return ResponseEntity.ok(newsService.getNewsForAdmin(id));
    }

    @PostMapping
    public ResponseEntity<NewsDto> createNews(@Valid @RequestBody NewsRequestDto requestDto) {
        log.info("POST /api/admin/news");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(newsService.createNews(requestDto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<NewsDto> updateNews(@PathVariable Long id,
                                               @Valid @RequestBody NewsRequestDto requestDto) {
        log.info("PUT /api/admin/news/{}", id);
        return ResponseEntity.ok(newsService.updateNews(id, requestDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNews(@PathVariable Long id) {
        log.info("DELETE /api/admin/news/{}", id);
        newsService.deleteNews(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/toggle-published")
    public ResponseEntity<NewsDto> togglePublished(@PathVariable Long id) {
        log.info("PATCH /api/admin/news/{}/toggle-published", id);
        return ResponseEntity.ok(newsService.togglePublished(id));
    }
}
