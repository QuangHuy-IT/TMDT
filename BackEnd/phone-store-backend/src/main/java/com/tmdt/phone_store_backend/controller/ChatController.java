package com.tmdt.phone_store_backend.controller;

import com.tmdt.phone_store_backend.dto.ChatRequestDto;
import com.tmdt.phone_store_backend.dto.ChatResponseDto;
import com.tmdt.phone_store_backend.service.ChatService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller xử lý các request liên quan đến chatbot.
 *
 * Endpoint:
 * - POST /api/chat       : Gửi tin nhắn và nhận phản hồi
 * - GET  /api/chat/{sessionId} : Lấy lịch sử chat của một phiên
 */
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "${app.frontend.url}")
public class ChatController {

    private final ChatService chatService;

    /**
     * Xử lý tin nhắn chat từ người dùng.
     *
     * @param request DTO chứa sessionId và message, đã được validate
     * @param httpRequest HttpServletRequest gốc để lấy IP và User-Agent
     * @return ChatResponseDto chứa phản hồi bot và danh sách messages
     */
    @PostMapping
    public ResponseEntity<ChatResponseDto> sendMessage(
            @Valid @RequestBody ChatRequestDto request,
            HttpServletRequest httpRequest) {

        // Lấy IP và User-Agent từ request header
        String ipAddress = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        log.info("POST /api/chat - sessionId: {}, ip: {}, ua: {}",
                request.getSessionId(), ipAddress, userAgent);

        ChatResponseDto response = chatService.processMessage(
                request, ipAddress, userAgent);

        return ResponseEntity.ok(response);
    }

    /**
     * Lấy lịch sử chat của một phiên.
     *
     * @param sessionId UUID của phiên chat
     * @return ChatResponseDto chứa toàn bộ messages trong phiên
     */
    @GetMapping("/{sessionId}")
    public ResponseEntity<ChatResponseDto> getChatHistory(
            @PathVariable String sessionId) {

        log.info("GET /api/chat/{}", sessionId);

        ChatResponseDto response = chatService.getChatHistory(sessionId);
        return ResponseEntity.ok(response);
    }

    /**
     * Trích xuất IP thật của client, xử lý proxy/load balancer.
     */
    private String getClientIp(HttpServletRequest request) {
        // Xem qua các header proxy trước
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // Lấy IP đầu tiên (client gốc), bỏ qua IP proxy
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }

        return request.getRemoteAddr();
    }
}
