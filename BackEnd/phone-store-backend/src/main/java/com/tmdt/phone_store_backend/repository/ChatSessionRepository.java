package com.tmdt.phone_store_backend.repository;

import com.tmdt.phone_store_backend.domain.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository truy vấn bảng chat_sessions.
 * Spring Data JPA tự động cung cấp CRUD cơ bản.
 */
@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {

    /**
     * Tìm phiên chat theo sessionId (UUID).
     * Dùng để kiểm tra phiên đã tồn tại chưa trước khi tạo mới.
     */
    Optional<ChatSession> findBySessionId(String sessionId);

    /**
     * Kiểm tra phiên tồn tại hay chưa.
     */
    boolean existsBySessionId(String sessionId);

    /**
     * Lấy phiên chat kèm danh sách tin nhắn.
     * JOIN FETCH tránh N+1 query.
     */
    @Query("SELECT s FROM ChatSession s LEFT JOIN FETCH s.messages WHERE s.sessionId = :sessionId")
    Optional<ChatSession> findBySessionIdWithMessages(@Param("sessionId") String sessionId);

    /**
     * Tìm các phiên chat không hoạt động quá X ngày (dọn dẹp).
     */
    @Query("SELECT s FROM ChatSession s WHERE s.lastMessageAt < :cutoff")
    List<ChatSession> findInactiveSessions(@Param("cutoff") LocalDateTime cutoff);

    /**
     * Xóa phiên chat theo sessionId.
     */
    void deleteBySessionId(String sessionId);
}
