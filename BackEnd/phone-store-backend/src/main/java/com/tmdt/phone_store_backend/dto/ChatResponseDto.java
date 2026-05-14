package com.tmdt.phone_store_backend.dto;

import com.tmdt.phone_store_backend.domain.entity.ChatMessage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO trả về cho frontend sau khi xử lý tin nhắn.
 * Chứa thông tin phiên chat và danh sách tin nhắn hiện tại.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatResponseDto {

    /**
     * UUID định danh phiên chat (giống sessionId từ request).
     */
    private String sessionId;

    /**
     * Tin nhắn phản hồi từ bot (string đơn giản, giai đoạn 1).
     */
    private String botMessage;

    /**
     * Danh sách tất cả tin nhắn trong phiên (tuổi thọ đầy đủ).
     * Frontend dùng field này để hiển thị lịch sử chat.
     */
    private List<ChatMessageDto> messages;

    /**
     * Thời điểm tin nhắn bot được gửi.
     */
    private LocalDateTime timestamp;

    /**
     * Số lượng tin nhắn trong phiên (sau khi thêm user + bot).
     */
    private Integer totalMessages;

    /**
     * Inner DTO cho từng tin nhắn riêng lẻ.
     * Gửi về frontend để hiển thị bubble chat.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChatMessageDto {

        private Long id;
        private String senderType;   // "USER" hoặc "BOT"
        private String content;
        private LocalDateTime createdAt;

        /**
         * Convert entity ChatMessage sang DTO.
         */
        public static ChatMessageDto fromEntity(ChatMessage message) {
            return ChatMessageDto.builder()
                    .id(message.getId())
                    .senderType(message.getSenderType().name())
                    .content(message.getContent())
                    .createdAt(message.getCreatedAt())
                    .build();
        }
    }
}
