package com.tmdt.phone_store_backend.service;

import com.tmdt.phone_store_backend.domain.entity.Product;
import com.tmdt.phone_store_backend.exception.ResourceNotFoundException;
import com.tmdt.phone_store_backend.repository.ProductRepository;
import com.tmdt.phone_store_backend.repository.ProductSeriesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SeriesService {

    private final ProductSeriesRepository seriesRepository;
    private final ProductRepository productRepository;

    @Transactional
    public void deleteSeries(Long id) {
        if (!seriesRepository.existsById(id)) {
            throw new ResourceNotFoundException("Series not found with id: " + id);
        }
        // Soft delete all products belonging to this series first
        List<Product> products = productRepository.findBySeriesIdAndDeletedAtIsNullOrderByCreatedAtDesc(id);
        LocalDateTime now = LocalDateTime.now();
        for (Product product : products) {
            product.setDeletedAt(now);
            productRepository.save(product);
        }
        seriesRepository.deleteById(id);
    }
}
