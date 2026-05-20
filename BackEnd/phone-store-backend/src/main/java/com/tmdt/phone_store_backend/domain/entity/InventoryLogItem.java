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
@Table(name = "inventory_log_items")
public class InventoryLogItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_log_id", nullable = false)
    private InventoryLog inventoryLog;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "product_name", length = 255)
    private String productName;

    @Column(name = "variant_id", nullable = false)
    private Long variantId;

    @Column(name = "variant_name", length = 255)
    private String variantName;

    @Column(name = "sku", length = 50)
    private String sku;

    @Column(name = "before_stock", nullable = false)
    private Integer beforeStock;

    @Column(name = "after_stock", nullable = false)
    private Integer afterStock;

    @Column(nullable = false)
    private Integer delta;
}
