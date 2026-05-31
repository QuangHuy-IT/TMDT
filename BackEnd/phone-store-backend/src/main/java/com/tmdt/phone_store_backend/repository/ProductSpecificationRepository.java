package com.tmdt.phone_store_backend.repository;

import com.tmdt.phone_store_backend.domain.entity.ProductSpecification;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductSpecificationRepository
        extends JpaRepository<ProductSpecification, Long> {

    List<ProductSpecification> findByProductIdOrderBySortOrderAscIdAsc(Long productId);

    @Query("""
            SELECT ps FROM ProductSpecification ps
            JOIN FETCH ps.product p
            WHERE p.id IN :productIds
            ORDER BY ps.sortOrder ASC, ps.id ASC
            """)
    List<ProductSpecification> findByProductIdInOrderBySortOrderAscIdAsc(@Param("productIds") Collection<Long> productIds);

    void deleteByProductId(Long productId);
}
