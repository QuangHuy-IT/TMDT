package com.tmdt.phone_store_backend.repository;

import com.tmdt.phone_store_backend.domain.entity.FlashSaleProduct;
import com.tmdt.phone_store_backend.domain.entity.FlashSaleProduct.FlashSaleProductStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface FlashSaleProductRepository extends JpaRepository<FlashSaleProduct, Long> {

    List<FlashSaleProduct> findBySessionIdOrderBySortOrderAsc(Long sessionId);

    @Query("SELECT fp FROM FlashSaleProduct fp JOIN FETCH fp.variant v JOIN FETCH v.product p WHERE fp.session.id = :sessionId ORDER BY fp.sortOrder ASC")
    List<FlashSaleProduct> findBySessionIdWithVariantAndProductOrderBySortOrderAsc(@Param("sessionId") Long sessionId);

    @Query("SELECT fp FROM FlashSaleProduct fp WHERE fp.session.id = :sessionId AND fp.status = :status ORDER BY fp.sortOrder ASC")
    List<FlashSaleProduct> findBySessionIdAndStatus(@Param("sessionId") Long sessionId, @Param("status") FlashSaleProductStatus status);

    @Query("SELECT fp FROM FlashSaleProduct fp JOIN FETCH fp.variant v JOIN FETCH v.product p WHERE fp.session.id = :sessionId AND fp.status = 'ACTIVE' ORDER BY fp.sortOrder ASC")
    List<FlashSaleProduct> findActiveBySessionIdWithVariantAndProduct(@Param("sessionId") Long sessionId);

    @Query("SELECT fp FROM FlashSaleProduct fp JOIN FETCH fp.variant v JOIN FETCH v.product p WHERE fp.session.id = :sessionId AND fp.status = 'ACTIVE' ORDER BY fp.sortOrder ASC")
    List<FlashSaleProduct> findActiveBySessionIdWithFullDetails(@Param("sessionId") Long sessionId);

    @Query("""
            SELECT fp FROM FlashSaleProduct fp
            JOIN FETCH fp.session s
            JOIN FETCH fp.variant v
            JOIN FETCH v.product p
            LEFT JOIN FETCH p.brand
            LEFT JOIN FETCH p.series
            WHERE s.campaign.id = :campaignId
              AND s.startAt <= :now
              AND s.endAt >= :now
              AND fp.status = 'ACTIVE'
            ORDER BY s.startAt ASC, fp.sortOrder ASC
            """)
    List<FlashSaleProduct> findRunningActiveByCampaignIdWithProductDetails(
            @Param("campaignId") Long campaignId,
            @Param("now") java.time.LocalDateTime now);

    Optional<FlashSaleProduct> findBySessionIdAndVariantId(Long sessionId, Long variantId);

    @Query("""
            SELECT fp FROM FlashSaleProduct fp
            JOIN fp.session s
            WHERE fp.variant.id = :variantId
              AND s.startAt <= :now
              AND s.endAt >= :now
            """)
    List<FlashSaleProduct> findActiveByVariantId(
            @Param("variantId") Long variantId,
            @Param("now") java.time.LocalDateTime now);

    @Query("""
            SELECT fp FROM FlashSaleProduct fp
            JOIN FETCH fp.variant v
            JOIN FETCH fp.session s
            WHERE v.id IN :variantIds
              AND s.startAt <= :now
              AND s.endAt >= :now
            """)
    List<FlashSaleProduct> findActiveByVariantIds(
            @Param("variantIds") Collection<Long> variantIds,
            @Param("now") java.time.LocalDateTime now);

    @Query("SELECT COUNT(fp) FROM FlashSaleProduct fp WHERE fp.session.id = :sessionId")
    long countBySessionId(@Param("sessionId") Long sessionId);

    @Query("SELECT COALESCE(MAX(fp.sortOrder), 0) FROM FlashSaleProduct fp WHERE fp.session.id = :sessionId")
    int findMaxSortOrderBySessionId(@Param("sessionId") Long sessionId);

    @Query("""
            SELECT fp FROM FlashSaleProduct fp
            JOIN FETCH fp.session s
            JOIN FETCH fp.variant v
            WHERE v.id = :variantId
              AND s.startAt <= :time
              AND s.endAt >= :time
            """)
    List<FlashSaleProduct> findActiveByVariantIdAndTime(
            @Param("variantId") Long variantId,
            @Param("time") java.time.LocalDateTime time);
}
