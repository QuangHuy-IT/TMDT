package com.tmdt.phone_store_backend.ai.rag;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Service xây dựng context từ FAQ cho RAG pipeline.
 */
@Component
@Slf4j
public class FAQContextBuilder {

    /**
     * Xây dựng FAQ context cho prompt.
     */
    public String buildContext(String query, int topK) {
        // Context sẽ được lấy từ FAQService
        // Phương thức này trả về template context
        return """
            THÔNG TIN CHÍNH SÁCH CỬA HÀNG:
            
            BẢO HÀNH:
            - Tất cả sản phẩm bảo hành chính hãng 12 tháng
            - Không bảo hành lỗi do người dùng (rơi vỡ, vào nước)
            
            GIAO HÀNG:
            - Nội thành TP.HCM: 1-2 ngày
            - Các tỉnh: 2-7 ngày tùy khu vực
            - Miễn phí ship cho đơn từ 500,000 VNĐ
            
            ĐỔI TRẢ:
            - Đổi trả trong 7 ngày với sản phẩm lỗi từ nhà sản xuất
            - Sản phẩm phải còn nguyên seal, chưa activated
            
            TRẢ GÓP:
            - Hỗ trợ trả góp 0% với thẻ tín dụng Vietcombank, Techcombank, VPBank, BIDV
            - Thời hạn: 3, 6, 9, 12 tháng
            """;
    }
}
