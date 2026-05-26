package com.tmdt.phone_store_backend.repository;

import com.tmdt.phone_store_backend.domain.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByDeletedAtIsNullOrderByCreatedAtDesc();

    Optional<Product> findByIdAndDeletedAtIsNull(Long id);

    Optional<Product> findBySlugAndDeletedAtIsNull(String slug);

    List<Product> findByNameIgnoreCaseAndDeletedAtIsNull(String name);

    @Query("SELECT p FROM Product p WHERE p.deletedAt IS NULL AND (p.slug = :slug OR p.slug LIKE CONCAT(:slugPrefix, '%')) ORDER BY p.createdAt DESC")
    Optional<Product> findBySlugOrPrefix(@Param("slug") String slug, @Param("slugPrefix") String slugPrefix);

    @Query("SELECT DISTINCT p.name FROM Product p WHERE p.deletedAt IS NULL AND p.name IS NOT NULL AND LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY p.name")
    List<String> findDistinctNamesContaining(@Param("query") String query);

    List<Product> findBySeriesIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long seriesId);

    List<Product> findByBrandIdAndDeletedAtIsNull(Long brandId);

    @Modifying
    @Query("UPDATE Product p SET p.brand = NULL WHERE p.brand.id = :brandId AND p.deletedAt IS NULL")
    void clearBrandFromProducts(@Param("brandId") Long brandId);

    @Modifying
    @Query("UPDATE Product p SET p.series = NULL WHERE p.series.id = :seriesId AND p.deletedAt IS NULL")
    void clearSeriesFromProducts(@Param("seriesId") Long seriesId);
}
