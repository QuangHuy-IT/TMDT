package com.tmdt.phone_store_backend.controller.ai;

import com.tmdt.phone_store_backend.ai.orchestrator.AIOrchestrator;
import com.tmdt.phone_store_backend.dto.ai.AIChatRequest;
import com.tmdt.phone_store_backend.dto.ai.AIChatResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller cho AI Chat API.
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Slf4j
public class AIChatController {

    private final AIOrchestrator aiOrchestrator;

    /**
     * Gửi tin nhắn chat.
     * POST /api/ai/chat
     */
    @PostMapping("/chat")
    public ResponseEntity<AIChatResponse> chat(
            @RequestBody AIChatRequest request,
            HttpServletRequest httpRequest) {
        
        log.info("AI Chat request: sessionId={}, message={}", 
            request.getSessionId(), request.getMessage());
        
        try {
            String ipAddress = getClientIp(httpRequest);
            String userAgent = httpRequest.getHeader("User-Agent");
            
            var chatResponse = aiOrchestrator.processMessage(
                request.getSessionId(),
                request.getMessage(),
                ipAddress,
                userAgent
            );

            return ResponseEntity.ok(AIChatResponse.builder()
                .success(true)
                .response(chatResponse.getBotMessage())
                .intent(chatResponse.getIntent())
                .sessionId(chatResponse.getSessionId())
                .products(chatResponse.getProducts())
                .build());
                
        } catch (Exception e) {
            log.error("Chat error", e);
            return ResponseEntity.internalServerError()
                .body(AIChatResponse.builder()
                    .success(false)
                    .response("Xin lỗi, đã xảy ra lỗi. Vui lòng thử lại.")
                    .errorMessage(e.getMessage())
                    .build());
        }
    }

    /**
     * Lấy IP của client.
     */
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
