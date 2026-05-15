package com.tmdt.phone_store_backend.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.ArrayList;

/**
 * Entity FAQ - Lưu trữ câu hỏi thường gặp và câu trả lời.
 */
@Entity
@Table(name = "faqs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FAQ {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String question;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String answer;

    /**
     * Category của FAQ:
     * - BAO_HANH: Bảo hành
     * - GIAO_HANG: Giao hàng
     * - DOI_TRA: Đổi trả
     * - TRA_GOP: Trả góp
     * - CHUNG: Chung chung
     */
    @Column(nullable = false, length = 50)
    private String category;

    /**
     * Keywords để search (comma-separated)
     */
    @Column(length = 1000)
    private String keywords;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column
    @Builder.Default
    private Integer sortOrder = 0;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column
    private LocalDateTime updatedAt;

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Lấy keywords dưới dạng List.
     */
    @Transient
    public List<String> getKeywordsList() {
        if (keywords == null || keywords.isEmpty()) {
            return new ArrayList<>();
        }
        return Arrays.asList(keywords.split(","));
    }

    /**
     * Set keywords từ List.
     */
    public void setKeywordsList(List<String> keywordsList) {
        if (keywordsList == null || keywordsList.isEmpty()) {
            this.keywords = "";
        } else {
            this.keywords = String.join(",", keywordsList);
        }
    }
}
