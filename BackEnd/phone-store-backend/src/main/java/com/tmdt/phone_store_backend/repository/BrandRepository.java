package com.tmdt.phone_store_backend.repository;

import com.tmdt.phone_store_backend.domain.entity.Brand;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BrandRepository extends JpaRepository<Brand, Long> {

    Optional<Brand> findByNameIgnoreCase(String name);
}
