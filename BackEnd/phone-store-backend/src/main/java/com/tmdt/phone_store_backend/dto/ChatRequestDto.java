package com.tmdt.phone_store_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO nhận request từ frontend khi người dùng gửi tin nhắn chat.
 *
 * Ví dụ request:
 * {
 *   "sessionId": "550e8400-e29b-41d4-a716-446655440000",
 *   "message": "Tôi muốn biết về chính sách bảo hành"
 * }
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChatRequestDto {

    /**
     * UUID định danh phiên chat, được frontend tạo và gửi kèm
     * mỗi request để server nhận diện phiên hội thoại.
     */
    @NotBlank(message = "Session ID không được để trống")
    @Size(min = 36, max = 36, message = "Session ID phải có 36 ký tự (UUID)")
    private String sessionId;

    /**
     * Nội dung tin nhắn người dùng gửi lên server.
     * Giới hạn 2000 ký tự để tránh spam.
     */
    @NotBlank(message = "Tin nhắn không được để trống")
    @Size(max = 2000, message = "Tin nhắn không được vượt quá 2000 ký tự")
    private String message;
}
