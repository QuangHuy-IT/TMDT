package com.tmdt.phone_store_backend.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
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
@Table(name = "product_specifications")
public class ProductSpecification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "spec_key", nullable = false, length = 120)
    private String specKey;

    @Column(name = "spec_value", nullable = false, length = 500)
    private String specValue;

    /**
     * Nhóm thông số (ví dụ: "Màn hình", "Camera", "CPU & RAM", "Pin & Sạc", "Kết nối", "Mạng & Di động",
     * "Hệ điều hành", "Thiết kế", "Bảo mật", "Khác").
     * Giúp hiển thị thông số kỹ thuật theo nhóm như trang CellphoneS.
     */
    @Column(name = "spec_category", length = 60)
    private String specCategory;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
