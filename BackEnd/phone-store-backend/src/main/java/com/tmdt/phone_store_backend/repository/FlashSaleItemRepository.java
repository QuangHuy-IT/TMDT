package com.tmdt.phone_store_backend.repository;

import com.tmdt.phone_store_backend.domain.entity.FlashSale;
import com.tmdt.phone_store_backend.domain.entity.FlashSaleItem;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FlashSaleItemRepository extends JpaRepository<FlashSaleItem, Long> {

    List<FlashSaleItem> findByFlashSaleOrderByPromotionDesc(FlashSale flashSale);

    @Query("SELECT fsi FROM FlashSaleItem fsi " +
           "LEFT JOIN FETCH fsi.product p " +
           "LEFT JOIN FETCH p.brand " +
           "WHERE fsi.flashSale = :flashSale " +
           "AND fsi.quantity > 0 " +
           "AND p.deletedAt IS NULL " +
           "ORDER BY fsi.promotion DESC")
    List<FlashSaleItem> findActiveItemsByFlashSale(@Param("flashSale") FlashSale flashSale);
}
