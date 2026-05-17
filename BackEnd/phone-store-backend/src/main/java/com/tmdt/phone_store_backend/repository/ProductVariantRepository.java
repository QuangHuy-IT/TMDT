package com.tmdt.phone_store_backend.repository;

import com.tmdt.phone_store_backend.domain.entity.ProductVariant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {

    Optional<ProductVariant> findFirstByProductIdOrderByIdAsc(Long productId);

    List<ProductVariant> findByProductId(Long productId);

    Optional<ProductVariant> findBySlug(String slug);

    List<ProductVariant> findByProductIdAndDeletedAtIsNull(Long productId);
}
