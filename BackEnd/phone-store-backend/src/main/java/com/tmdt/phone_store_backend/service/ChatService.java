package com.tmdt.phone_store_backend.service;

import com.tmdt.phone_store_backend.dto.ChatRequestDto;
import com.tmdt.phone_store_backend.dto.ChatResponseDto;

/**
 * Service interface cho hệ thống chatbot.
 * Định nghĩa các method xử lý chat cốt lõi, dễ mở rộng sang AI sau này.
 */
public interface ChatService {

    /**
     * Xử lý một tin nhắn từ người dùng.
     *
     * Bước thực hiện:
     * 1. Kiểm tra/tạo phiên chat theo sessionId
     * 2. Lưu tin nhắn USER vào database
     * 3. Xử lý phản hồi (giai đoạn 1: rule-based, giai đoạn 2: AI)
     * 4. Lưu phản hồi BOT vào database
     * 5. Trả về ChatResponseDto chứa toàn bộ lịch sử phiên
     *
     * @param request chứa sessionId và message từ frontend
     * @param ipAddress địa chỉ IP của người dùng (optional)
     * @param userAgent User-Agent từ request header (optional)
     * @return ChatResponseDto chứa phản hồi bot và danh sách messages
     */
    ChatResponseDto processMessage(ChatRequestDto request, String ipAddress, String userAgent);

    /**
     * Lấy lịch sử chat của một phiên.
     *
     * @param sessionId UUID của phiên chat
     * @return ChatResponseDto chứa danh sách messages trong phiên
     */
    ChatResponseDto getChatHistory(String sessionId);

    /**
     * Tạo phản hồi từ bot (giai đoạn 1: rule-based).
     * Module này tách riêng để dễ thay thế bằng AI integration sau này.
     *
     * @param userMessage tin nhắn người dùng
     * @return phản hồi text từ bot
     */
    String generateBotResponse(String userMessage);
}
