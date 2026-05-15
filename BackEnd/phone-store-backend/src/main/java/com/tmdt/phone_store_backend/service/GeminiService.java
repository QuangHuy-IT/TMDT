package com.tmdt.phone_store_backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tmdt.phone_store_backend.dto.GeminiRequestDto;
import com.tmdt.phone_store_backend.dto.GeminiResponseDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Service gọi Google Gemini API.
 *
 * API endpoint:
 *   POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
 *
 * Sử dụng RestTemplate thuần — không cần thêm dependency cho WebClient.
 * Response JSON được parse bằng Jackson (đã có sẵn trong spring-boot-starter-web).
 *
 * Mở rộng sau này:
 * - Đổi model sang gemini-1.5-pro hoặc gemini-2.0-flash qua config
 * - Thêm streaming response
 * - Thêm retry logic với Spring Retry
 * - Cache frequent prompts
 */
@Service
@Slf4j
public class GeminiService {

    private static final String GROQ_BASE_URL =
        "https://api.groq.com/openai/v1/chat/completions";

    @Value("${app.groq.model}")
    private String model;

    @Value("${app.groq.api-key}")
    private String apiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;


    public GeminiService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Gửi prompt đơn lẻ tới Gemini.
     *
     * @param systemInstruction System prompt (quy tắc cho AI)
     * @param userMessage      Tin nhắn người dùng
     * @return Text phản hồi từ AI, hoặc fallback message nếu lỗi.
     */
    public String sendMessage(String systemInstruction, String userMessage) {
        return sendMessageWithHistory(systemInstruction, Collections.emptyList(), userMessage);
    }

    /**
     * Gửi prompt kèm lịch sử chat tới Gemini để AI nhớ context.
     *
     * @param systemInstruction System prompt
     * @param history           Danh sách tin nhắn gần đây [{role, text}]
     * @param currentMessage    Tin nhắn hiện tại
     * @return Text phản hồi từ AI
     */
    public String sendMessageWithHistory(
            String systemInstruction,
            java.util.List<ChatHistoryItem> history,
            String currentMessage) {

        String url = buildUrl();

        GeminiRequestDto request = buildRequest(systemInstruction, history, currentMessage);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);  // ← Khác Gemini (không dùng query param)

            HttpEntity<GeminiRequestDto> entity = new HttpEntity<>(request, headers);

            log.debug("Calling Gemini API: {} with model {}", url, model);

            ResponseEntity<GeminiResponseDto> response = restTemplate.postForEntity(
                    url, entity, GeminiResponseDto.class);

            GeminiResponseDto body = response.getBody();
            if (body == null) {
                log.error("Gemini response body is null");
                return getFallbackResponse();
            }

            if (body.isBlocked()) {
                log.warn("Gemini response was blocked by safety filter");
                return "Tin nhắn của bạn có thể vi phạm chính sách an toàn của AI. Vui lòng diễn đạt lại câu hỏi nhé!";
            }

            String text = body.extractText();
            log.info("Gemini response received ({} chars)", text.length());
            return text;

        } catch (Exception e) {
            log.error("Failed to call Gemini API: {}", e.getMessage(), e);
            return getFallbackResponse();
        }
    }

    // ---- Private helpers ----

    private String buildUrl() {
        return GROQ_BASE_URL;  // API key nằm trong header, không phải URL
    }
    private GeminiRequestDto buildRequest(
        String systemInstruction,
        List<ChatHistoryItem> history,
        String currentMessage) {

        var messages = new ArrayList<GeminiRequestDto.Message>();

        // System instruction → chuyển thành system message
        messages.add(GeminiRequestDto.Message.builder()
                .role("system")
                .content(systemInstruction)
                .build());

        // History
        for (ChatHistoryItem item : history) {
            messages.add(GeminiRequestDto.Message.builder()
                    .role(item.role())
                    .content(item.text())
                    .build());
        }

        // Current message
        messages.add(GeminiRequestDto.Message.builder()
                .role("user")
                .content(currentMessage)
                .build());

        return GeminiRequestDto.builder()
                .model(model)
                .messages(messages)
                .temperature(0.8)
                .maxTokens(1024)
                .build();
    }

    private String getFallbackResponse() {
        return "Xin lỗi bạn, hiện tại mình chưa thể kết nối với AI. Vui lòng thử lại sau vài giây. "
                + "Hoặc liên hệ Zalo để được hỗ trợ trực tiếp nhé!";
    }

    /**
     * Record đơn giản cho lịch sử chat.
     */
    public record ChatHistoryItem(String role, String text) {}
}
