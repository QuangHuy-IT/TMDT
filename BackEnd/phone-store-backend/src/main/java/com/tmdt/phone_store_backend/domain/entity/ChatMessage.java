package com.tmdt.phone_store_backend.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Entity lưu trữ từng tin nhắn trong một phiên chat.
 * Mỗi tin nhắn thuộc về một ChatSession và có người gửi là USER hoặc BOT.
 */
@Entity
@Table(name = "chat_messages", indexes = {
    @Index(name = "idx_messages_session_id", columnList = "session_id"),
    @Index(name = "idx_messages_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Phiên chat chứa tin nhắn này.
     * FetchType.LAZY: chỉ load khi cần thiết.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private ChatSession session;

    /**
     * Loại người gửi: USER = tin nhắn từ khách hàng,
     * BOT = phản hồi từ server/AI.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "sender_type", nullable = false, length = 10)
    private SenderType senderType;

    /**
     * Nội dung văn bản tin nhắn.
     */
    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    /**
     * Thời điểm tin nhắn được gửi.
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Loại người gửi.
     */
    public enum SenderType {
        USER,
        BOT
    }

    /**
     * Callback lifecycle: tự động gán createdAt trước khi persist.
     */
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    /**
     * Factory method tạo nhanh tin nhắn từ người dùng.
     */
    public static ChatMessage fromUser(ChatSession session, String content) {
        ChatMessage msg = new ChatMessage();
        msg.setSession(session);
        msg.setSenderType(SenderType.USER);
        msg.setContent(content);
        return msg;
    }

    /**
     * Factory method tạo nhanh phản hồi từ bot.
     */
    public static ChatMessage fromBot(ChatSession session, String content) {
        ChatMessage msg = new ChatMessage();
        msg.setSession(session);
        msg.setSenderType(SenderType.BOT);
        msg.setContent(content);
        return msg;
    }
}
