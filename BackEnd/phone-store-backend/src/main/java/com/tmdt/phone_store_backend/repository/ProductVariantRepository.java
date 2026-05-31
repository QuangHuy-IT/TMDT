package com.tmdt.phone_store_backend.repository;

import com.tmdt.phone_store_backend.domain.entity.ProductVariant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {

    Optional<ProductVariant> findFirstByProductIdOrderByIdAsc(Long productId);

    List<ProductVariant> findByProductId(Long productId);

    Optional<ProductVariant> findBySlug(String slug);

    Optional<ProductVariant> findBySlugAndIdNot(String slug, Long id);

    List<ProductVariant> findByProductIdAndDeletedAtIsNull(Long productId);

    @Query("""
            SELECT v FROM ProductVariant v
            JOIN FETCH v.product p
            WHERE p.id IN :productIds
              AND v.deletedAt IS NULL
            ORDER BY p.createdAt DESC, v.id ASC
            """)
    List<ProductVariant> findByProductIdInAndDeletedAtIsNull(@Param("productIds") List<Long> productIds);

    List<ProductVariant> findByProductIdAndDeletedAtIsNullOrderByPriceAsc(Long productId);

    @Query("""
            SELECT v FROM ProductVariant v
            JOIN FETCH v.product p
            LEFT JOIN FETCH p.brand
            LEFT JOIN FETCH p.series
            WHERE v.deletedAt IS NULL
              AND p.deletedAt IS NULL
            """)
    List<ProductVariant> findActiveWithProductForSlugRepair();
}
