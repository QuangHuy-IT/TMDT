package com.tmdt.phone_store_backend.repository;

import com.tmdt.phone_store_backend.domain.entity.Product;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByDeletedAtIsNullOrderByCreatedAtDesc();

    Optional<Product> findByIdAndDeletedAtIsNull(Long id);

    Optional<Product> findBySlugAndDeletedAtIsNull(String slug);

    @Query("SELECT p FROM Product p WHERE p.deletedAt IS NULL AND (p.slug = :slug OR p.slug LIKE CONCAT(:slugPrefix, '%')) ORDER BY p.createdAt DESC")
    Optional<Product> findBySlugOrPrefix(@Param("slug") String slug, @Param("slugPrefix") String slugPrefix);

    @Query("SELECT DISTINCT p.baseName FROM Product p WHERE p.deletedAt IS NULL AND p.baseName IS NOT NULL AND LOWER(p.baseName) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY p.baseName")
    List<String> findDistinctBaseNamesContaining(@Param("query") String query);

    @Query("SELECT p FROM Product p WHERE p.deletedAt IS NULL AND LOWER(p.baseName) = LOWER(:baseName) ORDER BY p.createdAt ASC")
    List<Product> findByBaseNameIgnoreCaseAndDeletedAtIsNull(@Param("baseName") String baseName);

    List<Product> findBySeriesIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long seriesId);
}
