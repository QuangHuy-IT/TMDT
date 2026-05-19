package com.tmdt.phone_store_backend.service;

import com.tmdt.phone_store_backend.domain.entity.ChatMessage;
import com.tmdt.phone_store_backend.domain.entity.ChatSession;
import com.tmdt.phone_store_backend.dto.ChatRequestDto;
import com.tmdt.phone_store_backend.dto.ChatResponseDto;
import com.tmdt.phone_store_backend.dto.ProductInfoDto;
import com.tmdt.phone_store_backend.repository.ChatMessageRepository;
import com.tmdt.phone_store_backend.repository.ChatSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Chat Service - kết nối AI (Gemini) với database sản phẩm.
 *
 * Flow:
 *  1. Nhận message từ user
 *  2. Lưu USER message vào DB
 *  3. Lấy 10 tin nhắn gần nhất (memory context)
 *  4. Query sản phẩm liên quan từ DB
 *  5. Build dynamic prompt cho Gemini
 *  6. Gọi Gemini → nhận phản hồi
 *  7. Lưu BOT message vào DB
 *  8. Trả về response
 *
 * Mở rộng sau này:
 *  - Thêm RAG pipeline (vector search)
 *  - Thêm FAQ knowledge base
 *  - Thêm Recommendation Engine
 *  - Streaming response
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class ChatServiceImpl implements ChatService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final GeminiService geminiService;
    private final ProductRecommendationService productRecommendationService;

    // ============================================================
    // SYSTEM PROMPT — quy tắc cho AI
    // ============================================================

    private static final String SYSTEM_PROMPT = """
            Bạn là AI tư vấn điện thoại cho website bán điện thoại TMDT.

            NGUYÊN TẮC:
            1. Chỉ trả lời dựa trên dữ liệu sản phẩm được cung cấp.
            2. Không tự bịa thông tin sản phẩm hoặc giá.
            3. Nếu sản phẩm có giảm giá, NHẮC RÕ % giảm giá.
            4. Trả lời NGẮN GỌN, THÂN THIỆN, bằng tiếng Việt.
            5. Mỗi sản phẩm chỉ liệt kê: tên, giá, thương hiệu, điểm nổi bật.
            6. Nếu không tìm thấy sản phẩm phù hợp, gợi ý người dùng liên hệ Zalo.
            7. Không trả lời những câu hỏi không liên quan đến điện thoại / cửa hàng.
            8. Điều hướng người dùng đến trang sản phẩm nếu phù hợp.
            9. Dùng emoji phù hợp để tin nhắn sinh động hơn.
            10. Nếu user hỏi về chính sách (bảo hành, đổi trả, giao hàng, thanh toán), trả lời đúng chính sách của cửa hàng.
            """;

    private static final int MAX_HISTORY_MESSAGES = 10;

    // ============================================================
    // XỬ LÝ TIN NHẮN CHÍNH
    // ============================================================

    @Override
    @Transactional
    public ChatResponseDto processMessage(ChatRequestDto request,
                                          String ipAddress,
                                          String userAgent) {
        log.info("Chat request - sessionId: {}, message: {}",
                request.getSessionId(), request.getMessage());

        // Bước 1: Lấy hoặc tạo phiên chat
        ChatSession session = getOrCreateSession(
                request.getSessionId(), ipAddress, userAgent);

        // Bước 2: Lưu tin nhắn USER vào database
        ChatMessage userMessage = ChatMessage.fromUser(session, request.getMessage());
        chatMessageRepository.save(userMessage);
        session.incrementMessageCount();
        chatSessionRepository.save(session);

        // Bước 3: Lấy lịch sử chat gần nhất (memory context)
        List<GeminiService.ChatHistoryItem> history = getRecentHistory(session.getSessionId());

        // Bước 4: Query sản phẩm liên quan từ DB
        List<ProductInfoDto> products = productRecommendationService
                .findProductsForPrompt(request.getMessage());

        // Bước 5: Nếu không có sản phẩm match, lấy tất cả active products
        if (products.isEmpty()) {
            products = productRecommendationService.getAllActiveProducts();
        }

        // Bước 6: Build dynamic prompt
        String prompt = buildPrompt(request.getMessage(), products);

        // Bước 7: Gọi Gemini AI
        String botResponse = geminiService.sendMessageWithHistory(SYSTEM_PROMPT, history, prompt);

        // Bước 8: Lưu BOT message vào database
        ChatMessage botMessage = ChatMessage.fromBot(session, botResponse);
        chatMessageRepository.save(botMessage);
        session.incrementMessageCount();
        chatSessionRepository.save(session);

        log.info("Chat response - sessionId: {}, response length: {}",
                request.getSessionId(), botResponse.length());

        return buildChatResponse(session, botResponse);
    }

    @Override
    public ChatResponseDto getChatHistory(String sessionId) {
        log.info("Get chat history - sessionId: {}", sessionId);

        ChatSession session = chatSessionRepository.findBySessionIdWithMessages(sessionId)
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy phiên chat: " + sessionId));

        return buildChatResponse(session, null);
    }

    @Override
    public String generateBotResponse(String userMessage) {
        // Phương thức cũ — giữ lại để interface tương thích ngược
        // Logic chính chuyển sang processMessage
        List<ProductInfoDto> products = productRecommendationService.findProductsForPrompt(userMessage);
        if (products.isEmpty()) {
            products = productRecommendationService.getAllActiveProducts();
        }
        String prompt = buildPrompt(userMessage, products);
        return geminiService.sendMessage(SYSTEM_PROMPT, prompt);
    }

    // ============================================================
    // HELPER: Lấy lịch sử chat gần nhất
    // ============================================================

    private List<GeminiService.ChatHistoryItem> getRecentHistory(String sessionId) {
        List<ChatMessage> messages = chatMessageRepository
                .findBySessionSessionIdOrderByCreatedAtAsc(sessionId);

        // Lấy 10 tin nhắn cuối cùng
        int fromIndex = Math.max(0, messages.size() - MAX_HISTORY_MESSAGES);
        List<ChatMessage> recent = messages.subList(fromIndex, messages.size());

        return recent.stream()
                .map(msg -> new GeminiService.ChatHistoryItem(
                        msg.getSenderType().name().toLowerCase(),
                        msg.getContent()))
                .collect(Collectors.toList());
    }

    // ============================================================
    // HELPER: Build Gemini prompt
    // ============================================================

    private String buildPrompt(String userMessage, List<ProductInfoDto> products) {
        StringBuilder sb = new StringBuilder();

        sb.append("Người dùng hỏi: \"").append(userMessage).append("\"\n\n");

        if (products != null && !products.isEmpty()) {
            sb.append("DANH SÁCH SẢN PHẨM CÓ SẴN:\n");
            for (int i = 0; i < products.size(); i++) {
                sb.append(products.get(i).toPromptLine()).append("\n");
            }
            sb.append("\nHãy tư vấn dựa trên danh sách trên. Nếu sản phẩm có giảm giá, nhắc rõ phần trăm giảm.");
        } else {
            sb.append("Không có sản phẩm nào trong danh sách. Trả lời thân thiện và gợi ý liên hệ cửa hàng.");
        }

        return sb.toString();
    }

    // ============================================================
    // HELPER: Tạo / lấy session
    // ============================================================

    private synchronized ChatSession getOrCreateSession(String sessionId,
                                                         String ipAddress,
                                                         String userAgent) {
        Optional<ChatSession> existing = chatSessionRepository.findBySessionId(sessionId);

        if (existing.isPresent()) {
            return existing.get();
        }

        ChatSession newSession = new ChatSession();
        newSession.setSessionId(sessionId);
        newSession.setIpAddress(ipAddress);
        newSession.setUserAgent(userAgent);
        newSession.setCreatedAt(LocalDateTime.now());
        newSession.setLastMessageAt(LocalDateTime.now());
        newSession.setMessageCount(0);

        log.info("Created new chat session: {}", sessionId);
        return chatSessionRepository.save(newSession);
    }

    // ============================================================
    // HELPER: Build response DTO
    // ============================================================

    private ChatResponseDto buildChatResponse(ChatSession session, String botMessage) {
        List<ChatMessage> messages = chatMessageRepository
                .findBySessionSessionIdOrderByCreatedAtAsc(session.getSessionId());

        List<ChatResponseDto.ChatMessageDto> messageDtos = messages.stream()
                .map(ChatResponseDto.ChatMessageDto::fromEntity)
                .toList();

        return ChatResponseDto.builder()
                .sessionId(session.getSessionId())
                .botMessage(botMessage)
                .messages(messageDtos)
                .timestamp(LocalDateTime.now())
                .totalMessages(session.getMessageCount())
                .build();
    }
}
