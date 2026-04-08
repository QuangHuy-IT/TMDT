package com.tmdt.phone_store_backend.repository;

import com.tmdt.phone_store_backend.domain.entity.Inventory;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    Optional<Inventory> findByVariantId(Long variantId);
}
