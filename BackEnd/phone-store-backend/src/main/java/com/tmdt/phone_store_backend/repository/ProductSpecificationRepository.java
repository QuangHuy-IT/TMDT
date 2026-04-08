package com.tmdt.phone_store_backend.repository;

import com.tmdt.phone_store_backend.domain.entity.ProductSpecification;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductSpecificationRepository
        extends JpaRepository<ProductSpecification, Long> {

    List<ProductSpecification> findByProductIdOrderBySortOrderAscIdAsc(Long productId);

    void deleteByProductId(Long productId);
}
