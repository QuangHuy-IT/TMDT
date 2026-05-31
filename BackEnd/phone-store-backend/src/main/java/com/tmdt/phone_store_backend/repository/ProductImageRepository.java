package com.tmdt.phone_store_backend.repository;

import com.tmdt.phone_store_backend.domain.entity.ProductImage;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {

    List<ProductImage> findByProductIdOrderBySortOrderAscIdAsc(Long productId);

    @Query("""
            SELECT pi FROM ProductImage pi
            JOIN FETCH pi.product p
            LEFT JOIN FETCH pi.variant v
            WHERE p.id IN :productIds
            ORDER BY pi.sortOrder ASC, pi.id ASC
            """)
    List<ProductImage> findByProductIdInOrderBySortOrderAscIdAsc(@Param("productIds") Collection<Long> productIds);

    List<ProductImage> findByVariantIdOrderBySortOrderAscIdAsc(Long variantId);

    void deleteByProductId(Long productId);
}
