package com.tmdt.phone_store_backend.ai.intent;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Pattern;

/**
 * Service nhận diện intent (ý định) từ câu hỏi của người dùng.
 * 
 * Sử dụng keyword matching để xác định intent nhanh chóng.
 * Có thể mở rộng bằng Gemini AI cho các trường hợp ambiguous.
 */
@Service
@Slf4j
public class IntentDetector {

    // Keyword patterns cho từng intent
    private static final Map<IntentType, List<String>> KEYWORD_PATTERNS = Map.of(
        IntentType.GREETING, List.of(
            "chào", "xin chào", "hello", "hi", "hey", "buổi sáng", 
            "buổi chiều", "buổi tối", "chào bạn", "cần tư vấn"
        ),
        IntentType.PRODUCT_SEARCH, List.of(
            "tìm", "mua", "xem", "cần mua", "tìm kiếm", "điện thoại nào", 
            "máy nào", "cho tôi xem", "gợi ý", "nên mua", "tốt nhất", "điện thoại"
        ),
        IntentType.PRODUCT_COMPARE, List.of(
            "so sánh", "so sanh", " vs ", "khác nhau",
            "tốt hơn", "nhược điểm"
        ),
        IntentType.PRODUCT_RECOMMENDATION, List.of(
            "recommend", "gợi ý cho tôi", "bạn nghĩ", "theo tôi", 
            "tôi thích", "tôi muốn", "nhu cầu", "sở thích", "phù hợp với tôi"
        ),
        IntentType.FAQ_BAOHANH, List.of(
            "bảo hành", "bh", "sửa chữa", "hỏng", "lỗi", "đổi mới",
            "bảo hành bao lâu", "bảo hành ở đâu"
        ),
        IntentType.FAQ_GIAOHANG, List.of(
            "giao hàng", "ship", "vận chuyển", "nhận hàng", "thời gian giao", 
            "phí ship", "free ship", "giao nhanh"
        ),
        IntentType.FAQ_DOITRA, List.of(
            "đổi trả", "trả lại", "hoàn tiền", "refund", "đổi sản phẩm"
        ),
        IntentType.FAQ_TRAGOP, List.of(
            "trả góp", "0%", "lãi xuất", "kỳ hạn", "thanh toán góp", 
            "installment", "trả theo tháng"
        ),
        IntentType.PRICE_QUERY, List.of(
            "giá", "bao nhiêu", "price", "rẻ", "đắt", "tiền", "chi phí",
            "có giá bao nhiêu", "giá bao nhiêu"
        ),
        IntentType.SPEC_QUERY, List.of(
            "thông số", "spec", "camera", "pin", "ram", "bộ nhớ", "màn hình",
            "chip", "cpu", "sạc", "mah", "gb"
        )
    );

    // Pattern để detect câu hỏi so sánh điện thoại
    private static final Pattern COMPARE_PATTERN = Pattern.compile(
        "so sánh|so sanh|\\bvs\\b|nên chọn .+ (với|hay) .+",
        Pattern.CASE_INSENSITIVE
    );

    // Pattern để detect budget
    private static final Pattern BUDGET_PATTERN = Pattern.compile(
        "dưới\\s*\\d+|trên\\s*\\d+|từ\\s*\\d+|khoảng\\s*\\d+|tầm\\s*\\d+|\\d+\\s*triệu",
        Pattern.CASE_INSENSITIVE
    );

    /**
     * Detect intent từ câu hỏi người dùng.
     * 
     * @param userQuery Câu hỏi của người dùng
     * @return IntentResult chứa intent và confidence score
     */
    public IntentResult detect(String userQuery) {
        if (userQuery == null || userQuery.isBlank()) {
            return IntentResult.builder()
                .intent(IntentType.GENERAL_CHAT)
                .confidence(0.5)
                .detectionMethod("default")
                .build();
        }

        String normalizedQuery = userQuery.toLowerCase().trim();
        Map<IntentType, Double> scores = new HashMap<>();

        // Phase 1: Keyword-based detection
        for (Map.Entry<IntentType, List<String>> entry : KEYWORD_PATTERNS.entrySet()) {
            IntentType intent = entry.getKey();
            int matchCount = 0;
            
            for (String pattern : entry.getValue()) {
                if (normalizedQuery.contains(pattern.toLowerCase())) {
                    matchCount++;
                }
            }
            
            if (matchCount > 0) {
                double score = Math.min(1.0, matchCount * 0.25);
                scores.put(intent, score);
            }
        }

        // Phase 2: Special pattern detection - Compare phones
        if (COMPARE_PATTERN.matcher(normalizedQuery).find()) {
            scores.put(IntentType.PRODUCT_COMPARE, 0.9);
        }

        // Phase 3: Budget pattern detection
        if (BUDGET_PATTERN.matcher(normalizedQuery).find()) {
            scores.put(IntentType.PRODUCT_SEARCH, 
                Math.max(scores.getOrDefault(IntentType.PRODUCT_SEARCH, 0.0), 0.8));
        }

        // Phase 4: Phone name detection (iPhone, Samsung, etc.) with compare indicators
        if (containsPhoneNamesWithConnector(normalizedQuery)) {
            scores.put(IntentType.PRODUCT_COMPARE, 0.85);
        }

        log.debug("Intent scores: {}", scores);

        return buildResult(scores);
    }

    /**
     * Kiểm tra xem có phải là câu hỏi so sánh điện thoại không
     */
    private boolean containsPhoneNamesWithConnector(String query) {
        // Check for phone name patterns followed by connectors
        String[] phonePatterns = {
            "iphone.*(và|vs|với|hay)",
            "samsung.*(và|vs|với|hay)",
            "galaxy.*(và|vs|với|hay)",
            "xiaomi.*(và|vs|với|hay)",
            "redmi.*(và|vs|với|hay)",
            "oppo.*(và|vs|với|hay)",
            "vivo.*(và|vs|với|hay)",
            "s\\d{1,2}.*(và|vs|với|hay)"
        };

        for (String pattern : phonePatterns) {
            if (Pattern.compile(pattern, Pattern.CASE_INSENSITIVE).matcher(query).find()) {
                return true;
            }
        }
        return false;
    }

    /**
     * Build result từ scores
     */
    private IntentResult buildResult(Map<IntentType, Double> scores) {
        if (scores.isEmpty()) {
            return IntentResult.builder()
                .intent(IntentType.GENERAL_CHAT)
                .confidence(0.5)
                .detectionMethod("default")
                .build();
        }

        // Lấy intent có score cao nhất
        Map.Entry<IntentType, Double> top = scores.entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .orElse(Map.entry(IntentType.GENERAL_CHAT, 0.5));

        // Nếu score quá thấp, trả về GENERAL_CHAT
        if (top.getValue() < 0.3) {
            return IntentResult.builder()
                .intent(IntentType.GENERAL_CHAT)
                .confidence(0.5)
                .detectionMethod("low_confidence")
                .build();
        }

        return IntentResult.builder()
            .intent(top.getKey())
            .confidence(top.getValue())
            .detectionMethod("keyword")
            .build();
    }
}
