package com.tmdt.phone_store_backend.ai.memory;

import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Model lưu trữ thông tin sở thích và preferences của người dùng
 * được học được từ cuộc trò chuyện.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserMemory {
    
    private String sessionId;
    
    // Thương hiệu yêu thích (VD: Samsung, Apple)
    @Builder.Default
    private List<String> preferredBrands = new ArrayList<>();
    
    // Tính năng quan tâm (VD: gaming, camera, pin trâu)
    @Builder.Default
    private List<String> preferredFeatures = new ArrayList<>();
    
    // Khoảng giá
    private Double minBudget;  // VNĐ
    private Double maxBudget;  // VNĐ
    
    // RAM ưu tiên (VD: 8GB, 12GB)
    @Builder.Default
    private List<String> preferredRam = new ArrayList<>();
    
    // Bộ nhớ ưu tiên (VD: 128GB, 256GB)
    @Builder.Default
    private List<String> preferredStorage = new ArrayList<>();
    
    // Nhu cầu sử dụng (VD: gaming, photography, work)
    @Builder.Default
    private List<String> usagePurpose = new ArrayList<>();
    
    // Màu sắc ưa thích
    @Builder.Default
    private List<String> preferredColors = new ArrayList<>();
    
    // Lịch sử hội thoại gần đây
    @Builder.Default
    private List<ConversationTurn> recentConversations = new ArrayList<>();
    
    // Sản phẩm đã xem
    @Builder.Default
    private List<Long> viewedProducts = new ArrayList<>();
    
    // Sản phẩm đã thích
    @Builder.Default
    private List<Long> likedProducts = new ArrayList<>();
    
    private LocalDateTime lastUpdated;
    private LocalDateTime createdAt;

    /**
     * Cập nhật memory từ tin nhắn hội thoại.
     */
    public void updateFromMessage(String userMessage, String botResponse) {
        lastUpdated = LocalDateTime.now();
        
        // Thêm vào lịch sử hội thoại
        if (recentConversations.size() >= 10) {
            recentConversations.remove(0); // Giữ 10 turn gần nhất
        }
        recentConversations.add(new ConversationTurn(userMessage, botResponse, LocalDateTime.now()));
        
        // Trích xuất preferences từ message
        extractBrandPreferences(userMessage);
        extractBudgetPreferences(userMessage);
        extractFeaturePreferences(userMessage);
        extractUsagePurpose(userMessage);
    }

    private void extractBrandPreferences(String message) {
        String lower = message.toLowerCase();
        String[] brands = {"samsung", "apple", "iphone", "xiaomi", "oppo", "vivo", 
                          "realme", "poco", "nokia", "asus", "rog"};
        
        for (String brand : brands) {
            if (lower.contains(brand)) {
                String normalized = normalizeBrand(brand);
                if (!preferredBrands.contains(normalized)) {
                    preferredBrands.add(normalized);
                }
            }
        }
    }

    private String normalizeBrand(String brand) {
        return switch (brand.toLowerCase()) {
            case "apple", "iphone" -> "Apple";
            case "samsung" -> "Samsung";
            case "xiaomi" -> "Xiaomi";
            case "oppo" -> "OPPO";
            case "vivo" -> "Vivo";
            case "realme" -> "Realme";
            case "poco" -> "POCO";
            case "nokia" -> "Nokia";
            case "asus", "rog" -> "ASUS";
            default -> brand.substring(0, 1).toUpperCase() + brand.substring(1).toLowerCase();
        };
    }

    private void extractBudgetPreferences(String message) {
        String lower = message.toLowerCase();
        
        // Pattern: "dưới X triệu"
        java.util.regex.Matcher underMatcher = 
            java.util.regex.Pattern.compile("dưới\\s*(\\d+)").matcher(lower);
        if (underMatcher.find()) {
            maxBudget = Double.parseDouble(underMatcher.group(1)) * 1_000_000;
        }
        
        // Pattern: "trên X triệu"
        java.util.regex.Matcher aboveMatcher = 
            java.util.regex.Pattern.compile("trên\\s*(\\d+)").matcher(lower);
        if (aboveMatcher.find()) {
            minBudget = Double.parseDouble(aboveMatcher.group(1)) * 1_000_000;
        }
        
        // Pattern: "X triệu"
        java.util.regex.Matcher exactMatcher = 
            java.util.regex.Pattern.compile("(\\d+)\\s*triệu").matcher(lower);
        if (exactMatcher.find() && maxBudget == null) {
            maxBudget = Double.parseDouble(exactMatcher.group(1)) * 1_000_000;
        }
    }

    private void extractFeaturePreferences(String message) {
        String lower = message.toLowerCase();
        
        if (containsAny(lower, "gaming", "chơi game", "chiến game", "hiệu năng cao", "chip mạnh")) {
            if (!preferredFeatures.contains("gaming")) preferredFeatures.add("gaming");
            if (!usagePurpose.contains("gaming")) usagePurpose.add("gaming");
        }
        
        if (containsAny(lower, "camera", "chụp ảnh", "chụp hình", "nhiếp ảnh", "selfie")) {
            if (!preferredFeatures.contains("camera")) preferredFeatures.add("camera");
            if (!usagePurpose.contains("photography")) usagePurpose.add("photography");
        }
        
        if (containsAny(lower, "pin", "trâu", "dung lượng", "sử dụng lâu", "thời lượng")) {
            if (!preferredFeatures.contains("pin")) preferredFeatures.add("pin");
        }
        
        if (containsAny(lower, "mỏng", "nhẹ", "gọn", "thời trang")) {
            if (!preferredFeatures.contains("slim")) preferredFeatures.add("slim");
        }
        
        if (containsAny(lower, "màn hình lớn", "to", "lớn", "rộng")) {
            if (!preferredFeatures.contains("large_screen")) preferredFeatures.add("large_screen");
        }
    }

    private void extractUsagePurpose(String message) {
        String lower = message.toLowerCase();
        
        if (containsAny(lower, "gaming", "chơi game", "game")) {
            if (!usagePurpose.contains("gaming")) usagePurpose.add("gaming");
        }
        if (containsAny(lower, "chụp ảnh", "camera", "nhiếp ảnh")) {
            if (!usagePurpose.contains("photography")) usagePurpose.add("photography");
        }
        if (containsAny(lower, "công việc", "work", "văn phòng")) {
            if (!usagePurpose.contains("work")) usagePurpose.add("work");
        }
        if (containsAny(lower, "bình dân", "giá rẻ", "tiết kiệm")) {
            if (!usagePurpose.contains("budget")) usagePurpose.add("budget");
        }
    }

    private boolean containsAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword)) return true;
        }
        return false;
    }

    /**
     * Chuyển memory thành context string để đưa vào prompt.
     */
    public String toContextString() {
        StringBuilder sb = new StringBuilder();
        
        boolean hasMemory = false;
        
        if (!preferredBrands.isEmpty()) {
            sb.append("- Thương hiệu yêu thích: ").append(String.join(", ", preferredBrands)).append("\n");
            hasMemory = true;
        }
        if (minBudget != null || maxBudget != null) {
            String budget = "";
            if (minBudget != null && maxBudget != null) {
                budget = String.format("%.0f - %.0f VNĐ", minBudget, maxBudget);
            } else if (maxBudget != null) {
                budget = String.format("Dưới %.0f VNĐ (%.1f triệu)", maxBudget, maxBudget / 1_000_000);
            } else if (minBudget != null) {
                budget = String.format("Trên %.0f VNĐ (%.1f triệu)", minBudget, minBudget / 1_000_000);
            }
            sb.append("- Khoảng giá: ").append(budget).append("\n");
            hasMemory = true;
        }
        if (!preferredRam.isEmpty()) {
            sb.append("- RAM ưu tiên: ").append(String.join(", ", preferredRam)).append("GB\n");
            hasMemory = true;
        }
        if (!preferredStorage.isEmpty()) {
            sb.append("- Bộ nhớ ưu tiên: ").append(String.join(", ", preferredStorage)).append("GB\n");
            hasMemory = true;
        }
        if (!usagePurpose.isEmpty()) {
            sb.append("- Nhu cầu sử dụng: ").append(String.join(", ", usagePurpose)).append("\n");
            hasMemory = true;
        }
        if (!preferredFeatures.isEmpty()) {
            sb.append("- Tính năng quan tâm: ").append(String.join(", ", preferredFeatures)).append("\n");
            hasMemory = true;
        }
        
        return hasMemory ? sb.toString() : "";
    }

    /**
     * Một turn trong cuộc hội thoại.
     */
    @Data
    @AllArgsConstructor
    public static class ConversationTurn {
        private String userMessage;
        private String botResponse;
        private LocalDateTime timestamp;
    }
}
