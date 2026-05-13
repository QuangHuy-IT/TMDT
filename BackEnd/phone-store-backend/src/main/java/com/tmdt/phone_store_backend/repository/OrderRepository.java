package com.tmdt.phone_store_backend.repository;

import com.tmdt.phone_store_backend.domain.entity.Order;
import com.tmdt.phone_store_backend.domain.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    @Query("SELECT o FROM Order o ORDER BY o.createdAt DESC")
    List<Order> findAllOrderByCreatedAtDesc();

    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.user WHERE o.id = :id")
    Optional<Order> findByIdWithUser(@Param("id") Long id);

    long countByOrderStatus(OrderStatus status);

    List<Order> findByUserIdOrderByPlacedAtDesc(Long userId);

    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.orderItems WHERE o.user.id = :userId ORDER BY o.placedAt DESC")
    List<Order> findByUserIdWithItemsOrderByPlacedAtDesc(@Param("userId") Long userId);

    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.orderItems WHERE o.user.id = :userId AND o.orderStatus = :status ORDER BY o.placedAt DESC")
    List<Order> findByUserIdAndOrderStatusWithItems(
            @Param("userId") Long userId,
            @Param("status") OrderStatus status);

    Optional<Order> findByOrderCode(String orderCode);

    @Query("SELECT o FROM Order o LEFT JOIN FETCH o.orderItems WHERE o.orderCode = :orderCode")
    Optional<Order> findByOrderCodeWithItems(@Param("orderCode") String orderCode);
}
