package com.tmdt.phone_store_backend.ai.intent;

/**
 * Enum các intent mà AI có thể nhận diện từ câu hỏi người dùng.
 */
public enum IntentType {
    GREETING("Lời chào, chào hỏi", 0.3),
    PRODUCT_SEARCH("Tìm kiếm sản phẩm", 0.7),
    PRODUCT_COMPARE("So sánh sản phẩm", 0.8),
    PRODUCT_RECOMMENDATION("Đề xuất sản phẩm theo sở thích", 0.75),
    FAQ_BAOHANH("Hỏi về bảo hành", 0.7),
    FAQ_GIAOHANG("Hỏi về giao hàng", 0.7),
    FAQ_DOITRA("Hỏi về đổi trả", 0.7),
    FAQ_TRAGOP("Hỏi về trả góp", 0.7),
    FAQ_GENERAL("Câu hỏi FAQ chung", 0.6),
    PRICE_QUERY("Hỏi giá sản phẩm", 0.65),
    SPEC_QUERY("Hỏi thông số kỹ thuật", 0.6),
    GENERAL_CHAT("Trò chuyện chung", 0.2),
    OUT_OF_SCOPE("Ngoài phạm vi điện thoại", 0.0);

    private final String description;
    private final double defaultConfidence;

    IntentType(String description, double defaultConfidence) {
        this.description = description;
        this.defaultConfidence = defaultConfidence;
    }

    public String getDescription() {
        return description;
    }

    public double getDefaultConfidence() {
        return defaultConfidence;
    }

    public boolean isFAQ() {
        return this.name().startsWith("FAQ_");
    }

    public boolean isProductRelated() {
        return this == PRODUCT_SEARCH
            || this == PRODUCT_COMPARE
            || this == PRODUCT_RECOMMENDATION
            || this == PRICE_QUERY
            || this == SPEC_QUERY;
    }
}
