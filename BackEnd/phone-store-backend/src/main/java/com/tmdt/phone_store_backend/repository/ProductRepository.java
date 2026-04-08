package com.tmdt.phone_store_backend.repository;

import com.tmdt.phone_store_backend.domain.entity.Product;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByDeletedAtIsNullOrderByCreatedAtDesc();
}
