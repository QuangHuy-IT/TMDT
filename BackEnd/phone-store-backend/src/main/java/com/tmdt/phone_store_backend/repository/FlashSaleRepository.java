package com.tmdt.phone_store_backend.repository;

import com.tmdt.phone_store_backend.domain.entity.FlashSale;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FlashSaleRepository extends JpaRepository<FlashSale, Long> {

    @Query("SELECT fs FROM FlashSale fs WHERE fs.isActive = TRUE "
            + "AND (fs.startAt IS NULL OR fs.startAt <= :now) "
            + "AND (fs.endAt IS NULL OR fs.endAt >= :now) "
            + "ORDER BY fs.startAt ASC")
    List<FlashSale> findActiveFlashSales(@Param("now") LocalDateTime now);
}
