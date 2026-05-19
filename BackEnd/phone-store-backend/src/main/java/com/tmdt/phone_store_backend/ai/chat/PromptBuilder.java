package com.tmdt.phone_store_backend.ai.chat;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Service xây dựng prompt cho Gemini AI.
 */
@Component
@Slf4j
public class PromptBuilder {

    private static final String SYSTEM_PROMPT = """
        Bạn là AI tư vấn bán điện thoại cho website TMDT Phone Store.
        
        NGUYÊN TẮC:
        1. Chỉ trả lời dựa trên dữ liệu được cung cấp trong context.
        2. Không bịa đặt thông tin sản phẩm, giá hoặc tồn kho.
        3. Trả lời bằng tiếng Việt, ngắn gọn, dễ hiểu.
        4. Ưu tiên tư vấn đúng nhu cầu người dùng.
        5. Nếu không có thông tin, nói rõ "Tôi không có đủ thông tin để trả lời".
        6. Gợi ý sản phẩm cụ thể khi có thể.
        7. Nếu sản phẩm có giảm giá, NHẮC RÕ phần trăm giảm giá.
        8. Dùng emoji phù hợp để tin nhắn sinh động hơn.
        
        GIỌNG VĂN: Thân thiện, chuyên nghiệp, nhiệt tình.
        
        ĐỊNH DẠNG TRẢ LỜI:
        - Mỗi sản phẩm: Tên, Giá, Thương hiệu, Điểm nổi bật.
        - Dùng bullet points và emoji để dễ đọc.
        - Kết thúc bằng câu hỏi mở để tiếp tục tư vấn.
        """;

    /**
     * Build prompt cho product search.
     */
    public String buildProductSearchPrompt(String userQuery, String productContext, 
                                          String memoryContext) {
        return String.format("""
            %s
            
            CÂU HỎI NGƯỜI DÙNG:
            %s
            
            THÔNG TIN SẢN PHẨM:
            %s
            
            THÔNG TIN NGƯỜI DÙNG (đã biết):
            %s
            
            YÊU CẦU:
            - Tìm và giới thiệu sản phẩm phù hợp với yêu cầu
            - Trình bày: tên, giá, thương hiệu, thông số chính
            - Nếu có giảm giá, nhắc rõ phần trăm
            - Gợi ý mua hàng phù hợp
            - Đặt câu hỏi để hiểu rõ hơn nhu cầu
            """, 
            SYSTEM_PROMPT, 
            userQuery, 
            productContext,
            memoryContext != null && !memoryContext.isEmpty() ? memoryContext : "(Chưa có thông tin người dùng)"
        );
    }

    /**
     * Build prompt cho FAQ questions.
     */
    public String buildFAQPrompt(String userQuery, String policyContext) {
        return String.format("""
            %s
            
            CÂU HỎI NGƯỜI DÙNG:
            %s
            
            THÔNG TIN CHÍNH SÁCH:
            %s
            
            YÊU CẦU:
            - Trả lời dựa trên thông tin chính sách được cung cấp
            - Nếu không có trong chính sách, trả lời dựa trên thông tin chung
            - Cung cấp thông tin liên hệ nếu cần (hotline, Zalo, email)
            - Trả lời ngắn gọn, rõ ràng
            """, 
            SYSTEM_PROMPT, 
            userQuery, 
            policyContext
        );
    }

    /**
     * Build prompt cho general chat.
     */
    public String buildGeneralPrompt(String userQuery, String productContext,
                                     String policyContext, String memoryContext) {
        return String.format("""
            %s
            
            CÂU HỎI NGƯỜI DÙNG:
            %s
            
            THÔNG TIN SẢN PHẨM:
            %s
            
            THÔNG TIN CHÍNH SÁCH:
            %s
            
            THÔNG TIN NGƯỜI DÙNG (đã biết):
            %s
            
            YÊU CẦU:
            - Trả lời tự nhiên, hữu ích
            - Sử dụng thông tin từ context để trả lời chính xác
            - Gợi ý sản phẩm hoặc FAQ nếu phù hợp
            - Nếu câu hỏi không liên quan đến điện thoại/cửa hàng, lịch sự từ chối
            """, 
            SYSTEM_PROMPT, 
            userQuery, 
            productContext != null && !productContext.isEmpty() ? productContext : "(Không có thông tin sản phẩm)",
            policyContext != null && !policyContext.isEmpty() ? policyContext : "(Không có thông tin chính sách)",
            memoryContext != null && !memoryContext.isEmpty() ? memoryContext : "(Chưa có thông tin người dùng)"
        );
    }

    /**
     * Build prompt cho phone comparison.
     */
    public String buildComparePrompt(String userQuery, String productContext) {
        return String.format("""
            %s
            
            YÊU CẦU SO SÁNH:
            %s
            
            THÔNG TIN SẢN PHẨM:
            %s
            
            YÊU CẦU:
            - So sánh chi tiết từng đặc điểm (RAM, Camera, Pin, Màn hình, Giá)
            - Đánh giá ưu nhược điểm của từng sản phẩm
            - Đưa ra khuyến nghị phù hợp với từng nhu cầu
            - Trình bày dạng bảng nếu có thể
            - Kết luận: Nên chọn sản phẩm nào cho use case nào
            """, 
            SYSTEM_PROMPT, 
            userQuery, 
            productContext
        );
    }

    /**
     * Build prompt cho recommendation.
     */
    public String buildRecommendationPrompt(String userQuery, String productContext,
                                          String memoryContext) {
        return String.format("""
            %s
            
            YÊU CẦU NGƯỜI DÙNG:
            %s
            
            THÔNG TIN SẢN PHẨM KHẢ DỤNG:
            %s
            
            THÔNG TIN SỞ THÍCH NGƯỜI DÙNG:
            %s
            
            YÊU CẦU:
            - Đề xuất 3-5 sản phẩm phù hợp nhất
            - Giải thích tại sao sản phẩm phù hợp với nhu cầu
            - Trình bày rõ: tên, giá, điểm nổi bật
            - Sắp xếp theo mức độ phù hợp
            """, 
            SYSTEM_PROMPT, 
            userQuery, 
            productContext,
            memoryContext != null && !memoryContext.isEmpty() ? memoryContext : "(Chưa có sở thích)"
        );
    }

    /**
     * Build simple prompt với system instruction.
     */
    public String buildSimplePrompt(String userMessage, String systemInstruction) {
        return String.format("%s\n\n%s", 
            systemInstruction != null ? systemInstruction : SYSTEM_PROMPT,
            userMessage);
    }
}
