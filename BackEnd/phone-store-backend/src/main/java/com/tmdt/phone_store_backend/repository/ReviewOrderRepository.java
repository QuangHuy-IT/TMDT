package com.tmdt.phone_store_backend.repository;

import com.tmdt.phone_store_backend.domain.entity.Order;
import com.tmdt.phone_store_backend.domain.enums.OrderStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewOrderRepository extends JpaRepository<com.tmdt.phone_store_backend.domain.entity.Order, Long> {

    @Query("SELECT DISTINCT o FROM Order o JOIN o.orderItems oi WHERE o.user.id = :userId AND oi.variant IS NOT NULL AND oi.variant.product.id = :productId AND o.orderStatus = :status")
    List<Order> findDeliveredOrdersWithProduct(
            @Param("userId") Long userId,
            @Param("productId") Long productId,
            @Param("status") OrderStatus status
    );
}
