package com.tmdt.phone_store_backend.ai.rag;

import com.tmdt.phone_store_backend.domain.entity.Product;
import com.tmdt.phone_store_backend.domain.entity.ProductVariant;
import com.tmdt.phone_store_backend.domain.enums.ProductStatus;
import com.tmdt.phone_store_backend.repository.ProductRepository;
import com.tmdt.phone_store_backend.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service xây dựng context từ sản phẩm cho RAG pipeline.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ProductContextBuilder {

    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;

    /**
     * Xây dựng context sản phẩm từ query.
     */
    public String buildContext(String query, String sessionId, int limit) {
        // Extract search criteria từ query
        SearchCriteria criteria = extractSearchCriteria(query);
        
        // Query sản phẩm
        List<Product> products = queryProducts(criteria, limit);
        
        if (products.isEmpty()) {
            // Fallback: lấy sản phẩm trending/featured
            products = getFallbackProducts(limit);
        }
        
        return buildContextTextFromProducts(products);
    }

    /**
     * Xây dựng context từ danh sách product IDs.
     */
    public String buildContextFromProductIds(List<Long> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return "";
        }
        
        List<Product> products = productRepository.findAllById(productIds);
        return buildContextTextFromProducts(products);
    }

    /**
     * Trích xuất search criteria từ query.
     */
    public SearchCriteria extractSearchCriteria(String query) {
        String lower = query.toLowerCase();
        SearchCriteria criteria = new SearchCriteria();
        
        // Extract budget
        extractBudget(lower, criteria);
        
        // Detect brand
        criteria.setBrand(detectBrand(lower));
        
        // Detect categories/features
        detectCategories(lower, criteria);
        
        // Detect RAM
        extractRam(lower, criteria);
        
        // Detect storage
        extractStorage(lower, criteria);
        
        // Set original query
        criteria.setOriginalQuery(query);
        
        return criteria;
    }

    private void extractBudget(String query, SearchCriteria criteria) {
        // Pattern: "dưới X triệu"
        java.util.regex.Pattern underPattern = 
            java.util.regex.Pattern.compile("dưới\\s*(\\d+)");
        java.util.regex.Matcher underMatcher = underPattern.matcher(query);
        if (underMatcher.find()) {
            criteria.setMaxBudget(new BigDecimal(underMatcher.group(1)).multiply(new BigDecimal("1000000")));
        }
        
        // Pattern: "trên X triệu"
        java.util.regex.Pattern abovePattern = 
            java.util.regex.Pattern.compile("trên\\s*(\\d+)");
        java.util.regex.Matcher aboveMatcher = abovePattern.matcher(query);
        if (aboveMatcher.find()) {
            criteria.setMinBudget(new BigDecimal(aboveMatcher.group(1)).multiply(new BigDecimal("1000000")));
        }
        
        // Pattern: "X triệu" (exact)
        java.util.regex.Pattern exactPattern = 
            java.util.regex.Pattern.compile("(\\d+)\\s*triệu(?!\\s*từ|\\s*đến)");
        java.util.regex.Matcher exactMatcher = exactPattern.matcher(query);
        if (exactMatcher.find() && criteria.getMaxBudget() == null) {
            criteria.setMaxBudget(new BigDecimal(exactMatcher.group(1)).multiply(new BigDecimal("1000000")));
        }
    }

    private String detectBrand(String query) {
        if (query.contains("iphone") || query.contains("apple")) return "iphone";
        if (query.contains("samsung") || query.contains("galaxy")) return "samsung";
        if (query.contains("xiaomi") || query.contains("redmi") || query.contains("poco")) return "xiaomi";
        if (query.contains("oppo")) return "oppo";
        if (query.contains("vivo")) return "vivo";
        if (query.contains("realme")) return "realme";
        if (query.contains("nokia")) return "nokia";
        return null;
    }

    private void detectCategories(String query, SearchCriteria criteria) {
        List<String> features = new ArrayList<>();
        
        if (containsAny(query, "gaming", "chơi game", "chiến game", "hiệu năng cao")) {
            features.add("gaming");
        }
        if (containsAny(query, "camera", "chụp ảnh", "chụp hình", "nhiếp ảnh", "selfie")) {
            features.add("camera");
        }
        if (containsAny(query, "pin", "trâu", "dung lượng", "thời lượng")) {
            features.add("pin");
        }
        if (containsAny(query, "mỏng", "nhẹ", "gọn", "thời trang")) {
            features.add("slim");
        }
        if (containsAny(query, "5g", "mạng nhanh")) {
            features.add("5g");
        }
        
        criteria.setFeatures(features);
    }

    private void extractRam(String query, SearchCriteria criteria) {
        java.util.regex.Pattern pattern = 
            java.util.regex.Pattern.compile("(\\d+)\\s*gb\\s*ram|ram\\s*(\\d+)", 
                java.util.regex.Pattern.CASE_INSENSITIVE);
        java.util.regex.Matcher matcher = pattern.matcher(query);
        if (matcher.find()) {
            String ram = matcher.group(1) != null ? matcher.group(1) : matcher.group(2);
            criteria.setMinRam(Integer.parseInt(ram));
        }
    }

    private void extractStorage(String query, SearchCriteria criteria) {
        java.util.regex.Pattern pattern = 
            java.util.regex.Pattern.compile("(\\d+)\\s*gb\\s*(bộ nhớ|rom|storage)", 
                java.util.regex.Pattern.CASE_INSENSITIVE);
        java.util.regex.Matcher matcher = pattern.matcher(query);
        if (matcher.find()) {
            criteria.setMinStorage(Integer.parseInt(matcher.group(1)));
        }
    }

    private boolean containsAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword)) return true;
        }
        return false;
    }

    private List<Product> queryProducts(SearchCriteria criteria, int limit) {
        List<Product> products = productRepository.findByDeletedAtIsNullOrderByCreatedAtDesc();
        
        return products.stream()
            .filter(p -> p.getStatus() == ProductStatus.ACTIVE)
            .filter(p -> criteria.getBrand() == null || 
                (p.getBrand() != null && p.getBrand().getName().toLowerCase().contains(criteria.getBrand())))
            .filter(p -> matchesFeatures(p, criteria.getFeatures()))
            .limit(limit)
            .collect(Collectors.toList());
    }

    private boolean matchesFeatures(Product p, List<String> features) {
        if (features == null || features.isEmpty()) return true;
        
        String searchable = (p.getName() + " " + 
            (p.getShortDescription() != null ? p.getShortDescription() : "") +
            (p.getDetailDescription() != null ? p.getDetailDescription() : "")).toLowerCase();
        
        for (String feature : features) {
            switch (feature) {
                case "gaming":
                    if (searchable.contains("gaming") || searchable.contains("rog") || 
                        searchable.contains("legion")) return true;
                    break;
                case "camera":
                    if (searchable.contains("camera") || searchable.contains("108mp") || 
                        searchable.contains("50mp")) return true;
                    break;
                case "5g":
                    if (searchable.contains("5g")) return true;
                    break;
                default:
                    if (searchable.contains(feature)) return true;
            }
        }
        return true; // No specific filter, accept all
    }

    private List<Product> getFallbackProducts(int limit) {
        List<Product> products = productRepository.findByDeletedAtIsNullOrderByCreatedAtDesc();
        
        return products.stream()
            .filter(p -> p.getStatus() == ProductStatus.ACTIVE)
            .filter(p -> p.getIsFeatured() != null && p.getIsFeatured())
            .limit(limit)
            .collect(Collectors.toList());
    }

    private String buildContextFromProducts(List<Product> products) {
        if (products.isEmpty()) {
            return "Không có sản phẩm phù hợp trong cơ sở dữ liệu.";
        }
        
        StringBuilder sb = new StringBuilder();
        sb.append("THÔNG TIN SẢN PHẨM CÓ SẴN:\n\n");
        
        for (Product product : products) {
            sb.append(buildProductText(product));
            sb.append("\n---\n\n");
        }
        
        return sb.toString();
    }

    private String buildProductText(Product product) {
        StringBuilder sb = new StringBuilder();
        
        sb.append("📱 ").append(product.getName()).append("\n");
        
        if (product.getBrand() != null) {
            sb.append("🏷️ Hãng: ").append(product.getBrand().getName()).append("\n");
        }
        
        if (product.getCategory() != null) {
            sb.append("📂 Danh mục: ").append(product.getCategory().getName()).append("\n");
        }
        
        // Variants info
        List<ProductVariant> variants = variantRepository
            .findByProductIdAndDeletedAtIsNullOrderByPriceAsc(product.getId());
        
        if (!variants.isEmpty()) {
            sb.append("💰 Giá: ").append(formatPrice(variants.get(0).getPrice()));
            if (variants.size() > 1) {
                sb.append(" - ").append(formatPrice(variants.get(variants.size() - 1).getPrice()));
            }
            sb.append("\n");
            
            sb.append("📦 Các phiên bản:\n");
            for (ProductVariant variant : variants) {
                sb.append(String.format("   - %s/%sGB, %s: %s\n",
                    variant.getRamGb(), variant.getStorageGb(), 
                    variant.getColor(), formatPrice(variant.getPrice())));
            }
        }
        
        // Short description
        if (product.getShortDescription() != null) {
            sb.append("📝 Mô tả: ").append(product.getShortDescription()).append("\n");
        }
        
        // Warranty
        if (product.getWarrantyMonths() != null) {
            sb.append("🛡️ Bảo hành: ").append(product.getWarrantyMonths()).append(" tháng\n");
        }
        
        // Sale
        if (product.getSale() != null && product.getSale() > 0) {
            sb.append("🔥 Giảm giá: ").append(product.getSale()).append("%\n");
        }
        
        return sb.toString();
    }

    private String formatPrice(BigDecimal price) {
        if (price == null) return "Liên hệ";
        return String.format("%,.0f VNĐ", price);
    }

    /**
     * Search criteria được trích xuất từ query.
     */
    @lombok.Data
    public static class SearchCriteria {
        private String originalQuery;
        private String brand;
        private BigDecimal minBudget;
        private BigDecimal maxBudget;
        private Integer minRam;
        private Integer minStorage;
        private List<String> features;
    }

    // ============================================================
    // Methods exposed for AIOrchestrator — returns product list
    // ============================================================

    /**
     * Trả về danh sách sản phẩm phù hợp với query, dùng bởi AIOrchestrator
     * để embed product cards vào chat response.
     */
    public List<Product> searchProducts(String query, int limit) {
        SearchCriteria criteria = extractSearchCriteria(query);
        List<Product> products = queryProducts(criteria, limit);
        if (products.isEmpty()) {
            products = getFallbackProducts(limit);
        }
        return products;
    }

    private String buildContextTextFromProducts(List<Product> products) {
        if (products.isEmpty()) {
            return "Không có sản phẩm phù hợp trong cơ sở dữ liệu.";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("THÔNG TIN SẢN PHẨM CÓ SẴN:\n\n");

        for (Product product : products) {
            sb.append(buildProductText(product));
            sb.append("\n---\n\n");
        }

        return sb.toString();
    }
}
