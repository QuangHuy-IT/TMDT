package com.tmdt.phone_store_backend.ai.orchestrator;

import com.tmdt.phone_store_backend.ai.chat.PromptBuilder;
import com.tmdt.phone_store_backend.ai.compare.PhoneCompareEngine;
import com.tmdt.phone_store_backend.ai.faq.FAQService;
import com.tmdt.phone_store_backend.ai.intent.IntentDetector;
import com.tmdt.phone_store_backend.ai.intent.IntentResult;
import com.tmdt.phone_store_backend.ai.intent.IntentType;
import com.tmdt.phone_store_backend.ai.memory.MemoryService;
import com.tmdt.phone_store_backend.ai.rag.FAQContextBuilder;
import com.tmdt.phone_store_backend.ai.rag.ProductContextBuilder;
import com.tmdt.phone_store_backend.domain.entity.ChatMessage;
import com.tmdt.phone_store_backend.domain.entity.ChatSession;
import com.tmdt.phone_store_backend.domain.entity.Product;
import com.tmdt.phone_store_backend.domain.entity.ProductVariant;
import com.tmdt.phone_store_backend.dto.ai.ChatProductDto;
import com.tmdt.phone_store_backend.dto.ChatResponseDto;
import com.tmdt.phone_store_backend.repository.ChatMessageRepository;
import com.tmdt.phone_store_backend.repository.ChatSessionRepository;
import com.tmdt.phone_store_backend.repository.ProductVariantRepository;
import com.tmdt.phone_store_backend.service.GeminiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * AI Orchestrator - Điều phối tất cả các AI services.
 * 
 * Flow xử lý:
 * 1. Detect Intent từ câu hỏi
 * 2. Lấy context (products, FAQ, memory)
 * 3. Build prompt phù hợp
 * 4. Gọi Gemini
 * 5. Cập nhật memory
 * 6. Trả về response
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AIOrchestrator {

    private final IntentDetector intentDetector;
    private final GeminiService geminiService;
    private final PromptBuilder promptBuilder;
    private final ProductContextBuilder productContextBuilder;
    private final FAQContextBuilder faqContextBuilder;
    private final MemoryService memoryService;
    private final FAQService faqService;
    private final PhoneCompareEngine compareEngine;
    private final ChatSessionRepository sessionRepository;
    private final ChatMessageRepository messageRepository;
    private final ProductVariantRepository variantRepository;

    /**
     * Products hiện tại cho response — được set trong mỗi xử lý intent.
     */
    private List<ChatProductDto> currentProducts = new ArrayList<>();

    /**
     * Xử lý tin nhắn từ người dùng.
     */
    @Transactional
    public ChatResponseDto processMessage(String sessionId, String userMessage, 
                                        String ipAddress, String userAgent) {
        long startTime = System.currentTimeMillis();

        log.info("Processing message for session {}: {}", sessionId, userMessage);

        currentProducts = new ArrayList<>();
        
        // Step 1: Get or create session
        ChatSession session = getOrCreateSession(sessionId, ipAddress, userAgent);
        
        // Step 2: Detect intent
        IntentResult intent = intentDetector.detect(userMessage);
        log.info("Intent detected: {} ({})", intent.getIntent(), intent.getDetectionMethod());
        
        // Step 3: Save user message
        saveMessage(session, userMessage, "USER");
        
        // Step 4: Process based on intent
        String response = processByIntent(userMessage, intent, sessionId);
        
        // Step 5: Save bot response
        saveMessage(session, response, "BOT");
        
        // Step 6: Update memory
        memoryService.updateMemory(sessionId, userMessage, response);
        
        // Step 7: Update session
        session.incrementMessageCount();
        session.setLastMessageAt(LocalDateTime.now());
        sessionRepository.save(session);
        
        long processingTime = System.currentTimeMillis() - startTime;
        log.info("Message processed in {}ms", processingTime);
        
        return buildChatResponse(session, response, intent.getIntent().name());
    }

    /**
     * Xử lý theo intent đã detect.
     */
    private String processByIntent(String message, IntentResult intent, String sessionId) {
        IntentType intentType = intent.getIntent();
        
        return switch (intentType) {
            case GREETING -> handleGreeting(sessionId);
            case PRODUCT_COMPARE -> handleCompare(message);
            case FAQ_BAOHANH, FAQ_GIAOHANG, FAQ_DOITRA, FAQ_TRAGOP, FAQ_GENERAL -> 
                handleFAQ(message, intentType);
            case PRODUCT_RECOMMENDATION -> handleRecommendation(message, sessionId);
            case PRODUCT_SEARCH, PRICE_QUERY, SPEC_QUERY -> handleProductSearch(message, sessionId);
            default -> handleGeneralChat(message, sessionId);
        };
    }

    /**
     * Xử lý lời chào.
     */
    private String handleGreeting(String sessionId) {
        boolean hasMemory = memoryService.hasPreferences(sessionId);
        
        if (!hasMemory) {
            return """
                👋 Xin chào! Tôi là AI Assistant của TMDT Phone Store.
                
                Tôi có thể giúp bạn:
                🔍 Tìm kiếm điện thoại phù hợp
                ⚖️ So sánh các sản phẩm
                💡 Đề xuất sản phẩm theo nhu cầu
                ❓ Trả lời về bảo hành, giao hàng, đổi trả
                💳 Thông tin trả góp
                
                Bạn cần tôi hỗ trợ gì hôm nay?
                """;
        }
        
        return """
            👋 Chào bạn quay lại! Rất vui được gặp lại bạn.
            
            Tôi vẫn nhớ bạn đang quan tâm đến những sản phẩm theo sở thích trước đó.
            
            Bạn muốn tiếp tục tìm hiểu sản phẩm nào không?
            """;
    }

    /**
     * Xử lý so sánh sản phẩm.
     */
    private String handleCompare(String message) {
        List<String> productNames = extractProductNames(message);
        
        if (productNames.size() < 2) {
            return "Để so sánh, bạn cần cung cấp ít nhất 2 sản phẩm.\n\n" +
                   "Ví dụ: 'So sánh iPhone 15 và Samsung S24'";
        }
        
        PhoneCompareEngine.CompareResult result = compareEngine.compare(productNames);
        
        if (!result.isSuccess()) {
            return result.getErrorMessage();
        }
        
        return buildCompareResponse(result);
    }

    /**
     * Xử lý FAQ.
     */
    private String handleFAQ(String message, IntentType intentType) {
        FAQService.FAQAnswer answer = faqService.getAnswer(message);
        
        if (answer.getConfidence() > 0.5) {
            return answer.getAnswer();
        }
        
        // Fallback to Gemini with FAQ context
        String policyContext = faqContextBuilder.buildContext(message, 3);
        String prompt = promptBuilder.buildFAQPrompt(message, policyContext);
        
        return geminiService.sendMessage(promptBuilder.buildSimplePrompt(message, null), prompt);
    }

    /**
     * Xử lý tìm kiếm sản phẩm.
     */
    private String handleProductSearch(String message, String sessionId) {
        List<Product> products = productContextBuilder.searchProducts(message, 8);
        this.currentProducts = products.stream()
                .limit(5)
                .map(this::toChatProductDto)
                .collect(Collectors.toList());

        String productContext = productContextBuilder.buildContext(message, sessionId, 8);
        String memoryContext = memoryService.getMemoryContext(sessionId);

        String prompt = promptBuilder.buildProductSearchPrompt(message, productContext, memoryContext);

        return geminiService.sendMessage(promptBuilder.buildSimplePrompt(message, null), prompt);
    }

    /**
     * Xử lý recommendation.
     */
    private String handleRecommendation(String message, String sessionId) {
        List<Product> products = productContextBuilder.searchProducts(message, 8);
        this.currentProducts = products.stream()
                .limit(5)
                .map(this::toChatProductDto)
                .collect(Collectors.toList());

        String productContext = productContextBuilder.buildContext(message, sessionId, 8);
        String memoryContext = memoryService.getMemoryContext(sessionId);

        String prompt = promptBuilder.buildRecommendationPrompt(message, productContext, memoryContext);

        return geminiService.sendMessage(promptBuilder.buildSimplePrompt(message, null), prompt);
    }

    /**
     * Xử lý general chat.
     */
    private String handleGeneralChat(String message, String sessionId) {
        String productContext = productContextBuilder.buildContext(message, sessionId, 5);
        String policyContext = faqContextBuilder.buildContext(message, 3);
        String memoryContext = memoryService.getMemoryContext(sessionId);
        
        String prompt = promptBuilder.buildGeneralPrompt(message, productContext, 
            policyContext, memoryContext);
        
        return geminiService.sendMessage(promptBuilder.buildSimplePrompt(message, null), prompt);
    }

    /**
     * Trích xuất tên sản phẩm từ message.
     */
    private List<String> extractProductNames(String message) {
        java.util.List<String> names = new java.util.ArrayList<>();
        String lower = message.toLowerCase();
        
        // iPhone patterns
        if (lower.contains("iphone")) {
            if (lower.contains("16")) names.add("iPhone 16");
            else if (lower.contains("15")) names.add("iPhone 15");
            else if (lower.contains("14")) names.add("iPhone 14");
            else names.add("iPhone");
        }
        
        // Samsung/Galaxy patterns
        if (lower.contains("samsung") || lower.contains("galaxy") || lower.contains("s24") || lower.contains("s23")) {
            if (lower.contains("s24 ultra")) names.add("Galaxy S24 Ultra");
            else if (lower.contains("s24")) names.add("Galaxy S24");
            else if (lower.contains("s23")) names.add("Galaxy S23");
            else names.add("Samsung Galaxy");
        }
        
        // Xiaomi patterns
        if (lower.contains("xiaomi") || lower.contains("redmi") || lower.contains("poco")) {
            if (lower.contains("14")) names.add("Xiaomi 14");
            else if (lower.contains("note 13")) names.add("Redmi Note 13");
            else names.add("Xiaomi");
        }
        
        // Oppo patterns
        if (lower.contains("oppo")) {
            if (lower.contains("reno")) names.add("OPPO Reno");
            else names.add("OPPO");
        }
        
        // Vivo patterns
        if (lower.contains("vivo")) {
            names.add("Vivo");
        }
        
        return names;
    }

    /**
     * Build compare response.
     */
    private String buildCompareResponse(PhoneCompareEngine.CompareResult result) {
        StringBuilder sb = new StringBuilder();
        sb.append("📊 SO SÁNH SẢN PHẨM\n\n");
        
        for (PhoneCompareEngine.CompareResult.ProductComparison comp : result.getProducts()) {
            sb.append("━━━━━━━━━━━━━━━━━━━━\n");
            sb.append("📱 ").append(comp.getProductName()).append("\n");
            sb.append("💰 Giá: ").append(formatPrice(comp.getPrice())).append("\n\n");
            
            java.util.Map<String, String> specs = comp.getSpecifications();
            if (specs != null) {
                if (specs.containsKey("RAM")) sb.append("💾 RAM: ").append(specs.get("RAM")).append("\n");
                if (specs.containsKey("Storage")) sb.append("📦 Bộ nhớ: ").append(specs.get("Storage")).append("\n");
                if (specs.containsKey("Camera")) sb.append("📷 Camera: ").append(specs.get("Camera")).append("\n");
                if (specs.containsKey("Battery")) sb.append("🔋 Pin: ").append(specs.get("Battery")).append("\n");
                if (specs.containsKey("Display")) sb.append("🖥️ Màn hình: ").append(specs.get("Display")).append("\n");
            }
            sb.append("\n");
        }
        
        sb.append("━━━━━━━━━━━━━━━━━━━━\n\n");
        sb.append(result.getSummary());
        sb.append("\n\nBạn muốn tìm hiểu thêm về sản phẩm nào?");
        
        return sb.toString();
    }

    private String formatPrice(java.math.BigDecimal price) {
        if (price == null) return "Liên hệ";
        return String.format("%,.0f VNĐ", price);
    }

    private ChatProductDto toChatProductDto(Product p) {
        List<ProductVariant> variants = variantRepository
                .findByProductIdAndDeletedAtIsNullOrderByPriceAsc(p.getId());

        BigDecimal minPrice = null;
        BigDecimal maxPrice = null;
        if (!variants.isEmpty()) {
            minPrice = variants.stream().map(ProductVariant::getPrice)
                    .min(Comparator.naturalOrder()).orElse(null);
            maxPrice = variants.stream().map(ProductVariant::getPrice)
                    .max(Comparator.naturalOrder()).orElse(null);
        }

        return ChatProductDto.builder()
                .productId(p.getId())
                .productName(p.getName())
                .brandName(p.getBrand() != null ? p.getBrand().getName() : "")
                .thumbnail(p.getThumbnailUrl())
                .minPrice(minPrice)
                .maxPrice(maxPrice)
                .salePercent(p.getSale() != null ? p.getSale().doubleValue() : null)
                .slug(p.getSlug())
                .build();
    }

    /**
     * Lấy hoặc tạo session.
     */
    private synchronized ChatSession getOrCreateSession(String sessionId, String ipAddress, String userAgent) {
        Optional<ChatSession> existing = sessionRepository.findBySessionId(sessionId);
        
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
        return sessionRepository.save(newSession);
    }

    /**
     * Lưu message.
     */
    private void saveMessage(ChatSession session, String content, String senderType) {
        ChatMessage message = new ChatMessage();
        message.setSession(session);
        message.setSenderType(ChatMessage.SenderType.valueOf(senderType));
        message.setContent(content);
        message.setCreatedAt(LocalDateTime.now());
        messageRepository.save(message);
    }

    /**
     * Build ChatResponseDto.
     */
    private ChatResponseDto buildChatResponse(ChatSession session, String botMessage, String intent) {
        List<ChatMessage> messages = messageRepository
            .findBySessionSessionIdOrderByCreatedAtAsc(session.getSessionId());

        List<ChatResponseDto.ChatMessageDto> messageDtos = messages.stream()
            .map(ChatResponseDto.ChatMessageDto::fromEntity)
            .toList();

        return ChatResponseDto.builder()
            .sessionId(session.getSessionId())
            .botMessage(botMessage)
            .intent(intent)
            .products(this.currentProducts.isEmpty() ? null : this.currentProducts)
            .messages(messageDtos)
            .timestamp(LocalDateTime.now())
            .totalMessages(session.getMessageCount())
            .build();
    }
}
