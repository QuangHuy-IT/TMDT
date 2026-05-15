package com.tmdt.phone_store_backend.dto;

import com.tmdt.phone_store_backend.domain.entity.ChatMessage;
import com.tmdt.phone_store_backend.dto.ai.ChatProductDto;
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

    private String sessionId;

    private String botMessage;

    private String intent;

    /**
     * Danh sách sản phẩm đi kèm response (nếu intent liên quan đến sản phẩm).
     * Dùng để frontend hiển thị product cards có hình ảnh.
     */
    @Builder.Default
    private List<ChatProductDto> products = null;

    private List<ChatMessageDto> messages;

    private LocalDateTime timestamp;

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
