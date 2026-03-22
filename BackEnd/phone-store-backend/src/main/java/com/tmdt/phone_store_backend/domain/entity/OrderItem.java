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
import java.math.BigDecimal;
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
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id")
    private ProductVariant variant;

    @Column(name = "product_name_snapshot", nullable = false, length = 255)
    private String productNameSnapshot;

    @Column(name = "sku_snapshot", nullable = false, length = 120)
    private String skuSnapshot;

    @Column(name = "color_snapshot", length = 80)
    private String colorSnapshot;

    @Column(name = "ram_snapshot", length = 40)
    private String ramSnapshot;

    @Column(name = "storage_snapshot", length = 40)
    private String storageSnapshot;

    @Column(name = "unit_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "line_total", nullable = false, precision = 15, scale = 2)
    private BigDecimal lineTotal;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
