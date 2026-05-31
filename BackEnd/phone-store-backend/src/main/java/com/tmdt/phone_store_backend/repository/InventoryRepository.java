package com.tmdt.phone_store_backend.repository;

import com.tmdt.phone_store_backend.domain.entity.Inventory;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    Optional<Inventory> findByVariantId(Long variantId);

    @Query("SELECT i FROM Inventory i WHERE i.variant.id IN :variantIds")
    List<Inventory> findByVariantIdIn(@Param("variantIds") Collection<Long> variantIds);
}
