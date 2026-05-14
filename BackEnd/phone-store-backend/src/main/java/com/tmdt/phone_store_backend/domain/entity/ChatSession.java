package com.tmdt.phone_store_backend.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity lưu trữ thông tin phiên chat giữa người dùng và chatbot.
 * Mỗi phiên chat được nhận diện bằng sessionId (UUID) và có thể chứa
 * nhiều tin nhắn (ChatMessage).
 */
@Entity
@Table(name = "chat_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChatSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * UUID định danh phiên chat, được tạo từ phía frontend và gửi kèm
     * mỗi request. Dùng UUID vì không tiết lộ thông tin thứ tự user.
     */
    @Column(name = "session_id", nullable = false, unique = true, length = 36)
    private String sessionId;

    /**
     * Địa chỉ IP của người dùng (nếu có), dùng để phân tích hoặc
     * chặn bot.
     */
    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    /**
     * User-Agent từ trình duyệt, hữu ích cho việc debug.
     */
    @Column(name = "user_agent", length = 500)
    private String userAgent;

    /**
     * Thời điểm phiên chat bắt đầu.
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Thời điểm tin nhắn cuối cùng được gửi trong phiên.
     */
    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;

    /**
     * Số lượng tin nhắn trong phiên (user + bot).
     */
    @Column(name = "message_count", nullable = false)
    private Integer messageCount = 0;

    /**
     * Danh sách tin nhắn thuộc phiên này.
     * Cascade ALL: khi xóa session thì xóa hết messages.
     * orphanRemoval: đảm bảo message không thể "mồ côi".
     */
    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<ChatMessage> messages = new ArrayList<>();

    /**
     * Callback lifecycle: tự động gán createdAt trước khi persist.
     */
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (messageCount == null) {
            messageCount = 0;
        }
    }

    /**
     * Tăng số đếm tin nhắn và cập nhật thời điểm tin nhắn cuối.
     */
    public void incrementMessageCount() {
        this.messageCount++;
        this.lastMessageAt = LocalDateTime.now();
    }
}
