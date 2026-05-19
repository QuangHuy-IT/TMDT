package com.tmdt.phone_store_backend.repository;

import com.tmdt.phone_store_backend.domain.entity.ProductDiscount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductDiscountRepository extends JpaRepository<ProductDiscount, Long> {

    Optional<ProductDiscount> findByVariantIdAndIsActiveTrue(Long variantId);

    @Query("SELECT pd FROM ProductDiscount pd JOIN FETCH pd.variant v JOIN FETCH v.product p WHERE pd.isActive = true AND pd.startAt <= :now AND pd.endAt >= :now")
    List<ProductDiscount> findAllActive(@Param("now") java.time.LocalDateTime now);

    @Query("SELECT pd FROM ProductDiscount pd JOIN FETCH pd.variant v JOIN FETCH v.product p WHERE pd.isActive = true ORDER BY pd.endAt ASC")
    List<ProductDiscount> findAllActiveOrderByEndAt();

    @Query("SELECT pd FROM ProductDiscount pd JOIN FETCH pd.variant v JOIN FETCH v.product p ORDER BY pd.createdAt DESC")
    List<ProductDiscount> findAllWithDetails();

    @Query("SELECT pd FROM ProductDiscount pd JOIN FETCH pd.variant v JOIN FETCH v.product p WHERE pd.isActive = true AND pd.startAt <= :now AND pd.endAt >= :now")
    List<ProductDiscount> findAllActiveNow(@Param("now") java.time.LocalDateTime now);

    void deleteByVariantId(Long variantId);
}
