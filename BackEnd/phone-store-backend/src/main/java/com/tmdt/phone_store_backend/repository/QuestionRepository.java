package com.tmdt.phone_store_backend.repository;

import com.tmdt.phone_store_backend.domain.entity.Question;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {

    Page<Question> findByProductIdAndIsVisibleTrueOrderByCreatedAtDesc(Long productId, Pageable pageable);

    Page<Question> findByIsVisibleTrueOrderByCreatedAtDesc(Pageable pageable);

    long countByProductIdAndIsVisibleTrue(Long productId);

    @Query("SELECT q FROM Question q JOIN FETCH q.user JOIN FETCH q.product LEFT JOIN FETCH q.answers WHERE q.id = :id")
    java.util.Optional<Question> findByIdWithUserAndAnswers(@Param("id") Long id);

    Page<Question> findByIsVisibleFalseOrderByCreatedAtDesc(Pageable pageable);
}
