package com.tmdt.phone_store_backend.repository;

import com.tmdt.phone_store_backend.domain.entity.ProductSeries;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductSeriesRepository extends JpaRepository<ProductSeries, Long> {

    Optional<ProductSeries> findByNameIgnoreCaseAndBrandId(String name, Long brandId);

    Optional<ProductSeries> findBySlugIgnoreCase(String slug);

    List<ProductSeries> findByBrandIdAndIsActiveTrueOrderBySortOrderAsc(Long brandId);

    List<ProductSeries> findByIsActiveTrueOrderBySortOrderAsc();
}
