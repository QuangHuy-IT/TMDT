package com.tmdt.phone_store_backend.repository;

import com.tmdt.phone_store_backend.domain.entity.PendingOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PendingOrderRepository extends JpaRepository<PendingOrder, String> {

    @Modifying
    @Query("DELETE FROM PendingOrder p WHERE p.createdAt < :threshold")
    void deleteOlderThan(@Param("threshold") LocalDateTime threshold);
}
