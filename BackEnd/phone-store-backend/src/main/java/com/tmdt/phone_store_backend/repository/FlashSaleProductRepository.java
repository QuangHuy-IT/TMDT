package com.tmdt.phone_store_backend.repository;

import com.tmdt.phone_store_backend.domain.entity.FlashSaleProduct;
import com.tmdt.phone_store_backend.domain.entity.FlashSaleProduct.FlashSaleProductStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FlashSaleProductRepository extends JpaRepository<FlashSaleProduct, Long> {

    List<FlashSaleProduct> findBySessionIdOrderBySortOrderAsc(Long sessionId);

    @Query("SELECT fp FROM FlashSaleProduct fp WHERE fp.session.id = :sessionId AND fp.status = :status ORDER BY fp.sortOrder ASC")
    List<FlashSaleProduct> findBySessionIdAndStatus(@Param("sessionId") Long sessionId, @Param("status") FlashSaleProductStatus status);

    @Query("SELECT fp FROM FlashSaleProduct fp JOIN FETCH fp.variant v JOIN FETCH v.product p WHERE fp.session.id = :sessionId AND fp.status = 'ACTIVE' ORDER BY fp.sortOrder ASC")
    List<FlashSaleProduct> findActiveBySessionIdWithVariantAndProduct(@Param("sessionId") Long sessionId);

    @Query("SELECT fp FROM FlashSaleProduct fp JOIN FETCH fp.variant v JOIN FETCH v.product p WHERE fp.session.id = :sessionId AND fp.status = 'ACTIVE' ORDER BY fp.sortOrder ASC")
    List<FlashSaleProduct> findActiveBySessionIdWithFullDetails(@Param("sessionId") Long sessionId);

    Optional<FlashSaleProduct> findBySessionIdAndVariantId(Long sessionId, Long variantId);

    @Query("SELECT fp FROM FlashSaleProduct fp WHERE fp.variant.id = :variantId AND fp.session.status = 'RUNNING'")
    List<FlashSaleProduct> findActiveByVariantId(@Param("variantId") Long variantId);

    @Query("SELECT COUNT(fp) FROM FlashSaleProduct fp WHERE fp.session.id = :sessionId")
    long countBySessionId(@Param("sessionId") Long sessionId);
}
