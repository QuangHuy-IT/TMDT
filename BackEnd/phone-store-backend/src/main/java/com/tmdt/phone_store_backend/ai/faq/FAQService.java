package com.tmdt.phone_store_backend.ai.faq;

import com.tmdt.phone_store_backend.domain.entity.FAQ;
import com.tmdt.phone_store_backend.repository.FAQRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service quản lý FAQ - xử lý câu hỏi thường gặp.
 * 
 * Sử dụng keyword matching + ChromaDB semantic search để tìm câu trả lời.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FAQService {

    private final FAQRepository faqRepository;
    private final FAQVectorStore faqVectorStore;

    @PostConstruct
    public void initialize() {
        // Index all active FAQs on startup
        try {
            List<FAQ> activeFAQs = faqRepository.findByIsActiveTrueOrderBySortOrderAsc();
            if (!activeFAQs.isEmpty()) {
                faqVectorStore.indexFAQs(activeFAQs);
                log.info("Initialized {} FAQs into vector store", activeFAQs.size());
            } else {
                // Seed default FAQs if none exist
                seedDefaultFAQs();
            }
        } catch (Exception e) {
            log.warn("Could not initialize FAQ vector store (ChromaDB may not be running): {}", e.getMessage());
        }
    }

    /**
     * Tìm câu trả lời cho câu hỏi.
     */
    public FAQAnswer getAnswer(String question) {
        // Try semantic search first
        try {
            List<FAQSearchResult> results = faqVectorStore.semanticSearch(question, 3);
            
            if (!results.isEmpty() && results.get(0).getSimilarity() > 0.6) {
                FAQSearchResult top = results.get(0);
                return FAQAnswer.builder()
                    .question(top.getQuestion())
                    .answer(top.getAnswer())
                    .category(top.getCategory())
                    .confidence(top.getSimilarity())
                    .source("vector_search")
                    .build();
            }
        } catch (Exception e) {
            log.warn("Vector search failed, falling back to keyword search: {}", e.getMessage());
        }
        
        // Fallback: keyword matching
        return findByKeywords(question);
    }

    /**
     * Tìm câu trả lời bằng keyword matching.
     */
    private FAQAnswer findByKeywords(String question) {
        String lower = question.toLowerCase();
        
        // Check warranty
        if (containsAny(lower, "bảo hành", "bh", "sửa chữa", "hỏng", "lỗi", "đổi mới")) {
            return getFirstFAQ("BAO_HANH");
        }
        
        // Check shipping
        if (containsAny(lower, "giao hàng", "ship", "vận chuyển", "nhận hàng", "thời gian giao", "phí ship")) {
            return getFirstFAQ("GIAO_HANG");
        }
        
        // Check return
        if (containsAny(lower, "đổi trả", "trả lại", "hoàn tiền", "refund")) {
            return getFirstFAQ("DOI_TRA");
        }
        
        // Check installment
        if (containsAny(lower, "trả góp", "0%", "lãi xuất", "kỳ hạn", "installment")) {
            return getFirstFAQ("TRA_GOP");
        }
        
        // Check general
        if (containsAny(lower, "cửa hàng", "địa chỉ", "liên hệ", "hotline", "zalo", "facebook")) {
            return getFirstFAQ("CHUNG");
        }
        
        // No match
        return FAQAnswer.builder()
            .answer("Xin lỗi, tôi không tìm thấy câu trả lời phù hợp cho câu hỏi này. Bạn có thể liên hệ hotline 1800-1234 hoặc Zalo để được hỗ trợ trực tiếp nhé!")
            .category("UNKNOWN")
            .confidence(0.0)
            .source("fallback")
            .build();
    }

    /**
     * Lấy FAQ đầu tiên theo category.
     */
    private FAQAnswer getFirstFAQ(String category) {
        try {
            List<FAQ> faqs = faqRepository.findByCategoryAndIsActiveTrueOrderBySortOrderAsc(category);
            
            if (!faqs.isEmpty()) {
                FAQ faq = faqs.get(0);
                return FAQAnswer.builder()
                    .question(faq.getQuestion())
                    .answer(faq.getAnswer())
                    .category(faq.getCategory())
                    .confidence(0.7)
                    .source("keyword_match")
                    .build();
            }
        } catch (Exception e) {
            log.warn("Failed to get FAQ by category: {}", e.getMessage());
        }
        
        return null;
    }

    private boolean containsAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Lấy tất cả categories.
     */
    public List<String> getCategories() {
        return faqRepository.findAllCategories();
    }

    /**
     * Rebuild FAQ index.
     */
    public void rebuildIndex() {
        List<FAQ> allFAQs = faqRepository.findByIsActiveTrueOrderBySortOrderAsc();
        faqVectorStore.resetCollection();
        faqVectorStore.indexFAQs(allFAQs);
        log.info("Rebuilt FAQ index with {} items", allFAQs.size());
    }

    /**
     * Thêm hoặc cập nhật FAQ.
     */
    public FAQ saveFAQ(FAQ faq) {
        FAQ saved = faqRepository.save(faq);
        // Re-index
        rebuildIndex();
        return saved;
    }

    /**
     * Tạo FAQ mặc định nếu chưa có.
     */
    private void seedDefaultFAQs() {
        List<FAQ> existing = faqRepository.findAll();
        if (!existing.isEmpty()) return;
        
        log.info("Seeding default FAQs...");
        
        List<FAQ> defaultFAQs = List.of(
            FAQ.builder()
                .question("Chính sách bảo hành như thế nào?")
                .answer("Tất cả sản phẩm được bảo hành chính hãng 12 tháng. Bảo hành bao gồm lỗi từ nhà sản xuất, không bao gồm bảo hành các lỗi do người dùng gây ra như rơi vỡ, vào nước. Quý khách mang sản phẩm và hóa đơn đến trung tâm bảo hành gần nhất hoặc liên hệ hotline để được hỗ trợ.")
                .category("BAO_HANH")
                .keywords("bảo hành,bh,sửa chữa,hỏng,lỗi,đổi mới,warranty")
                .isActive(true)
                .sortOrder(1)
                .build(),
                
            FAQ.builder()
                .question("Thời gian giao hàng bao lâu?")
                .answer("Đơn hàng nội thành TP.HCM: 1-2 ngày làm việc.\n" +
                        "Đơn hàng các tỉnh miền Nam: 2-3 ngày làm việc.\n" +
                        "Đơn hàng các tỉnh miền Trung: 3-5 ngày làm việc.\n" +
                        "Đơn hàng các tỉnh miền Bắc: 4-7 ngày làm việc.\n\n" +
                        "Đơn hàng remote (vùng sâu vùng xa) có thể lâu hơn 1-2 ngày.\n" +
                        "Phí ship: Miễn phí cho đơn hàng từ 500,000 VNĐ. Đơn dưới 500,000 VNĐ phí ship 30,000 VNĐ.")
                .category("GIAO_HANG")
                .keywords("giao hàng,ship,vận chuyển,nhận hàng,thời gian,phí ship,free ship,delivery")
                .isActive(true)
                .sortOrder(1)
                .build(),
                
            FAQ.builder()
                .question("Chính sách đổi trả như thế nào?")
                .answer("Quý khách được đổi trả trong vòng 7 ngày nếu:\n" +
                        "- Sản phẩm lỗi từ nhà sản xuất\n" +
                        "- Sản phẩm không đúng như mô tả\n\n" +
                        "Điều kiện đổi trả:\n" +
                        "- Sản phẩm còn nguyên seal, chưa activated\n" +
                        "- Phụ kiện đầy đủ, không có dấu hiệu sử dụng\n" +
                        "- Còn hóa đơn mua hàng\n\n" +
                        "Sản phẩm không được đổi trả: Sản phẩm bị rơi vỡ, vào nước, tự ý sửa chữa.")
                .category("DOI_TRA")
                .keywords("đổi trả,trả lại,hoàn tiền,refund,đổi sản phẩm,return,exchange")
                .isActive(true)
                .sortOrder(1)
                .build(),
                
            FAQ.builder()
                .question("Có hỗ trợ trả góp không?")
                .answer("Có! TMDT hỗ trợ trả góp 0% lãi suất với thẻ tín dụng của các ngân hàng:\n" +
                        "- Vietcombank\n" +
                        "- Techcombank\n" +
                        "- VPBank\n" +
                        "- BIDV\n" +
                        "- ACB\n" +
                        "- Sacombank\n\n" +
                        "Thời hạn trả góp: 3, 6, 9, 12 tháng\n" +
                        "Yêu cầu: Thẻ tín dụng của 1 trong các ngân hàng trên, hạn mức đủ thanh toán\n\n" +
                        "Ngoài ra, TMDT còn hỗ trợ trả góp qua các công ty tài chính: Home Credit, FE Credit với lãi suất ưu đãi.")
                .category("TRA_GOP")
                .keywords("trả góp,0%,lãi xuất,kỳ hạn,thanh toán góp,installment,credit card,home credit")
                .isActive(true)
                .sortOrder(1)
                .build(),
                
            FAQ.builder()
                .question("Liên hệ với TMDT như thế nào?")
                .answer("TMDT Phone Store luôn sẵn sàng hỗ trợ bạn:\n\n" +
                        "📞 Hotline: 1800-1234 (8:00 - 21:00 các ngày trong tuần)\n" +
                        "💬 Zalo: 0901-234-567\n" +
                        "📧 Email: support@tmdt.vn\n" +
                        "🏪 Địa chỉ: 123 Nguyễn Huệ, Quận 1, TP.HCM\n" +
                        "🌐 Website: www.tmdt.vn\n\n" +
                        "Fanpage Facebook: fb.com/tmdtphonestore\n" +
                        "Instagram: @tmdtphonestore")
                .category("CHUNG")
                .keywords("liên hệ,contact,hotline,zalo,email,địa chỉ,cửa hàng,facebook")
                .isActive(true)
                .sortOrder(1)
                .build()
        );
        
        for (FAQ faq : defaultFAQs) {
            faqRepository.save(faq);
        }
        
        // Index after seeding
        try {
            faqVectorStore.indexFAQs(defaultFAQs);
            log.info("Seeded {} default FAQs", defaultFAQs.size());
        } catch (Exception e) {
            log.warn("Could not index default FAQs (ChromaDB may not be running): {}", e.getMessage());
        }
    }

    @lombok.Data
    @lombok.Builder
    public static class FAQAnswer {
        private String question;
        private String answer;
        private String category;
        private double confidence;
        private String source;
    }
}
