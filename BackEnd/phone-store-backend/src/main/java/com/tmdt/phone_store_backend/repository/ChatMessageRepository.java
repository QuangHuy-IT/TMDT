package com.tmdt.phone_store_backend.repository;

import com.tmdt.phone_store_backend.domain.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository truy vấn bảng chat_messages.
 */
@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    /**
     * Lấy tất cả tin nhắn của một phiên chat, sắp xếp theo thời gian.
     */
    List<ChatMessage> findBySessionSessionIdOrderByCreatedAtAsc(String sessionId);

    /**
     * Đếm số tin nhắn trong một phiên.
     */
    long countBySessionSessionId(String sessionId);

    /**
     * Lấy tin nhắn cuối cùng của một phiên.
     */
    @Query("SELECT m FROM ChatMessage m WHERE m.session.sessionId = :sessionId ORDER BY m.createdAt DESC LIMIT 1")
    ChatMessage findLastMessageBySessionId(@Param("sessionId") String sessionId);
}
