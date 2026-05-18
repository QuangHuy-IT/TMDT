package com.tmdt.phone_store_backend.repository;

import com.tmdt.phone_store_backend.domain.entity.News;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NewsRepository extends JpaRepository<News, Long> {

    Page<News> findByIsPublishedTrueOrderByPublishedAtDesc(Pageable pageable);

    Page<News> findByCategoryAndIsPublishedTrueOrderByPublishedAtDesc(
            News.NewsCategory category, Pageable pageable);

    List<News> findTop5ByIsPublishedTrueAndIsFeaturedTrueOrderByPublishedAtDesc();

    List<News> findTop6ByIsPublishedTrueAndIsFeaturedFalseOrderByPublishedAtDesc();

    @Query("select n from News n where n.isPublished = true and " +
           "(lower(n.title) like lower(concat('%', :keyword, '%')) or " +
           " lower(cast(n.excerpt as string)) like lower(concat('%', :keyword, '%')))")
    Page<News> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    long countByIsPublishedTrue();

    Optional<News> findBySlug(String slug);

    boolean existsBySlug(String slug);
}
