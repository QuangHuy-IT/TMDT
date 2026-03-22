package com.tmdt.phone_store_backend.domain.entity;

import com.tmdt.phone_store_backend.domain.enums.ProductStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "products",
        uniqueConstraints = @UniqueConstraint(name = "uk_products_slug", columnNames = "slug")
)
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, length = 300)
    private String slug;

    @Column(name = "short_description", nullable = false, length = 500)
    private String shortDescription;

    @Column(name = "detail_description", nullable = false, columnDefinition = "TEXT")
    private String detailDescription;

    @Column(name = "warranty_months", nullable = false)
    private Integer warrantyMonths = 12;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProductStatus status = ProductStatus.DRAFT;

    @Column(name = "is_featured", nullable = false)
    private Boolean isFeatured = Boolean.FALSE;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
