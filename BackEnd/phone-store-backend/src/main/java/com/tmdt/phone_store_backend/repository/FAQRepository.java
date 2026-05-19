package com.tmdt.phone_store_backend.repository;

import com.tmdt.phone_store_backend.domain.entity.FAQ;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository cho FAQ entity.
 */
@Repository
public interface FAQRepository extends JpaRepository<FAQ, Long> {
    
    /**
     * Lấy tất cả FAQ đang active.
     */
    List<FAQ> findByIsActiveTrueOrderBySortOrderAsc();
    
    /**
     * Lấy FAQ theo category.
     */
    List<FAQ> findByCategoryAndIsActiveTrueOrderBySortOrderAsc(String category);
    
    /**
     * Tìm FAQ theo keyword.
     */
    @Query("SELECT f FROM FAQ f WHERE f.isActive = true AND " +
           "(LOWER(f.question) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(f.answer) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(f.keywords) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<FAQ> searchByKeyword(String keyword);
    
    /**
     * Lấy tất cả categories có trong FAQ.
     */
    @Query("SELECT DISTINCT f.category FROM FAQ f WHERE f.isActive = true")
    List<String> findAllCategories();
}
