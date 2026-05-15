-- Migration V7: Create FAQ, ChatSession, ChatMessage tables for AI Chatbot

-- =============================================
-- FAQ Table
-- =============================================
CREATE TABLE IF NOT EXISTS faqs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    question VARCHAR(500) NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'CHUNG',
    keywords VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    INDEX idx_category (category),
    INDEX idx_is_active (is_active),
    INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Chat Session Table
-- =============================================
CREATE TABLE IF NOT EXISTS chat_sessions (
    session_id VARCHAR(100) PRIMARY KEY,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    user_id BIGINT,
    message_count INT NOT NULL DEFAULT 0,
    last_intent VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    last_message_at DATETIME,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_last_message_at (last_message_at),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Chat Message Table
-- =============================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    sender_type VARCHAR(10) NOT NULL,
    content TEXT NOT NULL,
    intent VARCHAR(50),
    confidence DECIMAL(5,4),
    created_at DATETIME NOT NULL,
    INDEX idx_session_id (session_id),
    INDEX idx_sender_type (sender_type),
    INDEX idx_created_at (created_at),
    CONSTRAINT fk_message_session FOREIGN KEY (session_id) 
        REFERENCES chat_sessions(session_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Insert Default FAQs
-- =============================================
INSERT INTO faqs (question, answer, category, keywords, is_active, sort_order, created_at, updated_at) VALUES
-- Warranty FAQs
('Chế độ bảo hành điện thoại như thế nào?', 
'Quý khách được bảo hành chính hãng theo chính sách của nhà sản xuất. Thời gian bảo hành tùy theo sản phẩm, thông thường từ 12 đến 24 tháng. Sản phẩm lỗi kỹ thuật trong thời gian bảo hành sẽ được đổi mới hoặc sửa chữa miễn phí.',
'BAO_HANH', 'bao hanh, bh, warranty, loi, sua chua', TRUE, 1, NOW(), NOW()),

('Điều kiện để được bảo hành là gì?', 
'Điều kiện bảo hành: (1) Sản phẩm còn trong thời gian bảo hành. (2) Sản phẩm không bị rơi vỡ, ngấm nước, tự ý tháo lắp hoặc sửa chữa không qua trung tâm bảo hành. (3) Còn đầy đủ hộp, phụ kiện và phiếu bảo hành.',
'BAO_HANH', 'dieu kien, tieu chuan, bao hanh', TRUE, 2, NOW(), NOW()),

('Bảo hành có mất phí không?', 
'Bảo hành chính hãng trong thời gian quy định hoàn toàn MIỄN PHÍ. Sau thời gian bảo hành hoặc không đủ điều kiện bảo hành, chúng tôi hỗ trợ sửa chữa tính phí theo bảng giá trung tâm bảo hành.',
'BAO_HANH', 'phi, mien phi, chi phi, gia', TRUE, 3, NOW(), NOW()),

-- Delivery FAQs
('Phí vận chuyển là bao nhiêu?', 
'Phí vận chuyển tùy thuộc vào địa chỉ nhận hàng: Nội thành TP.HCM và Hà Nội: Miễn phí vận chuyển cho đơn từ 500,000đ. Các tỉnh thành khác: 25,000đ - 45,000đ tùy khu vực. Miễn phí vận chuyển cho đơn từ 2,000,000đ.',
'VAN_CHUYEN', 'ship, chi phi van chuyen, phi ship, giao hang', TRUE, 10, NOW(), NOW()),

('Thời gian giao hàng bao lâu?', 
'Thời gian giao hàng: TP.HCM và Hà Nội: 1-2 ngày làm việc. Các tỉnh thành khác: 3-5 ngày làm việc. Đơn hàng trước 15h sẽ được giao trong ngày (nội thành).',
'VAN_CHUYEN', 'thoi gian, ngay, gio, giao hang, nhanh, cham', TRUE, 11, NOW(), NOW()),

('Có giao hàng trong ngày không?', 
'Chúng tôi hỗ trợ giao hàng trong ngày cho đơn hàng nội thành TP.HCM và Hà Nội đặt trước 15h. Phí giao hàng nhanh: 30,000đ. Điều kiện: Sản phẩm có sẵn trong kho.',
'VAN_CHUYEN', 'nhanh, gap, trong ngay, cung ngay', TRUE, 12, NOW(), NOW()),

-- Return FAQs
('Chính sách đổi trả như thế nào?', 
'Chính sách đổi trả: (1) Đổi trả trong 7 ngày với sản phẩm lỗi từ nhà sản xuất. (2) Đổi sang sản phẩm khác cùng hoặc cao hơn giá trị (bù thêm phí nếu có). (3) Hoàn tiền 100% nếu sản phẩm không đúng mô tả.',
'DOI_TRA', 'doi tra, tra hang, hoan tien, doi hang', TRUE, 20, NOW(), NOW()),

('Làm sao để đổi trả sản phẩm?', 
'Để đổi trả sản phẩm: (1) Gọi hotline 1900.xxxx để báo cáo. (2) Gửi hàng về địa chỉ kho hàng (chúng tôi sẽ cung cấp). (3) Mang sản phẩm đến cửa hàng gần nhất. Thời gian xử lý: 1-3 ngày làm việc.',
'DOI_TRA', 'quy trinh, cach thuc, lam sao, huong dan', TRUE, 21, NOW(), NOW()),

-- Payment FAQs
('Có những hình thức thanh toán nào?', 
'Chúng tôi hỗ trợ: (1) Thanh toán khi nhận hàng (COD). (2) Thẻ ATM/Visa/Mastercard/JCB. (3) Ví điện tử: Momo, ZaloPay, VNPay. (4) Chuyển khoản ngân hàng. (5) Trả góp 0% qua thẻ tín dụng.',
'THANH_TOAN', 'than toan, tien mat, the, chuyen khoan, tra gop', TRUE, 30, NOW(), NOW()),

('Có hỗ trợ trả góp không?', 
'Có! Chúng tôi hỗ trợ trả góp 0% lãi suất: (1) Trả góp qua thẻ tín dụng với ngân hàng: VPBank, Techcombank, HSBC - lãi suất 0%, từ 3-12 tháng. (2) Trả góp qua công ty tài chính: ACS, HD Saison - lãi suất thấp, từ 6-24 tháng. Yêu cầu: CMT/CCCD, HĐLĐ hoặc sao kê lương.',
'THANH_TOAN', 'tra gop, mua truoc tra sau, lan luot, 0 lai', TRUE, 31, NOW(), NOW()),

-- Product FAQs
('Làm sao biết điện thoại chính hãng?', 
'Tất cả sản phẩm tại cửa hàng là CHÍNH HÃNG, được phân phối từ các đại lý ủy quyền. Mỗi sản phẩm có: (1) Số serial/IMEI trên hộp trùng với máy. (2) Tem niêm phong chính hãng. (3) Phiếu bảo hành chính hãng. (4) Check bảo hành trên website nhà sản xuất.',
'SAN_PHAM', 'chinh hang, authentic, fake, hang doc dao, chat luong', TRUE, 40, NOW(), NOW()),

('Có hỗ trợ cài đặt điện thoại không?', 
'Có! Khi mua tại cửa hàng, chúng tôi hỗ trợ miễn phí: (1) Cài đặt ngôn ngữ, tài khoản Google/Apple. (2) Chuyển dữ liệu từ máy cũ. (3) Cài đặt ứng dụng cơ bản. (4) Dán film, lắp SIM. Dịch vụ tại nhà có phí từ 50,000đ.',
'SAN_PHAM', 'cai dat, cai app, cai dat ban dau, setup', TRUE, 41, NOW(), NOW());
