package com.tmdt.phone_store_backend.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "news")
public class News {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "slug", length = 200, unique = true)
    private String slug;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String excerpt;

    @Lob
    @Column(name = "content", columnDefinition = "LONGTEXT")
    private String content;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", length = 50)
    private NewsCategory category;

    @Column(name = "badge", length = 30)
    private String badge;

    @Column(name = "is_featured")
    private Boolean isFeatured = false;

    @Column(name = "is_published")
    private Boolean isPublished = true;

    @Column(name = "view_count")
    private Integer viewCount = 0;

    @Column(name = "author_name", length = 100)
    private String authorName;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum NewsCategory {
        CONG_NGHE("Tin tức công nghệ"),
        KHUYEN_MAI("Khuyến mãi"),
        DANH_GIA("Đánh giá sản phẩm"),
        HUONG_DAN("Hướng dẫn"),
        SU_KIEN("Sự kiện"),
        TIN_KHAC("Tin tức chung");

        private final String label;

        NewsCategory(String label) {
            this.label = label;
        }

        public String getLabel() {
            return label;
        }
    }
}
