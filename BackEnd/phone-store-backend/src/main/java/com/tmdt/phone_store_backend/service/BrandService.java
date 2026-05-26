package com.tmdt.phone_store_backend.service;

import com.tmdt.phone_store_backend.domain.entity.Product;
import com.tmdt.phone_store_backend.domain.entity.ProductSeries;
import com.tmdt.phone_store_backend.exception.ResourceNotFoundException;
import com.tmdt.phone_store_backend.repository.BrandRepository;
import com.tmdt.phone_store_backend.repository.ProductRepository;
import com.tmdt.phone_store_backend.repository.ProductSeriesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BrandService {

    private final BrandRepository brandRepository;
    private final ProductRepository productRepository;
    private final ProductSeriesRepository productSeriesRepository;

    @Transactional
    public void deleteBrand(Long id) {
        if (!brandRepository.existsById(id)) {
            throw new ResourceNotFoundException("Brand not found with id: " + id);
        }
        LocalDateTime now = LocalDateTime.now();

        // 1. Soft delete all products belonging to this brand first
        List<Product> products = productRepository.findByBrandIdAndDeletedAtIsNull(id);
        for (Product product : products) {
            product.setDeletedAt(now);
            productRepository.save(product);
        }

        // 2. Delete all series belonging to this brand (they reference brand_id)
        List<ProductSeries> series = productSeriesRepository.findByBrandId(id);
        productSeriesRepository.deleteAll(series);

        // 3. Now safe to delete brand
        brandRepository.deleteById(id);
    }
}
